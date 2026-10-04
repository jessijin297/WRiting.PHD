// Original teaching reflection items, informed by research constructs; not a validated scale.
export const MEASURE_VERSION='wrtbu-reflection-1';
export const learningDimensions=[
 {id:'autonomy',label:{zh:'自主学习与决策',en:'Agency & decisions'}},
 {id:'trust',label:{zh:'对反馈的信任',en:'Trust in feedback'}},
 {id:'attitude',label:{zh:'对反馈的态度',en:'Feedback attitude'}},
 {id:'anxiety',label:{zh:'当下写作担忧',en:'Current writing worry'}},
 {id:'processing',label:{zh:'反馈处理与迁移',en:'Processing & transfer'}}
] as const;
export const reflectionItems=[
 {id:'autonomy1',dimension:'autonomy',text:{zh:'我能为这次写作确定自己需要解决的问题。',en:'I can identify the problem I need to work on in this writing task.'}},
 {id:'autonomy2',dimension:'autonomy',text:{zh:'我能依据自己的理由决定保留或修改表达。',en:'I can give my own reasons for keeping or changing an expression.'}},
 {id:'trust1',dimension:'trust',text:{zh:'我认为 AI 对这次写作的反馈会是可靠的。',en:'I expect AI feedback on this writing task to be reliable.'}},
 {id:'trust2',dimension:'trust',text:{zh:'我愿意把 AI 的反馈作为这次修改的参考。',en:'I am willing to use AI feedback as a reference for this revision.'}},
 {id:'attitude1',dimension:'attitude',text:{zh:'我愿意认真检查指出我问题的反馈。',en:'I am willing to carefully examine feedback that points out problems.'}},
 {id:'attitude2',dimension:'attitude',text:{zh:'遇到不同意见时，我愿意追问并比较理由。',en:'When opinions differ, I am willing to ask questions and compare reasons.'}},
 {id:'anxiety1',dimension:'anxiety',text:{zh:'想到这次写作，我现在担心自己写不好。',en:'Right now, I worry that I will not write well in this task.'}},
 {id:'anxiety2',dimension:'anxiety',text:{zh:'这次写作的评价让我现在感到紧张。',en:'Right now, the evaluation of this writing task makes me feel tense.'}},
 {id:'processing1',dimension:'processing',text:{zh:'我能解释一处修改为什么改善或损害文章。',en:'I can explain why a change improves or harms the essay.'}},
 {id:'processing2',dimension:'processing',text:{zh:'我能把反馈中的原则应用到另一处表达。',en:'I can apply a principle from feedback to another expression.'}}
] as const;
export const measurementReferences=[
 {title:'Yu, Zhang & Liu (2022) · L2 writing feedback literacy',url:'https://doi.org/10.1016/j.asw.2022.100643',note:{zh:'用于界定欣赏反馈、判断、情绪管理和行动等观察方向。',en:'Informs observations of feedback appreciation, judgment, affect and action.'}},
 {title:'Teng & Zhang (2016) · Writing strategies for self-regulated learning',url:'https://doi.org/10.1111/modl.12339',note:{zh:'用于界定计划、调节和自主运用策略的观察方向。',en:'Informs observations of planning, regulation and strategy use.'}},
 {title:'Cheng (2004) · Second Language Writing Anxiety Inventory',url:'https://doi.org/10.1016/j.jslw.2004.07.001',note:{zh:'提示写作焦虑需要自陈资料；作文和提问不能替代测量。',en:'Writing anxiety requires self-report evidence; essays and questions are not substitutes.'}},
 {title:'Jian, Bisantz & Drury (2000) · Trust in automated systems',url:'https://doi.org/10.1207/S15327566IJCE0401_04',note:{zh:'信任与实际可靠性需要分别观察；采纳反馈不等于信任或理解。',en:'Trust and actual reliability are distinct; adoption does not establish trust or understanding.'}},
 {title:'Carless & Boud (2018) · Student feedback literacy',url:'https://doi.org/10.1080/02602938.2018.1463354',note:{zh:'反馈素养框架，非量表。关注判断、情绪管理和后续行动。',en:'A framework, not a scale. Focuses on judgment, managing affect and taking action.'}}
];
export function reflectionScores(answers:any){
 if(!answers)return null;
 return Object.fromEntries(learningDimensions.map(d=>[d.id,(answers[d.id+'1']+answers[d.id+'2'])/2]));
}
