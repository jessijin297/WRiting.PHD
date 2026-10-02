'use client';
import {useLanguage,LanguageSwitcher} from './language';
import {DATA_NOTICE,TERMS_NOTICE} from '../lib/notices';
export function Notices(){
 const {t,language}=useLanguage();return <div className="notice-copy"><div><span>01</span><section><h3>{t("学习数据与自主选择")}</h3><p>{t(DATA_NOTICE)}</p></section></div><div><span>02</span><section><h3>{t("网站服务须知")}</h3><p>{t(TERMS_NOTICE)}</p></section></div></div>;}
export function ConsentChoice({value,onChange}:{value:boolean|null;onChange:(v:boolean)=>void}){
 const {t,language}=useLanguage();return <fieldset className="consent-choice"><legend>{t("是否分享学习数据用于后续分析？")}<span>{t("可选")}</span></legend><label className={value===false?'chosen':''}><input type="radio" name="researchConsent" checked={value===false} onChange={()=>onChange(false)}/><span><b>{t("不分享")}</b><small>{t("保留全部学习与报告功能")}</small></span></label><label className={value===true?'chosen':''}><input type="radio" name="researchConsent" checked={value===true} onChange={()=>onChange(true)}/><span><b>{t("同意分享")}</b><small>{t("仅用于去除身份信息的汇总分析")}</small></span></label></fieldset>;}

