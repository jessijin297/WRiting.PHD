import {db} from './database';
// Additional research always checks current consent; operational student reports do not.
export async function researchSummary(){
 const row:any=await db().prepare(`SELECT COUNT(DISTINCT s.user_id) AS participants,COUNT(*) AS practices,AVG((s.finished_at-s.started_at)/1000.0) AS seconds,AVG(LENGTH(s.original)) AS originalCharacters,AVG(LENGTH(s.draft)) AS revisedCharacters FROM sessions s JOIN student_accounts a ON a.id=s.user_id WHERE a.research_consent=1 AND s.stage='complete'`).first();
 if((row?.participants||0)<5)return {available:false,reason:'同意分享且已完成练习的学生不足 5 人，暂不输出统计。',minimumParticipants:5};
 return {available:true,participants:row.participants,completedPractices:row.practices,averageWritingSeconds:Math.round(row.seconds/30)*30,averageOriginalCharacters:Math.round(row.originalCharacters/10)*10,averageRevisedCharacters:Math.round(row.revisedCharacters/10)*10,note:'仅包含当前同意分享的已完成练习；不输出身份、作文、题目、对话或个人成绩。撤回后不再纳入后续统计。'};
}
