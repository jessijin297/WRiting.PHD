import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,chmodSync,readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';

export function openDatabase(path){
 mkdirSync(dirname(resolve(path)),{recursive:true,mode:0o700});
 const sqlite=new DatabaseSync(path);
 chmodSync(path,0o600);
 sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
 const prepare=sql=>{
  const make=(values=[])=>({
   bind(...next){return make(next);},
   async first(column){const row=sqlite.prepare(sql).get(...values);return row?(column?row[column]:{...row}):null;},
   async all(){return {success:true,results:sqlite.prepare(sql).all(...values).map(row=>({...row})),meta:{}};},
   async run(){return execute(sql,values);},
   _sql:sql,_values:values
  });
  return make();
 };
 const execute=(sql,values)=>{
  const statement=sqlite.prepare(sql);
  const result=statement.run(...values);
  return {success:true,results:[],meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};
 };
 return {
  prepare,
  async batch(statements){
   sqlite.exec('BEGIN IMMEDIATE');
   try{const results=statements.map(s=>execute(s._sql,s._values));sqlite.exec('COMMIT');return results;}
   catch(error){sqlite.exec('ROLLBACK');throw error;}
  },
  sqlite,
  close(){sqlite.close();}
 };
}

export function migrateDatabase(path,directory){
 const database=openDatabase(path),sqlite=database.sqlite;
 try{
  sqlite.exec('CREATE TABLE IF NOT EXISTS wrtbu_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at INTEGER NOT NULL)');
  for(const name of readdirSync(directory).filter(name=>/^\d+_.+\.sql$/.test(name)).sort()){
   const sql=readFileSync(resolve(directory,name),'utf8');
   const checksum=createHash('sha256').update(sql).digest('hex');
   const previous=sqlite.prepare('SELECT checksum FROM wrtbu_migrations WHERE name=?').get(name);
   if(previous){if(previous.checksum!==checksum)throw Error('已应用的数据库迁移发生变化：'+name);continue;}
   sqlite.exec('BEGIN IMMEDIATE');
   try{sqlite.exec(sql);sqlite.prepare('INSERT INTO wrtbu_migrations VALUES (?,?,?)').run(name,checksum,Date.now());sqlite.exec('COMMIT');}
   catch(error){sqlite.exec('ROLLBACK');throw error;}
  }
 }finally{database.close();}
}

const connection=Symbol.for('wrtbu.node.database');
export const env=new Proxy({}, {get(_target,name){
 if(name==='DB'){
  const path=process.env.WRTBU_DATABASE_PATH;
  if(!path)throw Error('请配置服务器数据库路径。');
  return globalThis[connection]??=openDatabase(path);
 }
 if(name==='WRTBU_HOST')return 'node';
 return process.env[name];
}});
