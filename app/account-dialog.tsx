'use client';
import {useEffect,useRef,useState} from 'react';
import {X,ShieldCheck,LogOut} from 'lucide-react';
import {Student} from '../lib/notices';
import {api} from '../lib/client';
import {Notices,ConsentChoice} from './notices';
export default function AccountDialog({student,onClose,onChange,onLogout}:{student:Student;onClose:()=>void;onChange:(s:Student)=>void;onLogout:()=>Promise<void>}){
 const dialog=useRef<HTMLDialogElement>(null),[choice,setChoice]=useState(student.researchConsent),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState('');
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 async function save(){setBusy(true);setError('');setSaved('');try{const d=await api('auth/consent',{researchConsent:choice});onChange(d.student);setSaved(choice?'已保存分享选择。':'已关闭额外分析分享，学习与报告照常使用。');}catch(e:any){setError(e.message);}finally{setBusy(false);}}
 return <dialog ref={dialog} className="account-dialog" onCancel={e=>{e.preventDefault();if(!busy)onClose();}} aria-labelledby="account-title"><header><div><ShieldCheck size={20}/><h2 id="account-title">账号与隐私</h2></div><button onClick={onClose} disabled={busy} aria-label="关闭账号设置"><X size={20}/></button></header><div className="account-body"><div className="account-person"><b>{student.username.slice(0,1)}</b><div><h3>{student.username}</h3><p>学生账号 · 作文与报告均保存在此账号中</p></div></div><Notices/><ConsentChoice value={choice} onChange={v=>{setChoice(v);setSaved('');}}/><p className="notice-reminder">撤回后不再纳入后续额外分析。已发布的汇总结果无法单独还原或删除某个人的数据。</p>{error&&<p className="auth-error" role="alert">{error}</p>}{saved&&<p className="account-saved" role="status">{saved}</p>}<button className="button primary" disabled={busy||choice===student.researchConsent} onClick={save}>{busy?'正在保存…':'保存数据选择'}</button><p className="account-version">须知版本 {student.noticeVersion} · 已于 {new Date(student.noticeAcceptedAt).toLocaleDateString('zh-CN')} 阅读</p></div><footer><span>拒绝分享，依然可以完整学习。</span><button disabled={busy} onClick={async()=>{setBusy(true);try{await onLogout();}catch(e:any){setError(e.message);}finally{setBusy(false);}}}><LogOut size={16}/>退出登录</button></footer></dialog>;
}
