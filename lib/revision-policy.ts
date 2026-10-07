import {Bilingual} from './writing-settings';

export const revisionPolicyVersion='wrtbu-revision-5';
export const learningTypes=['spelling','word_choice','writing_convention','minor_grammar','sentence_upgrade','sentence_structure','logic','example'] as const;
export type LearningType=typeof learningTypes[number];
const pair=(zh:string,en:string):Bilingual=>({zh,en});
export const learningTypeNames:Record<LearningType,Bilingual>={
 spelling:pair('拼写修正','Spelling'),word_choice:pair('用词修正','Word choice'),writing_convention:pair('写作规范','Writing conventions'),minor_grammar:pair('局部语法修正','Local grammar'),sentence_upgrade:pair('句子表达提升 · 可选','Sentence refinement · optional'),sentence_structure:pair('句子结构重建','Sentence structure'),logic:pair('论证与逻辑','Reasoning and logic'),example:pair('例子与支撑','Examples and support')
};
function legacyLocalGrammar(change:any){
 if(typeof change?.before!=='string'||typeof change?.after!=='string')return false;
 const before:string[]=(change.before as string).match(/[\p{L}]+|[^\p{L}\s]/gu)||[],after:string[]=(change.after as string).match(/[\p{L}]+|[^\p{L}\s]/gu)||[];
 let start=0,endBefore=before.length,endAfter=after.length;
 while(start<endBefore&&start<endAfter&&before[start]===after[start])start++;
 while(endBefore>start&&endAfter>start&&before[endBefore-1]===after[endAfter-1]){endBefore--;endAfter--;}
 const a=before.slice(start,endBefore).map(v=>v.toLowerCase()),b=after.slice(start,endAfter).map(v=>v.toLowerCase());
 if(a.length<=1&&b.length<=1&&a.length+b.length>0&&[...a,...b].every(v=>['a','an','the'].includes(v)))return true;
 if(a.length!==1||b.length!==1)return false;
 if(a[0]!==b[0]&&a[0].replace(/s$/,'')===b[0].replace(/s$/,''))return true;
 return [['is','are'],['was','were'],['has','have'],['does','do']].some(pair=>pair.includes(a[0])&&pair.includes(b[0]));
}
// Stored V3/V4 reviews remain usable. New reviews carry an independently audited type.
export function learningType(change:any):LearningType{
 if(learningTypes.includes(change?.learningType))return change.learningType;
 const category=change?.category;
 if(category==='word_accuracy')return 'word_choice';
 if(category==='style'||category==='precision')return 'sentence_upgrade';
 if(category==='meaning_grammar')return legacyLocalGrammar(change)?'minor_grammar':'sentence_structure';
 return 'logic';
}
export const needsExplanation=(change:any)=>['sentence_structure','logic','example'].includes(learningType(change));
export const revisionPolicy=`Classify the learning burden independently of score priority. learningType is spelling, word_choice, writing_convention, minor_grammar, sentence_upgrade, sentence_structure, logic, or example. Spelling, word choice/collocation, punctuation/capitalization/format, and isolated agreement/article/tense errors require only confirmation of suitable wording, NOT a learner-written reason. An already complete grammatical sentence can receive an optional sentence_upgrade for more precise, fluent, varied or economical expression; this also does NOT require a written reason. sentence_structure is reserved for substantial clause reconstruction, multiple interacting structural errors, or unclear subject/verb/relations; a single agreement or missing article is minor_grammar. logic covers contradictions, unsupported causal leaps, missing reasoning links, task coverage or inaccurate interpretation of visual data. example covers irrelevant, implausible or insufficiently connected examples. ONLY sentence_structure, logic and example require the learner to explain why the revision addresses the problem. Do not reclassify a small error as structural just to demand an explanation. For mixed spans, use the deepest actual mechanism and ask about that mechanism only; prefer separating unrelated edits. Changes can be important yet require no written explanation. Optional wording need not be adopted.`;
