import {env} from 'cloudflare:workers';
export const runtime=env as any;
export function db(){if(!runtime.DB)throw new Error('数据服务尚未准备好，请保留输入并稍后重试。');return runtime.DB as D1Database;}
export function error(message:string,status=400){return Object.assign(new Error(message),{status});}
