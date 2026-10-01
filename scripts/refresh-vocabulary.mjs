import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const sources=[
 ['general','GRE','https://www.ets.org/gre/test-takers/general-test/prepare/content/analytical-writing/issue.html'],
 ['general','TOEFL','https://www.ets.org/toefl/test-takers/ibt/about/content/writing.html'],
 ['general','IELTS','https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing'],
 ['general','IELTS','https://ielts.org/take-a-test/preparation-resources/writing-test-resources'],
 ['education','all','https://www.unesco.org/en/education'],['technology','all','https://www.oecd.org/en/topics/digital.html'],
 ['environment','all','https://www.oecd.org/en/topics/climate-change.html'],['health','all','https://www.who.int/news-room/fact-sheets/detail/physical-activity'],
 ['society','all','https://www.oecd.org/en/topics/governance.html'],['economy','all','https://www.oecd.org/en/topics/economy.html'],
 ['culture','all','https://www.unesco.org/en/culture'],['work','all','https://www.oecd.org/en/topics/employment.html']
];
const allowed=new Set(sources.map(s=>s[2]));
const stops=new Set('a an the is are was were be been being it its this that these those my your our their his her he she they we you i to of for with by at from as in on or and but so if then than which who whom what when where how why not no yes can could would should will may might must have has had do does did such also more most less much many some any each other all both only very here there new about into over under through up out per using used use please click share search select read learn find news image images related page pages menu home cookie cookies policy privacy copyright rights reserved website content skip back next test tests tasks task writing section questions question words word ielts ets toefl gre english academic number minutes us minutes score scores band bands preparation resources contact information following example examples see view'.split(' '));
const hash=s=>createHash('sha256').update(s).digest('hex');
export function extract(record){
 if(!allowed.has(record.url))throw Error('来源不在固定官方白名单中。');
 const text=record.text.normalize('NFKC').replace(/\s+/g,' ').trim();
 const sentences=text.split(/[.!?;:\n]+/);const terms=new Map();
 for(const sentence of sentences){
  const tokens=(sentence.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g)||[]);
  for(let i=0;i<tokens.length;i++){
   const word=tokens[i];if(word.length>=6&&!stops.has(word))terms.set(word,'word');
   for(const n of [2,3]){const group=tokens.slice(i,i+n);if(group.length!==n||stops.has(group[0])||stops.has(group.at(-1))||group.some(w=>w.length<2)||group.every(w=>w.length<5))continue;const term=group.join(' ');if(text.toLowerCase().includes(term))terms.set(term,'phrase');}
  }
 }
 const source={url:record.url,title:record.title,fetchedAt:record.retrievedAt,textHash:hash(text),retrieval:record.retrieval||'https-fetch',verified:true};
 return [...terms].map(([term,kind])=>({id:hash(record.url+'|'+term).slice(0,24),term,kind,topic:record.topic,exams:record.exams,sourceType:record.sourceType,source}));
}
function article(html){
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
 if(!main)throw Error('未找到正文区域；请用官方正文快照更新，不抽取导航菜单。');
 return main.replace(/<(script|style|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|amp|quot|lt|gt);/g,' ').replace(/\s+/g,' ').trim();
}
async function run(){
 const at=process.argv.indexOf('--snapshots');let records;
 if(at>=0)records=JSON.parse(await readFile(process.argv[at+1],'utf8'));
 else{records=[];for(const [topic,exam,url] of sources){const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('官方来源读取失败：'+url);const html=await r.text();records.push({topic,url,title:html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]||url,text:article(html),retrievedAt:new Date().toISOString(),exams:exam==='all'?['IELTS','GRE','TOEFL']:[exam],sourceType:exam==='all'?'institution':'exam'});}}
 for(const url of allowed)if(!records.some(r=>r.url===url))throw Error('缺少官方来源：'+url);
 const items=records.flatMap(extract);for(const exam of ['IELTS','GRE','TOEFL'])if(items.filter(i=>i.sourceType==='exam'&&i.exams.includes(exam)).length<20)throw Error('考试官方候选不足：'+exam);
 const sourceRows=records.map(r=>({topic:r.topic,exams:r.exams,sourceType:r.sourceType,...extract(r)[0].source}));const compact=items.map(i=>[i.id,i.term,i.kind==='phrase'?'p':'w',sourceRows.findIndex(s=>s.url===i.source.url)]);
 await writeFile(new URL('../lib/vocabulary-catalog.json',import.meta.url),JSON.stringify({version:2,updatedAt:new Date().toISOString(),sources:sourceRows,items:compact})+'\n');console.log(JSON.stringify({officialSources:records.length,candidates:items.length,examPools:Object.fromEntries(['IELTS','GRE','TOEFL'].map(exam=>[exam,items.filter(i=>i.sourceType==='exam'&&i.exams.includes(exam)).length]))}));
}
if(process.argv[1]===fileURLToPath(import.meta.url))run().catch(e=>{console.error(e.message);process.exitCode=1;});
