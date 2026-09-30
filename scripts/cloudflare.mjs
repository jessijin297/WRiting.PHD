import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import './sites-env.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const action=process.argv[2];
const run=(args,options={})=>{const r=spawnSync(process.execPath,args,{cwd:root,env:{...process.env,WRTBU_HOST:'cloudflare'},stdio:'inherit',...options});if(r.error)throw r.error;if(r.status)process.exit(r.status);};
const wrangler=fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js',import.meta.url));
if(action==='build'){run(['scripts/run-framework.mjs','build']);}
else if(action==='dev'){run(['scripts/run-framework.mjs','dev']);}
else{
 const config=JSON.parse(fs.readFileSync(new URL('../wrangler.cloudflare.jsonc',import.meta.url),'utf8'));
 if(config.d1_databases[0].database_id==='00000000-0000-4000-8000-000000000000')throw Error('请先在 wrangler.cloudflare.jsonc 填写你创建的 D1 数据库 ID。');
 if(action==='migrate')run([wrangler,'d1','migrations','apply','DB','--remote','--config','wrangler.cloudflare.jsonc']);
 else if(action==='deploy')run([wrangler,'deploy','--config','dist/server/wrangler.json']);
 else if(action==='secrets'){
  const text=fs.readFileSync(new URL('../.env.local',import.meta.url),'utf8'),values={};
  for(const name of ['DEEPSEEK_API_KEY','ADMIN_USERNAME','ADMIN_PASSWORD_HASH']){const match=text.match(new RegExp('^'+name+'=(.*)$','m'));if(!match?.[1].trim())throw Error(name+' 尚未配置，请先运行 npm run setup:local。');values[name]=match[1].trim();}
  console.log('将三项后台设置保存为当前 Cloudflare Worker 的秘密。不会上传作文或学生数据。');
  run([wrangler,'secret','bulk','--config','wrangler.cloudflare.jsonc'],{stdio:['pipe','inherit','inherit'],input:JSON.stringify(values)});
 }else throw Error('Unknown action');
}
