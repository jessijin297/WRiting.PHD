export async function api(path:string,data?:any,options?:{timeoutMs?:number}){
 const review=path.endsWith('/review')||path.endsWith('/transition')&&data?.action==='submit-revision';
 try{
  const r=await fetch('/api/'+path,{method:data?'POST':'GET',credentials:'same-origin',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined,signal:options?.timeoutMs?AbortSignal.timeout(options.timeoutMs):undefined});
  let d:any;
  try{d=await r.json();}catch(e:any){
   if(e.name==='TimeoutError'||e.name==='AbortError')throw e;
   throw Object.assign(new Error(review?'连接暂时中断，作文已保存。请刷新点评查看结果，未完成时可重试。':'连接暂时中断，请稍后重试。'),{status:r.ok?502:r.status});
  }
  if(!r.ok)throw Object.assign(new Error(d.error||'暂时无法保存，请重试。'),{status:r.status});
  return d;
 }catch(e:any){
  if(e.name==='TimeoutError'||e.name==='AbortError')throw Object.assign(new Error('判分连接等待超时，作文已保存。请刷新点评查看结果，未完成时可重试。'),{status:408});
  throw e;
 }
}
