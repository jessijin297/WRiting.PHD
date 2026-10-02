export type Language='zh'|'en';
export type Bilingual={zh:string;en:string};
export type WritingMode='ielts_task1'|'ielts_task2'|'gre_issue'|'toefl_discussion';
export const modeFor=(exam:string):WritingMode=>exam==='GRE'?'gre_issue':exam==='TOEFL'?'toefl_discussion':'ielts_task2';
export function writingMode(s:any):WritingMode{return validMode(s.exam,s.writing_mode)?s.writing_mode:modeFor(s.exam);}
export function validMode(exam:string,mode:any){return exam==='IELTS'?['ielts_task1','ielts_task2'].includes(mode):mode===modeFor(exam);}
export const languageFor=(value:any):Language=>value==='en'?'en':'zh';
export const modeNames:Record<WritingMode,Bilingual>={ielts_task1:{zh:'雅思小作文 · Academic Task 1',en:'IELTS Academic · Task 1'},ielts_task2:{zh:'雅思大作文 · Task 2',en:'IELTS · Task 2'},gre_issue:{zh:'GRE · Issue 议论文',en:'GRE · Analyze an Issue'},toefl_discussion:{zh:'托福 · 学术讨论',en:'TOEFL · Academic Discussion'}};
export const noteFields:Record<WritingMode,{key:string;label:Bilingual;hint:Bilingual}[]>={
 ielts_task1:[{key:'features',label:{zh:'特征',en:'Key features'},hint:{zh:'先记录整体趋势、主要差异、极值和可比较的数据。流程图或地图关注阶段和变化，不推测图外原因。',en:'Note the overall pattern, main differences, extremes and useful comparisons. For maps or processes, focus on changes or stages; do not invent causes.'}}],
 ielts_task2:[
  {key:'claim',label:{zh:'观点',en:'Position'},hint:{zh:'用自己的话回答题目，你的立场是什么？',en:'Answer the question in your own words. What is your position?'}},
  {key:'directImpact',label:{zh:'直接影响',en:'Direct impact'},hint:{zh:'这一做法首先带来什么改变？解释中间的因果关系。',en:'What changes first? Explain the connection between the action and its effect.'}},
  {key:'affectedGroup',label:{zh:'对象',en:'Who is affected'},hint:{zh:'谁受到影响？不同群体是否有不同结果？',en:'Who is affected? Could different groups experience different outcomes?'}},
  {key:'indirectImpact',label:{zh:'间接影响',en:'Indirect impact'},hint:{zh:'这些变化还可能带来什么后续影响？什么条件下才成立？',en:'What further effects could follow, and under what conditions?'}}],
 gre_issue:[
  {key:'claim',label:{zh:'观点',en:'Position'},hint:{zh:'你在多大程度上同意题目中的主张？',en:'To what extent do you agree with the claim?'}},
  {key:'reason1',label:{zh:'理由 1',en:'Reason 1'},hint:{zh:'第一条理由如何支撑观点？',en:'How does your first reason support your position?'}},
  {key:'reason2',label:{zh:'理由 2',en:'Reason 2'},hint:{zh:'第二条理由是否从不同角度补充分析？',en:'Does your second reason develop a different aspect of the issue?'}},
  {key:'rebuttal',label:{zh:'反驳',en:'Counterargument'},hint:{zh:'最有力的反方意见是什么？你的观点有什么边界？',en:'What is the strongest counterargument? Where does your position need qualification?'}},
  {key:'example',label:{zh:'例子',en:'Example'},hint:{zh:'给出具体例子，并解释它为什么能支持你的论证。',en:'Give a concrete example and explain how it supports your reasoning.'}}],
 toefl_discussion:[]
};
noteFields.toefl_discussion=noteFields.ielts_task2;
export const taskMinimum=(mode:WritingMode)=>mode==='ielts_task1'?150:mode==='ielts_task2'?250:null;
export const initialNotes=(mode:WritingMode)=>Object.fromEntries(noteFields[mode].map(f=>[f.key,'']));
export const examplePrompts:Record<WritingMode,string>={
 ielts_task1:'The chart below shows changes in public transport use. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nUpload the chart for your own practice task.',
 ielts_task2:'Some people believe university education should focus on skills for employment, while others think it should develop a broader understanding of the world. Discuss both views and give your own opinion.',
 gre_issue:'A society benefits most when its citizens question authority. Discuss the extent to which you agree or disagree with this claim. Develop your position with reasons and examples.',
 toefl_discussion:'Your professor asks: Which helps students learn more effectively, group projects or individual assignments? Contribute to the academic discussion with your opinion and reasons. For your own task, include the professor’s question and classmates’ posts.'
};
