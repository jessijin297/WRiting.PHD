const reviewCalls=new Set(['draft_review','final_review','revision_priority','sentence_refinement','review_criteria','review_repair']);
export const isReviewCall=(name:string)=>reviewCalls.has(name);
export const reviewBudgetMs=300000;
export const reviewClientTimeoutMs=360000;

// Bound the whole call, including a retry and reading the response body.
export async function requestAI<T>(name:string,operation:(signal:AbortSignal)=>Promise<T>,deadline=Infinity):Promise<T>{
 const review=reviewCalls.has(name),primary=['draft_review','final_review'].includes(name);
 const original=['vocabulary_plan','vocabulary_repair'].includes(name)?120000:name==='practice_feedback'?90000:55000;
 const budget=review?(primary?180000:110000):original;
 const end=Math.min(deadline,Date.now()+budget),attemptTimeout=review?(primary?120000:75000):original;
 for(let attempt=0;;attempt++){
  const remaining=end-Date.now();
  if(remaining<=0)throw new DOMException('Review deadline reached','TimeoutError');
  const started=Date.now();
  try{const result=await operation(AbortSignal.timeout(Math.min(attemptTimeout,remaining)));if(review)console.info('WRTBU AI completed',name,{attempt:attempt+1,elapsedMs:Date.now()-started});return result;}
  catch(e:any){
   const timeout=e.name==='TimeoutError'||e.name==='AbortError';
   const transient=timeout||e.name==='TypeError'||e.retryable===true;
   const delay=Math.max(300,Number.isFinite(e.retryAfterMs)?e.retryAfterMs:0);
   console.warn('WRTBU AI attempt failed',name,{attempt:attempt+1,reason:timeout?'timeout':e.retryable?'upstream':e.name==='TypeError'?'network':'rejected',elapsedMs:Date.now()-started});
   if(!review||attempt>=1||!transient||delay>5000||end-Date.now()<=delay)throw e;
   await new Promise(resolve=>setTimeout(resolve,delay));
  }
 }
}
