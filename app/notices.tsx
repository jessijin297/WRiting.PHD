'use client';
import {DATA_NOTICE,TERMS_NOTICE} from '../lib/notices';
export function Notices(){return <div className="notice-copy"><div><span>01</span><section><h3>学习数据与自主选择</h3><p>{DATA_NOTICE}</p></section></div><div><span>02</span><section><h3>网站服务须知</h3><p>{TERMS_NOTICE}</p></section></div></div>;}
export function ConsentChoice({value,onChange}:{value:boolean|null;onChange:(v:boolean)=>void}){return <fieldset className="consent-choice"><legend>是否分享学习数据用于后续分析？<span>可选</span></legend><label className={value===false?'chosen':''}><input type="radio" name="researchConsent" checked={value===false} onChange={()=>onChange(false)}/><span><b>不分享</b><small>保留全部学习与报告功能</small></span></label><label className={value===true?'chosen':''}><input type="radio" name="researchConsent" checked={value===true} onChange={()=>onChange(true)}/><span><b>同意分享</b><small>仅用于去除身份信息的汇总分析</small></span></label></fieldset>;}

