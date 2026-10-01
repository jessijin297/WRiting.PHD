import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {getChatGPTUser} from '../app/chatgpt-auth';
import {db,error,runtime} from './database';
import {limit,verify} from './student-auth';
import {requestSecure,requestIP} from './request-security';

const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const setting=(name:string)=>String(runtime[name]||process.env[name]||'');
// Only the Sites edge may supply trusted identity headers. Public Workers use
// independent administrator credentials and ignore all incoming oai headers.
export const teacherMode=()=>__WRTBU_PUBLIC_HOST__?'password':setting('ADMIN_AUTH_MODE')||(import.meta.env.DEV?'sites':'password');
const username=()=>setting('ADMIN_USERNAME');
const password=()=>setting('ADMIN_PASSWORD_HASH');
const epoch=()=>sha(username()+':'+password());
const name=(req:Request)=>requestSecure(req)?'__Host-wrtbu_teacher':'wrtbu_teacher';
const token=(req:Request)=>(req.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name(req)+'='))?.slice(name(req).length+1)||'';
const cookie=(req:Request,t:string,age:number)=>`${name(req)}=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${requestSecure(req)?'; Secure':''}`;
const reply=(data:any,sessionCookie?:string)=>Response.json(data,{headers:{'Cache-Control':'no-store',...(sessionCookie?{'Set-Cookie':sessionCookie}:{})}});
export async function teacherIdentity(req:Request):Promise<string|null>{
 const bearer=req.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];const configured=setting('ADMIN_API_TOKEN');
 if(configured&&bearer&&timingSafeEqual(Buffer.from(sha(configured),'hex'),Buffer.from(sha(bearer),'hex')))return 'API 管理者';
 if(teacherMode()==='sites'&&!__WRTBU_PUBLIC_HOST__){const user=await getChatGPTUser();const allowed=setting('ADMIN_EMAILS').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);if(user&&allowed.includes(user.email.toLowerCase()))return user.displayName;}
 if(!username()||!password())return null;
 const t=token(req);if(!/^[a-f0-9]{64}$/.test(t))return null;
 const row=await db().prepare('SELECT token_hash FROM teacher_logins WHERE token_hash=? AND credential_epoch=? AND expires_at>?').bind(sha(t),epoch(),Date.now()).first();return row?username():null;
}
export async function requireTeacher(req:Request){const identity=await teacherIdentity(req);if(!identity)throw error('请使用管理者身份登录。学生账号不能访问后台。',403);return identity;}
export async function teacherAuthRoute(req:Request,path:string[],read:(r:Request)=>Promise<any>){
 if(path.length!==3)throw error('找不到此接口。',404);const action=path[2];
 if(action==='me'&&req.method==='GET')return reply({teacher:await teacherIdentity(req),mode:teacherMode(),configured:!!(username()&&password())});
 if(req.method!=='POST')throw error('请求方法不正确。',405);
 if(action==='logout'){await db().prepare('DELETE FROM teacher_logins WHERE token_hash=?').bind(sha(token(req))).run();return reply({ok:true},cookie(req,'',0));}
 if(action!=='login')throw error('找不到此接口。',404);
 if(!username()||!password())throw error('管理者账号尚未设置，请按配置指南完成后台设置。',503);
 const b=await read(req);if(typeof b.username!=='string'||b.username.length>128||typeof b.password!=='string'||b.password.length<10||b.password.length>128)throw error('用户名或密码不正确。',401);
 await limit('teacher-ip:'+requestIP(req),20,15*60000);await limit('teacher-account',10,15*60000);
 const valid=await verify(b.password,password());if(!valid||b.username!==username())throw error('用户名或密码不正确。',401);
 const now=Date.now(),t=randomBytes(32).toString('hex'),ttl=8*60*60*1000;
 await db().batch([db().prepare('DELETE FROM teacher_logins WHERE expires_at<=? OR credential_epoch!=? OR token_hash=?').bind(now,epoch(),sha(token(req))),db().prepare('INSERT INTO teacher_logins (token_hash,credential_epoch,created_at,expires_at) VALUES (?,?,?,?)').bind(sha(t),epoch(),now,now+ttl)]);
 return reply({teacher:username()},cookie(req,t,ttl/1000));
}
