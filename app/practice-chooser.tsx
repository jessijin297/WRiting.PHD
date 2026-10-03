'use client';
import {useEffect,useRef} from 'react';
import {ArrowRight,ImagePlus,Feather,X} from 'lucide-react';
import {WritingMode} from '../lib/writing-settings';
import {useLanguage} from './language';

export default function PracticeChooser({onChoose,onClose}:{onChoose:(exam:string,mode:WritingMode)=>void;onClose:()=>void}){
 const {t}=useLanguage(),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=dialog.current;element?.showModal();return()=>element?.close();},[]);
 const choices:[string,WritingMode,string,string,string,string][]=[
  ['IELTS','ielts_task2','雅思大作文','IELTS Task 2','讨论观点与影响 · 至少 250 词','Develop an argument · At least 250 words'],
  ['IELTS','ielts_task1','雅思小作文','IELTS Academic Task 1','上传图表、地图或流程图 · 至少 150 词','Upload a chart, map or process · At least 150 words'],
  ['GRE','gre_issue','GRE 议论文','GRE Analyze an Issue','分析理由、反驳与例子','Examine reasons, counterarguments and examples'],
  ['TOEFL','toefl_discussion','托福学术讨论','TOEFL Academic Discussion','回应问题并展开自己的观点','Respond to the question and develop your position']
 ];
 return <dialog ref={dialog} className="practice-dialog" aria-labelledby="practice-dialog-title" onCancel={e=>{e.preventDefault();onClose();}} onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
  <header><div><p className="eyebrow">WRTBU / NEW PRACTICE</p><h2 id="practice-dialog-title">{t('这次，想练哪一种？','What would you like to practise?')}</h2></div><button aria-label={t('关闭题型选择','Close task selection')} onClick={onClose}><X size={20}/></button></header>
  <p className="practice-dialog-intro">{t('先选择题型，再添加自己的题目。已有文章保留在练习记录中。','Choose a task, then add your prompt. Existing essays stay in your practice history.')}</p>
  <div className="practice-choices">{choices.map(([exam,mode,zh,en,descriptionZh,descriptionEn])=><button key={mode} onClick={()=>onChoose(exam,mode)}>
   {mode==='ielts_task1'?<ImagePlus size={22}/>:<Feather size={22}/>}<span><strong>{t(zh,en)}</strong><small>{t(descriptionZh,descriptionEn)}</small></span><ArrowRight size={17}/>
  </button>)}</div>
 </dialog>;
}
