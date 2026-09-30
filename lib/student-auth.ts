import {createHash,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {db,error} from './database';
import {NOTICE_VERSION,Student} from './notices';

const TTL=7*24*60*60*1000;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const cookieName=(req:Request)=>new URL(req.url).protocol==='https:'?'__Host-wrtbu_session':'wrtbu_session';
function token(req:Request){return (req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName(req)+'='))?.slice(cookieName(req).length+1)||'';}
function cookie(req:Request,value:string,maxAge:number){return `${cookieName(req)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
function publicStudent(row:any):Student{return {id:row.id,username:row.username,researchConsent:row.research_consent===1,noticeVersion:row.notice_version,noticeAcceptedAt:row.notice_accepted_at};}
function derive(password:string,salt:string){return new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,32,{N:32768,r:8,p:3,maxmem:64*1024*1024},(err,key)=>err?reject(err):resolve(key)));}
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return `scrypt:32768:8:3:${salt}:${(await derive(password,salt)).toString('hex')}`;}
export async function verify(password:string,stored:string|undefined){const parts=stored?.split(':');const valid=parts?.length===6&&parts.slice(0,4).join(':')==='scrypt:32768:8:3'&&/^[a-f0-9]{32}$/.test(parts[4])&&/^[a-f0-9]{64}$/.test(parts[5]);const derived=await derive(password,valid?parts![4]:'00000000000000000000000000000000');return !!valid&&timingSafeEqual(derived,Buffer.from(parts![5],'hex'));}
function username(value:any){if(typeof value!=='string')throw error('请输入用户名。');const name=value.normalize('NFKC').trim();if(!/^[\p{L}\p{N}_\-.]{2,24}$/u.test(name))throw error('用户名为 2–24 个字母、汉字、数字或 _ . -。');return {name,key:name.toLowerCase()};}
function password(value:any){if(typeof value!=='string'||value.length<10||value.length>128)throw error('密码需要 10–128 个字符。');return value;}
export async function limit(key:string,max:number,period:number){const now=Date.now(),bucket=Math.floor(now/period),id=hash(key+':'+bucket);const row:any=await db().prepare('INSERT INTO auth_attempts (id,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(id,(bucket+1)*period).first();if(row.attempts>max)throw error('尝试次数较多，请稍后再试。',429);return id;}
export async function getStudent(req:Request):Promise<Student|null>{const t=token(req);if(!/^[a-f0-9]{64}$/.test(t))return null;const row=await db().prepare('SELECT a.* FROM student_accounts a JOIN student_logins l ON l.account_id=a.id WHERE l.token_hash=? AND l.expires_at>?').bind(hash(t),Date.now()).first();return row?publicStudent(row):null;}
export async function studentIdentity(req:Request){const s=await getStudent(req);if(!s)throw error('请登录你的学生账号，继续保存和学习。',401);return s.id;}
const reply=(body:any,status=200,sessionCookie?:string)=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...(sessionCookie?{'Set-Cookie':sessionCookie}:{})}});
async function issue(req:Request,account:any){const now=Date.now(),t=randomBytes(32).toString('hex');const old=token(req);await db().batch([db().prepare('DELETE FROM student_logins WHERE expires_at<=? OR token_hash=?').bind(now,hash(old)),db().prepare('DELETE FROM auth_attempts WHERE expires_at<=?').bind(now),db().prepare('INSERT INTO student_logins (token_hash,account_id,created_at,expires_at) VALUES (?,?,?,?)').bind(hash(t),account.id,now,now+TTL)]);return reply({student:publicStudent(account)},200,cookie(req,t,TTL/1000));}
export async function authRoute(req:Request,path:string[],read:(req:Request)=>Promise<any>){
 const action=path[1];if(path.length!==2)throw error('找不到此接口。',404);
 if(action==='me'&&req.method==='GET')return reply({student:await getStudent(req)});
 if(req.method!=='POST')throw error('请求方法不正确。',405);
 if(action==='logout'){const t=token(req);await db().prepare('DELETE FROM student_logins WHERE token_hash=?').bind(hash(t)).run();return reply({ok:true},200,cookie(req,'',0));}
 const b=await read(req);
 if(action==='consent'){const student=await getStudent(req);if(!student)throw error('请先登录。',401);if(typeof b.researchConsent!=='boolean')throw error('请选择是否分享学习数据。');const now=Date.now();await db().batch([db().prepare('UPDATE student_accounts SET research_consent=? WHERE id=?').bind(+b.researchConsent,student.id),db().prepare('INSERT INTO consent_events (id,account_id,research_consent,notice_version,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),student.id,+b.researchConsent,NOTICE_VERSION,now)]);return reply({student:{...student,researchConsent:b.researchConsent}});}
 if(!['register','login'].includes(action))throw error('找不到此接口。',404);
 const name=username(b.username),pass=password(b.password),ip=req.headers.get('cf-connecting-ip')||'local';
 await limit('ip:'+ip,50,15*60*1000);const accountBucket=await limit('name:'+name.key,10,15*60*1000);
 if(action==='register'){
  await limit('register:'+ip,30,60*60*1000);
  if(b.noticeAccepted!==true)throw error('请先阅读并确认两项须知。');
  if(typeof b.researchConsent!=='boolean')throw error('请选择同意或不分享学习数据。');
  if(await db().prepare('SELECT id FROM student_accounts WHERE username_key=?').bind(name.key).first())throw error('这个用户名暂不可用，请换一个。',409);
  const now=Date.now(),account={id:'student:'+crypto.randomUUID(),username:name.name,username_key:name.key,password_hash:await passwordHash(pass),research_consent:+b.researchConsent,notice_version:NOTICE_VERSION,notice_accepted_at:now,created_at:now};
  try{await db().batch([db().prepare('INSERT INTO student_accounts (id,username,username_key,password_hash,research_consent,notice_version,notice_accepted_at,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(account.id,account.username,account.username_key,account.password_hash,account.research_consent,NOTICE_VERSION,now,now),db().prepare('INSERT INTO consent_events (id,account_id,research_consent,notice_version,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),account.id,account.research_consent,NOTICE_VERSION,now)]);}catch(e){if(await db().prepare('SELECT id FROM student_accounts WHERE username_key=?').bind(name.key).first())throw error('这个用户名暂不可用，请换一个。',409);throw e;}
  return issue(req,account);
 }
 const account:any=await db().prepare('SELECT * FROM student_accounts WHERE username_key=?').bind(name.key).first();
 if(!await verify(pass,account?.password_hash))throw error('用户名或密码不正确。',401);
 await db().prepare('DELETE FROM auth_attempts WHERE id=?').bind(accountBucket).run();return issue(req,account);
}
