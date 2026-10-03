export type DiffPart={type:'equal'|'add'|'remove';text:string};
const tokens=(s:string)=>s.match(/\s+|[\p{L}\p{N}_’'-]+|[^\s\p{L}\p{N}_’'-]/gu)||[];
function compact(parts:DiffPart[]){const out:DiffPart[]=[];for(const p of parts){if(!p.text)continue;const last=out.at(-1);if(last?.type===p.type)last.text+=p.text;else out.push({...p});}return out;}
export function diffText(before:string,after:string):DiffPart[]{
 if(before===after)return [{type:'equal',text:before}];
 const a=tokens(before),b=tokens(after);const trace:Map<number,number>[]=[],v=new Map<number,number>([[1,0]]);let steps=0;
 for(let d=0;d<=Math.min(a.length+b.length,900);d++){
  trace.push(new Map(v));
  for(let k=-d;k<=d;k+=2){
   let x=k===-d||(k!==d&&(v.get(k-1)??-1)<(v.get(k+1)??-1))?(v.get(k+1)||0):(v.get(k-1)||0)+1;
   let y=x-k;while(x<a.length&&y<b.length&&a[x]===b[y]){x++;y++;}v.set(k,x);
   if(++steps>500000)break;
   if(x>=a.length&&y>=b.length){
    const parts:DiffPart[]=[];
    for(let depth=d;depth>=0;depth--){const previous=trace[depth],diagonal=x-y;
     const previousK=diagonal===-depth||(diagonal!==depth&&(previous.get(diagonal-1)??-1)<(previous.get(diagonal+1)??-1))?diagonal+1:diagonal-1;
     const previousX=previous.get(previousK)||0,previousY=previousX-previousK;
     while(x>previousX&&y>previousY){parts.push({type:'equal',text:a[x-1]});x--;y--;}
     if(depth>0){if(x===previousX){parts.push({type:'add',text:b[y-1]});y--;}else{parts.push({type:'remove',text:a[x-1]});x--;}}
    }
    return compact(parts.reverse());
   }
  }
  if(steps>500000)break;
 }
 // An extensive rewrite is represented honestly as one replacement, with exact shared edges.
 let start=0;while(start<Math.min(before.length,after.length)&&before[start]===after[start])start++;
 let end=0;while(end<Math.min(before.length,after.length)-start&&before.at(-1-end)===after.at(-1-end))end++;
 return compact([{type:'equal',text:before.slice(0,start)},{type:'remove',text:before.slice(start,before.length-end)},{type:'add',text:after.slice(start,after.length-end)},{type:'equal',text:end?before.slice(-end):''}]);
}
export type ActualChange={id:string;before:string;after:string;start:number;end:number};
export function actualChanges(before:string,after:string):ActualChange[]{
 const parts=diffText(before,after),changes:ActualChange[]=[];let position=0,current:ActualChange|null=null;
 for(let i=0;i<parts.length;i++){
  const part=parts[i];
  if(part.type==='equal'){
   if(current&&part.text.length<24&&i+1<parts.length&&parts[i+1].type!=='equal'){current.before+=part.text;current.after+=part.text;current.end+=part.text.length;}
   else if(current){changes.push(current);current=null;}
   position+=part.text.length;
  }else{
   current??={id:'',before:'',after:'',start:position,end:position};
   if(part.type==='remove'){current.before+=part.text;position+=part.text.length;current.end=position;}else current.after+=part.text;
  }
 }
 if(current)changes.push(current);
 return changes.map((c,i)=>({...c,id:'change-'+(i+1)}));
}
