import {vocabularyLibrary,vocabularyState} from './vocabulary';
import {db,error,runtime} from './database';
import {ai,key,messages,provider,own} from './server';
import {requireTeacher,teacherAuthRoute} from './teacher-auth';
import {researchSummary} from './research';
const json=(data:any)=>Response.json(data,{headers:{'Cache-Control':'no-store'}});
export async function teacherRoute(req:Request,path:string[],read:(r:Request)=>Promise<any>){
 if(path[1]==='auth')return teacherAuthRoute(req,path,read);
 await requireTeacher(req);
 if(path[1]==='settings'&&path.length===2&&req.method==='GET')return json({provider:provider(),model:provider()==='deepseek'?(runtime.DEEPSEEK_MODEL||process.env.DEEPSEEK_MODEL||'deepseek-flash'):(runtime.OPENAI_MODEL||process.env.OPENAI_MODEL||'gpt-6-astra'),configured:!!key(),teacherPath:'/teacher'});
 if(path[1]==='connection-test'&&path.length===2&&req.method==='POST'){await ai('这是服务器连接测试。只返回 {"ok":true}。',{task:'connection check'},{type:'object',properties:{ok:{type:'boolean'}},required:['ok'],additionalProperties:false},'connection_check');return json({ok:true,checkedAt:Date.now()});}
 if(req.method!=='GET')throw error('请求方法不正确。',405);
 if(path[1]==='vocabulary'&&path.length===3){const account=await db().prepare('SELECT id FROM student_accounts WHERE id=?').bind(path[2]).first();if(!account)throw error('找不到学生。',404);return json(await vocabularyLibrary(path[2],true));}
 if(path[1]==='research'&&path.length===2)return json(await researchSummary());
 if(path[1]&&path.length===2){const id=path[1],session:any=await db().prepare('SELECT * FROM sessions WHERE id=?').bind(id).first();if(!session)throw error('找不到这次练习。',404);const events=(await db().prepare('SELECT * FROM events WHERE session_id=? ORDER BY received_at').bind(id).all()).results;const snapshots=(await db().prepare('SELECT * FROM snapshots WHERE session_id=? ORDER BY created_at').bind(id).all()).results;const report:any=await db().prepare('SELECT content FROM reports WHERE session_id=?').bind(id).first();return json({vocabulary:await vocabularyState(await own(session.id,session.user_id),session.user_id),session:{...session,notes:JSON.parse(session.notes)},report:report?JSON.parse(report.content):null,messages:await messages(id),events:events.map((e:any)=>({...e,detail:JSON.parse(e.detail)})),snapshots});}
 if(path.length!==1)throw error('找不到此接口。',404);
 const limit=1000;
 const rows:any[]=(await db().prepare('SELECT * FROM sessions ORDER BY updated_at DESC LIMIT ?').bind(limit).all()).results;
 const reports:any[]=(await db().prepare('SELECT r.session_id,r.content FROM reports r JOIN sessions s ON s.id=r.session_id ORDER BY s.updated_at DESC LIMIT ?').bind(limit).all()).results;
 const accounts:any[]=(await db().prepare('SELECT id,username,research_consent,created_at FROM student_accounts ORDER BY created_at DESC').all()).results;
 const total:any=await db().prepare("SELECT COUNT(*) AS practices,SUM(CASE WHEN stage='complete' THEN 1 ELSE 0 END) AS completed FROM sessions").first();
 const byId=new Map(reports.map(r=>[r.session_id,JSON.parse(r.content)]));
 const students=new Map<string,any>(accounts.map(a=>[a.id,{studentId:a.id,username:a.username,researchConsent:a.research_consent===1,createdAt:a.created_at,sessions:[],completed:0,helpAreas:{},scores:[]}]));
 for(const s of rows){if(!students.has(s.user_id))students.set(s.user_id,{studentId:s.user_id,username:'旧版账号',researchConsent:false,sessions:[],completed:0,helpAreas:{},scores:[]});const student=students.get(s.user_id),r=byId.get(s.id);student.sessions.push({...s,notes:JSON.parse(s.notes),report:r||null});if(s.stage==='complete')student.completed++;for(const e of r?.evidence||[])student.helpAreas[e.area]=(student.helpAreas[e.area]||0)+1;if(r?.assessment)student.scores.push({sessionId:s.id,exam:s.exam,date:s.created_at,original:r.assessment.originalScore,revised:r.assessment.revisedScore,change:r.assessment.originalScore!==null&&r.assessment.revisedScore!==null?r.assessment.revisedScore-r.assessment.originalScore:null});}
 return json({students:[...students.values()],totals:{accounts:accounts.length,practices:total.practices,completed:total.completed||0},limit,truncated:total.practices>limit,refreshedAt:Date.now(),note:'主题统计描述寻求帮助的方向；估分属于学习参考。'});
}
