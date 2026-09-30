export const NOTICE_VERSION='2026-09-30-v1';
export const DATA_NOTICE='为保存练习并生成个人报告，WRTBU 会记录你的作文、AI 问答、修改和写作过程，网站管理者可查看这些学习记录以提供学习服务。你可以另行选择是否允许建设者将学习数据用于后续教学与产品分析。额外分析仅使用去除身份信息的汇总数据，不包含用户名、作文原文或对话原文。拒绝或撤回分享不会影响登录、学习、个人报告和记录保存。';
export const TERMS_NOTICE='最终解释权归网站建立者。网站建立者负责对本网站的服务规则作出说明与解释；该说明不限制你依法享有的权利。规则调整会在网站中告知。';
export type Student={id:string;username:string;researchConsent:boolean;noticeVersion:string;noticeAcceptedAt:number};
