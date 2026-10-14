// Read either a normal Responses JSON object or its streamed terminal event.
// Never return partial generated text as a completed review.
export async function readAIResponse(response:Response){
 if(!response.headers.get('content-type')?.includes('text/event-stream'))return response.json();
 if(!response.body)throw new TypeError('Empty AI response stream');
 const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',size=0;
 try{
  for(;;){
   const chunk=await reader.read();if(chunk.done)break;
   size+=chunk.value.length;if(size>3000000)throw new TypeError('AI response stream exceeds limit');
   pending+=decoder.decode(chunk.value,{stream:true});pending=pending.replace(/\r\n/g,'\n');
   let boundary;
   while((boundary=pending.indexOf('\n\n'))>=0){
    const event=pending.slice(0,boundary);pending=pending.slice(boundary+2);
    const data=event.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
    if(!data)continue;
    const item=JSON.parse(data);
    if(['response.completed','response.incomplete','response.failed'].includes(item.type)){
     if(!item.response)throw new TypeError('AI terminal event has no response');
     return item.response;
    }
   }
  }
  throw new TypeError('AI response stream ended before completion');
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
