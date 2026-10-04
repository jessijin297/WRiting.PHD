import {db} from './database';
export const milestoneLabels={plan:{zh:'构思与题目',en:'Task & plan'},start:{zh:'开始独立写作',en:'Independent writing starts'},first:{zh:'首次保存正文',en:'First saved text'},quarter:{zh:'写作进度 25%',en:'Writing progress 25%'},half:{zh:'写作进度 50%',en:'Writing progress 50%'},three_quarters:{zh:'写作进度 75%',en:'Writing progress 75%'},original:{zh:'固定原稿',en:'Original submitted'},feedback:{zh:'进入反馈与自主修改',en:'Feedback & independent revision'},revised:{zh:'提交润色稿',en:'Revision submitted'},complete:{zh:'完成理解核对与报告',en:'Checks & report completed'}};
export async function recordMilestone(s:any,slot:keyof typeof milestoneLabels,content=s.draft||'',at=Date.now()){
 const details=JSON.stringify({label:milestoneLabels[slot],words:(content.match(/\b[\w]+(?:['’-][\w]+)*\b/g)||[]).length});
 await db().prepare('INSERT INTO writing_milestones (session_id,slot,stage,content,detail,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(session_id,slot) DO UPDATE SET stage=excluded.stage,content=excluded.content,detail=excluded.detail,created_at=excluded.created_at').bind(s.id,slot,s.stage,content,details,at).run();
}
export async function saveWritingCheckpoint(s:any,draft:string){
 if(s.stage==='planning'){await recordMilestone(s,'plan','');return;}
 if(s.stage!=='writing'||!draft.trim())return;
 const slots=(await db().prepare('SELECT slot FROM writing_milestones WHERE session_id=?').bind(s.id).all()).results as any[];
 const known=new Set(slots.map(r=>r.slot));
 if(!known.has('first'))await recordMilestone(s,'first',draft);
 const elapsed=(Date.now()-s.started_at)/(s.duration*60000);
 const thresholds=[['quarter',.25],['half',.5],['three_quarters',.75]] as const;
 // Crossing several thresholds between saves records the current milestone only.
 const candidate=[...thresholds].reverse().find(([slot,fraction])=>elapsed>=fraction&&!known.has(slot));
 if(candidate)await recordMilestone(s,candidate[0],draft);
}
export function importantSample<T>(rows:T[],limit=10):T[]{
 if(rows.length<=limit)return rows;
 return Array.from({length:limit},(_,i)=>rows[Math.round(i*(rows.length-1)/(limit-1))]);
}
export async function importantProcess(id:string){
 const nodes=(await db().prepare('SELECT * FROM writing_milestones WHERE session_id=? ORDER BY created_at,slot').bind(id).all()).results as any[];
 if(nodes.length)return {recording:'milestones',events:nodes.map(n=>({id:id+':'+n.slot,type:n.slot,stage:n.stage,client_at:n.created_at,received_at:n.created_at,detail:JSON.parse(n.detail)})),snapshots:nodes.map(n=>({id:id+':'+n.slot,stage:n.stage,content:n.content,created_at:n.created_at,label:JSON.parse(n.detail).label}))};
 const events=(await db().prepare('SELECT * FROM events WHERE session_id=? ORDER BY received_at,id').bind(id).all()).results as any[];
 const snapshots=(await db().prepare('SELECT * FROM snapshots WHERE session_id=? ORDER BY created_at,id').bind(id).all()).results as any[];
 return {recording:'legacy-sample',events:importantSample(events).map(e=>({...e,detail:JSON.parse(e.detail)})),snapshots:importantSample(snapshots)};
}

export function compactReport(report:any){return report?{...report,timeline:importantSample(report.timeline||[])}:null;}
