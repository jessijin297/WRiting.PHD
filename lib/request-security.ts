import {runtime} from './database';
export function requestOrigin(req:Request){
 const configured=runtime.WRTBU_PUBLIC_ORIGIN||process.env.WRTBU_PUBLIC_ORIGIN;
 return configured?new URL(configured).origin:new URL(req.url).origin;
}
export function requestSecure(req:Request){return new URL(requestOrigin(req)).protocol==='https:';}
export function requestIP(req:Request){
 // Only the reverse proxy is exposed publicly. It overwrites this header with
 // the connection's IP; the app's port is private to loopback or Docker.
 return runtime.WRTBU_HOST==='node'?(req.headers.get('x-wrtbu-client-ip')||'local'):(req.headers.get('cf-connecting-ip')||'local');
}
