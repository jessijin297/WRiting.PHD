import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import assert from 'node:assert/strict';
import {migrateDatabase,openDatabase} from '../lib/node-database.mjs';

const directory=mkdtempSync(join(tmpdir(),'wrtbu-server-qa-'));
const database=join(directory,'qa.sqlite');
migrateDatabase(database,resolve('drizzle'));
const password=randomBytes(24).toString('hex'),salt=randomBytes(16).toString('hex');
const passwordHash=`scrypt:32768:8:3:${salt}:${scryptSync(password,salt,32,{N:32768,r:8,p:3,maxmem:64*1024*1024}).toString('hex')}`;
const origin='https://wrtbu-server-qa.invalid',local='http://127.0.0.1:3217';
const results=[];
const child=spawn(process.execPath,[resolve('.next/standalone/server.js')],{env:{...process.env,NODE_ENV:'production',WRTBU_HOST:'node',WRTBU_DATABASE_PATH:database,WRTBU_PUBLIC_ORIGIN:origin,HOSTNAME:'127.0.0.1',PORT:'3217',ADMIN_USERNAME:'qa_admin',ADMIN_PASSWORD_HASH:passwordHash,ADMIN_API_TOKEN:'',ADMIN_AUTH_MODE:'sites',ADMIN_EMAILS:'owner@example.com',DEEPSEEK_API_KEY:'',OPENAI_API_KEY:''},stdio:['ignore','pipe','pipe']});
let readyResolve,readyReject;
const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
let logs='';child.stdout.on('data',data=>{logs+=data;if(logs.includes('Ready in'))readyResolve();});
child.stderr.on('data',()=>{});
child.on('exit',code=>readyReject(Error('测试服务未能启动：'+code)));
const timeout=setTimeout(()=>readyReject(Error('测试服务启动超时')),30000);
async function request(path,body,cookie='',extra={}){
 const r=await fetch(local+path,{method:body===undefined?'GET':'POST',headers:{...(body!==undefined?{Origin:origin,'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...extra},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
 const text=await r.text();let data;try{data=JSON.parse(text);}catch{}
 return {status:r.status,data,text,cookie:r.headers.get('set-cookie')?.split(';')[0]||'',cookieFlags:r.headers.get('set-cookie')||''};
}
function check(name,passed){results.push({name,passed});console.log(JSON.stringify(results.at(-1)));assert.ok(passed,name);}
try{
 await ready;clearTimeout(timeout);
 const studentPage=await request('/'),teacherPage=await request('/teacher');
 check('学生页与独立后台可打开',studentPage.status===200&&studentPage.text.includes('WRTBU')&&teacherPage.status===200&&teacherPage.text.includes('noindex'));
 const me=await request('/api/teacher/auth/me');check('公开服务器强制使用独立管理员密码',me.data.configured===true&&me.data.mode==='password');
 const anonymous=await request('/api/teacher');check('匿名访问后台被拒绝',anonymous.status===403);
 const forged=await request('/api/teacher',undefined,'',{'oai-authenticated-user-email':'owner@example.com','oai-authenticated-user-id':'owner'});check('伪造外部身份不能取得管理权限',forged.status===403);
 const csrf=await request('/api/auth/register',{},'',{Origin:local});check('后台按公开 HTTPS 网址校验提交来源',csrf.status===403);
 const credentials={username:'qa_'+randomBytes(5).toString('hex'),password:randomBytes(24).toString('hex')};
 const register=await request('/api/auth/register',{...credentials,noticeAccepted:true,researchConsent:false});
 check('拒绝额外分享仍可注册',register.status===200&&register.data.student.researchConsent===false);
 check('代理后的 HTTPS 登录 Cookie 安全标记正确',register.cookieFlags.startsWith('__Host-wrtbu_session=')&&register.cookieFlags.includes('HttpOnly')&&register.cookieFlags.includes('Secure')&&register.cookieFlags.includes('SameSite=Lax'));
 const denied=await request('/api/teacher',undefined,register.cookie);check('学生不能访问管理后台',denied.status===403);
 const create=await request('/api/sessions',{exam:'IELTS',prompt:'Should students study other subjects?',duration:40,target:250},register.cookie);assert.equal(create.status,200);const id=create.data.session.id;
 const fixtureDatabase=openDatabase(database);fixtureDatabase.sqlite.prepare('UPDATE sessions SET workflow_version=2 WHERE id=?').run(id);fixtureDatabase.close();
 check('练习与不可变学生编号配对',create.data.session.user_id===register.data.student.id);
 const other=await request('/api/auth/register',{username:'qa_'+randomBytes(5).toString('hex'),password:randomBytes(24).toString('hex'),noticeAccepted:true,researchConsent:false});assert.equal(other.status,200);
 const isolation=await request('/api/sessions/'+id,undefined,other.cookie);check('另一学生无法读取作文',isolation.status===404);
 await request('/api/sessions/'+id+'/transition',{action:'start'},register.cookie);
 const early=await request('/api/sessions/'+id+'/chat',{question:'我该如何连接理由？',requestId:randomUUID()},register.cookie);check('前十分钟 AI 提问仍关闭',early.status===403);
 const original='Students can connect ideas across subjects. I noticed this in a class discussion.';
 const save=await request('/api/sessions/'+id+'/save',{draft:original,notes:{claim:'Study more subjects',reason:'Connect ideas',example:'A class discussion'},events:[{id:randomUUID(),type:'edit',at:Date.now(),detail:{length:original.length}}]},register.cookie);assert.equal(save.status,200);
 const finish=await request('/api/sessions/'+id+'/transition',{action:'finish'},register.cookie);assert.equal(finish.status,200);
 const revised=original+' They should also have enough time for their main subject.';
 const edit=await request('/api/sessions/'+id+'/save',{draft:revised,notes:{},reflection:'I added a limit to my claim.',events:[]},register.cookie);assert.equal(edit.status,200);
 const latest=await request('/api/sessions/'+id,undefined,register.cookie);check('原稿固定、修改稿独立保存',latest.data.session.original===original&&latest.data.session.draft===revised);
 const analyze=await request('/api/sessions/'+id+'/transition',{action:'analyze'},register.cookie);assert.equal(analyze.status,200);
 const report=await request('/api/sessions/'+id+'/transition',{action:'report'},register.cookie);
 check('AI 未连接时保留过程报告并明确提示',report.status===200&&report.data.session.stage==='complete'&&report.data.report.assessment===null&&!!report.data.report.aiWarning&&report.data.report.metrics.editEvents===1);
 const bad=await request('/api/teacher/auth/login',{username:'qa_admin',password:'incorrect-password'});check('管理员错误密码被拒绝',bad.status===401);
 const admin=await request('/api/teacher/auth/login',{username:'qa_admin',password});check('管理员正确密码可登录',admin.status===200&&admin.cookieFlags.startsWith('__Host-wrtbu_teacher=')&&admin.cookieFlags.includes('Secure'));
 const dashboard=await request('/api/teacher',undefined,admin.cookie);const detail=await request('/api/teacher/'+id,undefined,admin.cookie);
 check('管理员能查看配对作文、修改稿和报告',dashboard.status===200&&dashboard.data.totals.accounts===2&&detail.data.session.original===original&&detail.data.session.draft===revised&&!!detail.data.report&&detail.data.events.length===1);
 await request('/api/teacher/auth/logout',{},admin.cookie);const invalidAdmin=await request('/api/teacher',undefined,admin.cookie);check('退出后台立即撤销登录',invalidAdmin.status===403);
 await request('/api/auth/logout',{},register.cookie);const invalid=await request('/api/auth/me',undefined,register.cookie);check('学生退出立即撤销登录',invalid.data.student===null);
 const login=await request('/api/auth/login',credentials);check('学生再次登录仍对应原编号',login.status===200&&login.data.student.id===register.data.student.id);
}catch(error){console.log(JSON.stringify({error:error.message}));process.exitCode=1;}
finally{
 clearTimeout(timeout);if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}rmSync(directory,{recursive:true,force:true});
 writeFileSync('server-verification.json',JSON.stringify({checkedAt:new Date().toISOString(),environment:'temporary local Node production server',realAIResponseTested:false,publicHongKongDeploymentTested:false,results},null,2));
}
