import {normalizeVocabularyAnswer} from './vocabulary-topics';
export const LEARNING_ROLES={consolidate:'巩固基础',extend:'拓展表达',challenge:'适度挑战'} as const;
export type LearningRole=keyof typeof LEARNING_ROLES;
export const validLearningRole=(value:unknown):value is LearningRole=>typeof value==='string'&&Object.hasOwn(LEARNING_ROLES,value);
const academicExpressions=['interdisciplinary','intellectual','assumptions','disproportionately','reconcile','indiscriminate','sustain','coordinated','perspectives','nevertheless','specialization','autonomy','empirical','curricular','inequality','consequently','implications','infrastructure'];
const foundationalTerms=new Set('education learning teaching knowledge skills students learners problem opinion ability include require discuss issues quality values aspect argument example information important evidence development achievement describe reasons learning school jobs good'.split(' '));
export function prioritizePrecision(draft:string){return academicExpressions.filter(term=>expressionInDraft(term,draft)).length>=3;}
export function isFoundationalTerm(term:string){return foundationalTerms.has(normalizeVocabularyAnswer(term));}
const functionWords=new Set('a an the and or but so if to of for with by at from as in on is are was were be been being it its this that these those i we you he she they my our your their have has had do does did can could will would should may might must not no'.split(' '));
export function essayVocabularySignals(draft:string){
 const tokens=(draft.toLowerCase().match(/[a-z]+(?:['’-][a-z]+)*/g)||[]),content=tokens.filter(w=>!functionWords.has(w));
 const frequency=new Map<string,number>();for(const word of content)frequency.set(word,(frequency.get(word)||0)+1);
 const sentences=draft.split(/[.!?]+/).filter(s=>/[a-z]/i.test(s));
 return {academicExpressionsUsed:academicExpressions.filter(term=>expressionInDraft(term,draft)),wordCount:tokens.length,distinctContentWords:frequency.size,contentWordRepetition:content.length?Number((1-frequency.size/content.length).toFixed(3)):0,sentenceCount:sentences.length,averageSentenceWords:sentences.length?Number((tokens.length/sentences.length).toFixed(1)):0,repeatedContentWords:[...frequency].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([word,uses])=>({word,uses})),evidenceLimit:tokens.length<120?'短样本：仅据本篇实际表达安排学习，不判断整体英语水平。':'仅为本篇文本特征，不能直接换算考试分数或固定能力等级。'};
}
export function expressionInDraft(term:string,draft:string){const normalized=normalizeVocabularyAnswer(draft).replace(/[^a-z0-9\s]/g,' ');return (' '+normalized.replace(/\s+/g,' ')+' ').includes(' '+normalizeVocabularyAnswer(term)+' ');}
