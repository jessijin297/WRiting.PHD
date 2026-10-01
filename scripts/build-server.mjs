import {spawnSync} from 'node:child_process';
import {cpSync,mkdirSync,readdirSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{cwd:root,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
if(result.status!==0)process.exit(result.status||1);
// Next may trace a local environment file. Runtime credentials must never be
// included in the portable package, even when building on a configured laptop.
for(const name of readdirSync(new URL('../.next/standalone',import.meta.url))){
 if(name==='.env'||name.startsWith('.env.')||name==='.dev.vars'||name.startsWith('.dev.vars.'))rmSync(new URL('../.next/standalone/'+name,import.meta.url),{force:true});
}
mkdirSync(new URL('../.next/standalone/.next',import.meta.url),{recursive:true});
cpSync(new URL('../.next/static',import.meta.url),new URL('../.next/standalone/.next/static',import.meta.url),{recursive:true});
cpSync(new URL('../public',import.meta.url),new URL('../.next/standalone/public',import.meta.url),{recursive:true});
console.log('服务器页面与静态文件已打包。');
