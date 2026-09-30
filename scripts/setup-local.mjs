import fs from 'node:fs';
import readline from 'node:readline';
import {Writable} from 'node:stream';
import {randomBytes,scrypt} from 'node:crypto';

if(!process.stdin.isTTY){console.error('请在终端中运行本设置流程。');process.exit(1);}
let muted=false;
const output=new Writable({write(chunk,encoding,callback){if(!muted)process.stdout.write(chunk,encoding);callback();}});
const rl=readline.createInterface({input:process.stdin,output,terminal:true});
const ask=(prompt,hidden=false,trim=true)=>new Promise(resolve=>{process.stdout.write(prompt);muted=hidden;rl.question('',answer=>{muted=false;if(hidden)process.stdout.write('\n');resolve(trim?answer.trim():answer);});});
const root=new URL('../',import.meta.url),file=new URL('.env.local',root);
let text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
function put(name,value){const line=name+'='+value;const pattern=new RegExp('^'+name+'=.*$','m');text=pattern.test(text)?text.replace(pattern,()=>line):text.trimEnd()+'\n'+line+'\n';}
console.log('WRTBU 后台设置。密钥与密码输入不会显示；回车可保留已有密钥。');
try{
 const key=await ask('DeepSeek API 密钥：',true);
 if(key){if(!/^[A-Za-z0-9_-]{12,256}$/.test(key))throw Error('密钥格式不正确，请重新运行。');put('DEEPSEEK_API_KEY',key);}
 let username=await ask('管理者用户名（例如 owner）：');
 if(!/^[\p{L}\p{N}_\-.]{2,24}$/u.test(username))throw Error('管理者用户名需要 2–24 个汉字、字母、数字或 _ . -。');
 const pass=await ask('管理者密码（至少 10 个字符）：',true,false),confirm=await ask('再输入一次管理者密码：',true,false);
 if(pass.length<10||pass.length>128||pass!==confirm)throw Error('密码长度不正确或两次不一致，请重新运行。');
 const salt=randomBytes(16).toString('hex');const derived=await new Promise((resolve,reject)=>scrypt(pass,salt,32,{N:32768,r:8,p:3,maxmem:64*1024*1024},(e,k)=>e?reject(e):resolve(k)));
 put('ADMIN_USERNAME',username);put('ADMIN_PASSWORD_HASH',`scrypt:32768:8:3:${salt}:${derived.toString('hex')}`);put('ADMIN_AUTH_MODE','password');put('AI_PROVIDER','deepseek');put('DEEPSEEK_MODEL','deepseek-flash');
 fs.writeFileSync(file,text,{mode:0o600});fs.chmodSync(file,0o600);
 console.log('设置已保存。请重新启动网站，然后打开 /teacher 登录。没有保存明文管理者密码，也没有上传任何密钥。');
}catch(e){console.error(e.message);process.exitCode=1;}finally{rl.close();}
