import {migrateDatabase} from '../lib/node-database.mjs';
import {fileURLToPath} from 'node:url';
if(!process.env.WRTBU_DATABASE_PATH)throw Error('请先设置 WRTBU_DATABASE_PATH。');
migrateDatabase(process.env.WRTBU_DATABASE_PATH,fileURLToPath(new URL('../drizzle',import.meta.url)));
console.log('服务器数据库已准备好。');
