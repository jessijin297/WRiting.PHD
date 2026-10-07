import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {migrateDatabase} from '../lib/node-database.mjs';
const root=resolve('.'),scratch=mkdtempSync(join(root,'.writing-qa-v5-')),temp=mkdtempSync(join(tmpdir(),'wrtbu-v5-')),results=[];
const check=(name,value)=>{assert.ok(value,name);results.push({name,passed:true});console.log(name+' ✓');};
const pair=text=>({zh:'测试：'+text,en:'Test: '+text});
const cases=[
 ['spelling','Universitys offer many courses.','Universities offer many courses.','word_accuracy'],
 ['word_choice','Students can make research.','Students can conduct research.','word_accuracy'],
 ['writing_convention','however, students need time.','However, students need time.','word_accuracy'],
 ['minor_grammar','Many students believes in practice.','Many students believe in practice.','meaning_grammar'],
 ['sentence_upgrade','Students want useful lessons.','Students seek learning that has practical value.','style'],
 ['sentence_structure','Because students learning different subjects and they is useful.','Studying different subjects can be useful to students.','meaning_grammar'],
 ['logic','All practical courses guarantee employment.','Practical courses can improve preparation for work, but cannot guarantee employment.','reasoning_gap'],
 ['example','My cousin likes music, so every engineering course improves communication.','An engineering student could practise explaining a design to a client to develop communication skills.','reasoning_gap']
];
const extra='A small elective can be useful.';
const essay=cases.map(c=>c[1]).join(' ')+` ${extra} Students also need time to develop their main professional skills. Universities can offer a core curriculum and let students choose a few other subjects. This gives students a manageable opportunity to connect specialist knowledge with other perspectives. These connections require active practice rather than simply attending a class.`;
const originalFetch=globalThis.fetch;
try{
 const database=join(temp,'qa.sqlite');migrateDatabase(database,join(root,'drizzle'));
 process.env.WRTBU_DATABASE_PATH=database;process.env.WRTBU_PUBLIC_ORIGIN='http://localhost';process.env.DEEPSEEK_API_KEY='fixture';
 const bundle=join(scratch,'logic.mjs');await build({stdin:{contents:"export * from './lib/draft-review';export * from './lib/revision-policy';export * from './lib/writing-rubrics';export * from './lib/practice-feedback';export * from './lib/server';",resolveDir:root,loader:'ts'},outfile:bundle,bundle:true,platform:'node',format:'esm',packages:'external',alias:{'cloudflare:workers':join(root,'lib/node-database.mjs'),'next/headers':'next/headers.js','next/navigation':'next/navigation.js'},define:{__WRTBU_PUBLIC_HOST__:'true','import.meta.env.DEV':'false'},logLevel:'silent'});
 const m=await import(pathToFileURL(bundle).href),d=m.db();
 await d.prepare("INSERT INTO student_accounts VALUES ('qa','qa','qa','fixture',0,'qa',1,1)").run();
 await d.prepare("INSERT INTO sessions (id,user_id,exam,prompt,target,duration,stage,notes,draft,original,reflection,created_at,updated_at,workflow_version,writing_mode,ui_language,topic_type) VALUES ('v5','qa','IELTS','Discuss universities and employment',250,40,'polishing','{}',?,?,'',1,1,3,'ielts_task2','en','education')").bind(essay,essay).run();
 let s=await m.own('v5','qa');
 const score=text=>({overall:6,criteria:m.rubricFor('ielts_task2').criterionIds.map(criterion=>({criterion,score:6,quote:text.slice(0,30),explanation:pair('Evidence-based diagnostic')}))});
 let calls=[];
 const planner=async(_instructions,input,_schema,name)=>{
  calls.push({name,input});
  if(name==='draft_review')return {summary:pair('Review all levels of writing'),score:score(essay),imageCheck:{readable:true,uncertainties:pair('No image required')},logic:[{quote:cases[6][1],observation:pair('An unsupported guarantee'),nextQuestion:pair('What other factors affect employment?')}],edits:[...cases.map(([learningType,before,after,category])=>({learningType,before,after,category,criterion:['logic','example'].includes(learningType)?'task':'grammar',occurrence:1,alternatives:[],why:pair('Specific issue'),question:pair('Consider the mechanism')})),{before:extra,after:'According to a fabricated report, 99% of electives guarantee employment.',occurrence:1,alternatives:[],criterion:'task',category:'reasoning_gap',learningType:'logic',why:pair('Unsafe invented evidence'),question:pair('Why?')}]};
  if(name==='revision_priority')return {items:input.changes.map(c=>({id:c.id,category:c.category,learningType:c.learningType,safe:c.before!==extra,explanation:pair(c.before===extra?'Invented statistics are unsafe':'Audited mechanism')}))};
  if(name==='revision_choice')return {understood:input.chosenExpression!=='Unacceptable wording.',feedback:pair('Wording confirmed without a reason'),nextQuestion:pair('Choose suitable wording if needed')};
  if(name==='revision_understanding')return {understood:input.explanation==='原来的因果关系不成立，学习课程只能增加就业准备，不能保证每个人都找到工作。'||input.explanation.startsWith('The meaning'),feedback:pair('Check the substantive mechanism'),nextQuestion:pair('Which connection changes?')};
  throw Error('Unexpected planner call: '+name);
 };
 const excerptPlan=await planner('',{},null,'draft_review');excerptPlan.score.criteria[1].quote=cases[0][1]+' ... '+cases[1][1];
 const excerptReview=m.validateDraftReview(excerptPlan,s);
 check('省略号证据只有片段均真实且有序时才恢复为完整原文',excerptReview.score.criteria[1].quote===cases[0][1]+' '+cases[1][1]);
 const fabricated=await planner('',{},null,'draft_review');fabricated.score.criteria[0].quote='Invented quoted sentence ... Another invented sentence';assert.throws(()=>m.validateDraftReview(fabricated,s));
 check('伪造引用不能通过省略号恢复或其他证据检查',true);
 const review=await m.generateReview(s,'draft',planner);
 check('点评包含正确句子的提升、逻辑修正与例子修正',review.edits.some(c=>c.learningType==='sentence_upgrade')&&review.edits.some(c=>c.learningType==='logic')&&review.edits.some(c=>c.learningType==='example'));
 check('独立审查剔除不安全的范例且蓝色版本重新构建',review.withheldEdits===1&&review.edits.length===8&&!review.proposal.includes('99%')&&review.proposal.includes(extra));
 check('分类与评分重要性独立：重要的局部语法仍无需理由',review.edits.find(c=>c.learningType==='minor_grammar').priority==='important'&&!review.edits.find(c=>c.learningType==='minor_grammar').requiresExplanation);
 check('第五版点评存储独立策略版本',review.policyVersion==='wrtbu-revision-5');
 for(const c of review.edits){
  const body={kind:'draft',changeId:c.id,choice:'suggestion',answer:c.after,requiresExplanation:false};
  if(m.needsExplanation(c)){
   await assert.rejects(()=>m.explainChange(s,body,planner),e=>e.status===400);
   check(c.learningType+' 服务端拒绝缺少理由，客户端不能绕过',true);
   const denied=await m.explainChange(s,{...body,explanation:'I understand.'},planner);
   check(c.learningType+' 仅同意不能通过理解核对',!denied.understood);
   await m.explainChange(s,{...body,explanation:'The meaning and reasoning relationship is clarified in this chosen expression.'},planner);
  }else{
   const out=await m.explainChange(s,body,planner);
   check(c.learningType+' 无需填写为什么修改即可确认',out.understood&&out.checkMode==='confirmation');
  }
 }
 check('服务端根据分类分别请求确认或理解模型',calls.filter(c=>c.name==='revision_choice').length===5&&calls.filter(c=>c.name==='revision_understanding').length===6);
 check('全部确认与关键理解完成后可进入下一阶段',!!await m.requireUnderstanding(s,'draft'));
 const optional=review.edits.find(c=>c.learningType==='sentence_upgrade');
 const keep=await m.explainChange(s,{kind:'draft',changeId:optional.id,choice:'keep',answer:optional.before},planner);
 check('正确原句可以直接保留，不强制高级改写或理由',keep.understood);
 const spelling=review.edits.find(c=>c.learningType==='spelling');
 const wrong=await m.explainChange(s,{kind:'draft',changeId:spelling.id,choice:'alternative',answer:'Unacceptable wording.'},planner);
 check('免理由仍拒绝不合适的自拟表达',!wrong.understood);
 await assert.rejects(()=>m.requireUnderstanding(s,'draft'),e=>e.status===409);
 await m.explainChange(s,{kind:'draft',changeId:spelling.id,choice:'suggestion',answer:spelling.after},planner);
 const reasoning=review.edits.find(c=>c.learningType==='logic');
 const concise=await m.explainChange(s,{kind:'draft',changeId:reasoning.id,choice:'suggestion',answer:reasoning.after,explanation:'原来的因果关系不成立，学习课程只能增加就业准备，不能保证每个人都找到工作。'},planner);
 check('理解请求保留自然中文解释以及上一轮反馈以供语义判断',concise.understood&&calls.at(-1).input.previousAttempt&&calls.at(-1).input.explanation.includes('因果关系'));
 const evidence=await m.feedbackEvidence(s);
 check('学习报告只把实际填写的理由作为解释证据',evidence.sources.filter(c=>c.source==='explanation').length===3&&evidence.sources.every(c=>c.source!=='explanation'||c.text.trim())&&evidence.confirmations.length===5);
 const teacher=await m.teacherFeedback(s);
 check('教师理解通过率排除简单确认，仅统计三项深层核对',teacher.observables.checks===3&&teacher.observables.understood===3&&teacher.observables.confirmations===5);
 await d.prepare("INSERT INTO sessions (id,user_id,exam,prompt,target,duration,stage,notes,draft,original,reflection,created_at,updated_at,workflow_version,writing_mode,ui_language,topic_type) SELECT 'refinement',user_id,exam,prompt,target,duration,stage,notes,draft,original,reflection,created_at,updated_at,workflow_version,writing_mode,ui_language,topic_type FROM sessions WHERE id='v5'").run();
 const refinementCalls=[];
 const refined=await m.generateReview(await m.own('refinement','qa'),'draft',async(instructions,input,schema,name)=>{
  refinementCalls.push(name);
  if(name==='draft_review'){const p=await planner(instructions,input,schema,name);p.edits=p.edits.filter(c=>c.learningType!=='sentence_upgrade');return p;}
  if(name==='sentence_refinement'){const candidate=input.availableSentences.find(v=>v.before===cases[4][1]);assert.ok(candidate);return {edits:[{...candidate,after:cases[4][2],alternatives:[],criterion:'style',category:'style',learningType:'sentence_upgrade',why:pair('A full correct sentence can be more precise'),question:pair('Optional discussion')}]};}
  if(name==='review_criteria')return {items:input.items.map(i=>({index:i.index,criterion:'grammar'}))};
  return planner(instructions,input,schema,name);
 });
 check('纠错漏掉正确句子提升时单独检查完整未修改句子',refinementCalls.includes('sentence_refinement')&&refinementCalls.includes('review_criteria')&&refined.edits.some(c=>c.learningType==='sentence_upgrade'));

 await d.prepare("UPDATE sessions SET stage='reviewing',draft=? WHERE id='v5'").bind(essay.replace(cases[0][1],'Universitys gives course.')).run();s=await m.own('v5','qa');
 const harmful={id:'harmful',before:cases[0][1],after:'Universitys gives course.',category:'meaning_grammar',learningType:'minor_grammar',safe:false,why:pair('New agreement and spelling errors'),question:pair('Check wording')};
 const finalHash='fixture-final';await d.prepare("INSERT INTO writing_reviews VALUES ('v5','final',?,?,1)").bind(finalHash,JSON.stringify({rubric:m.rubricFor('ielts_task2'),finalHash:m.reviewHash(s.draft),changes:[harmful]})).run();
 const stopped=await m.explainChange(s,{kind:'final',changeId:'harmful',choice:'alternative',answer:harmful.after},async()=>({understood:true,feedback:pair('Misguided approval'),nextQuestion:pair('Continue')}));
 check('独立审查认定有害的润色不会被后续模型错误放行',!stopped.understood&&stopped.nextQuestion.en.includes('return to revision'));
 await assert.rejects(()=>m.requireUnderstanding(s,'final'),e=>e.status===409);
 check('旧版分类仍可读取，正确表达提升按第五版免理由',!m.needsExplanation({category:'style'})&&m.needsExplanation({category:'meaning_grammar'})&&m.learningType({category:'word_accuracy'})==='word_choice'&&!m.needsExplanation({category:'meaning_grammar',before:'Many students believes this.',after:'Many students believe this.'}));
 let coachInput=null;
 globalThis.fetch=async(_url,options)=>{const body=JSON.parse(options.body);coachInput=JSON.parse(body.input);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({observation:{zh:'这是一个局部一致性修正，确认表达即可。',en:'This is a local agreement correction; you can simply confirm your wording.'},question:{zh:'',en:''}})}]}]});};
 const coached=await m.coachDetailed(s,'Do I need to explain this small correction?',[]);
 check('AI 读取当前问题与实际点评，完整回答无需强加追问',coachInput.reviewContext.draft.edits.length===8&&coachInput.question.includes('small correction')&&!coached.content.endsWith('\n\n'));
 globalThis.fetch=async(_url,options)=>{const body=JSON.parse(options.body),input=JSON.parse(body.input);const guarded=body.text.format.name==='writing_coach_audit';if(guarded)assert.ok(input.response.observation.en.includes('For example'));return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(guarded?{safe:false,observation:{zh:'请先想一想你自己的例子如何支撑观点。',en:'Let’s consider how your own example would support the claim.'},question:{zh:'你想到了哪种场景？',en:'What situation have you thought of?'}}:{observation:{zh:'以下是可以直接使用的例子。',en:'For example, an engineer could study ethics and improve a transport design.'},question:{zh:'',en:''}})}]}]});};
 const guarded=await m.coachDetailed({...s,stage:'planning',original:'',draft:''},'Write an example for me.',[]);
 check('构思期独立检查会替换越界的直接例子而保留引导',!guarded.content.includes('For example')&&guarded.content.includes('your own example'));
 check('各类提示词覆盖原意判断、友善反馈与非语言问题',m.draftInstructions.includes('example relevance')&&m.guide.includes('latest QUESTION first')&&m.revisionPolicy.includes('ONLY sentence_structure, logic and example'));
}catch(e){console.error(e);process.exitCode=1;}
finally{globalThis.fetch=originalFetch;globalThis[Symbol.for('wrtbu.node.database')]?.close();delete globalThis[Symbol.for('wrtbu.node.database')];rmSync(scratch,{recursive:true,force:true});rmSync(temp,{recursive:true,force:true});writeFileSync('revision-verification.json',JSON.stringify({checkedAt:new Date().toISOString(),environment:'isolated SQLite and synthetic model outputs; actual review/confirmation/report code',realAIResponseTested:false,results},null,2));}
