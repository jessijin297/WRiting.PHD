import handler from 'vinext/server/fetch-handler';
export default {
 fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  // Public internet clients cannot supply trusted Sites identity headers.
  const headers=new Headers(request.headers);
  for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-user-'))headers.delete(key);
  return handler.fetch(new Request(request,{headers}),env,ctx);
 }
};
