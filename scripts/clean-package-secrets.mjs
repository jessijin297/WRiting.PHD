import {existsSync,readdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';

// Some build tools copy local runtime settings into nested output folders.
// Deployment packages receive credentials from their host at runtime.
export function cleanPackageSecrets(directory){
 if(!existsSync(directory))return 0;
 let removed=0;
 for(const entry of readdirSync(directory,{withFileTypes:true})){
  const file=join(directory,entry.name);
  if(entry.isSymbolicLink())continue;
  if(entry.isDirectory())removed+=cleanPackageSecrets(file);
  else if(entry.isFile()&&(entry.name==='.env'||entry.name.startsWith('.env.')||entry.name==='.dev.vars'||entry.name.startsWith('.dev.vars.'))){
   rmSync(file);removed++;
  }
 }
 return removed;
}
