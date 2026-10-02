'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import dictionary from '../lib/ui-translations.json';
import {Bilingual,Language} from '../lib/writing-settings';
const Context=createContext({language:'zh' as Language,setLanguage:(_language:Language)=>{},t:(zh:any,en?:string)=>zh,p:(value:Bilingual|string|undefined)=>typeof value==='string'?value:value?.zh||''});
export function LanguageProvider({children}:{children:React.ReactNode}){
 const [language,setLanguage]=useState<Language>('zh');
 useEffect(()=>{try{if(localStorage.getItem('wrtbu-language')==='en')setLanguage('en');}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=language==='en'?'en':'zh-CN';try{localStorage.setItem('wrtbu-language',language);}catch{}},[language]);
 const value=useMemo(()=>({language,setLanguage,t:(zh:any,en?:string)=>{if(typeof zh!=='string'||language==='zh')return zh;if(en)return en;const dict=dictionary as Record<string,string>;if(dict[zh.trim()])return dict[zh.trim()];return zh.replace(/[\u3400-\u9fff]+(?:[ ·／，：。？！、][\u3400-\u9fff]+)*/g,part=>dict[part]||part);},p:(input:Bilingual|string|undefined)=>typeof input==='string'?input:input?.[language]||''}),[language]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useLanguage=()=>useContext(Context);
export function LanguageSwitcher(){const {language,setLanguage}=useLanguage();return <div className="language-switch" aria-label="Interface language"><button type="button" lang="zh-CN" aria-pressed={language==='zh'} onClick={()=>setLanguage('zh')}>中文</button><span aria-hidden="true">/</span><button type="button" lang="en" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>EN</button></div>;}
