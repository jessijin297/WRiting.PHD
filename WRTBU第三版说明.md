# WRTBU 第三版 · 2026-10-03

## 学生使用流程

1. 用自己的学生账号登录。右上角「中文 / EN」切换界面与第三版 AI 反馈语言。
2. 新建练习，选择 IELTS、GRE 或 TOEFL。IELTS 可选大作文 Task 2 或 Academic 小作文 Task 1；小作文先上传完整清晰的图表、流程或地图，至少 150 词。大作文至少 250 词。目标字数与官方最低要求会显示在题目中。
3. 构思字段按题型变化：小作文为「特征」；雅思大作文与托福讨论为「观点、直接影响、对象、间接影响」；GRE Issue 为「观点、理由1、理由2、反驳、例子」。这些是教学辅助，不是官方强制结构。
4. 完成独立原稿后，原稿固定。AI 先给原稿估分、逻辑问题和引导问题，再展示完整修改示例，改动用蓝色标记，删除用蓝色删除线表示。
5. 逐项比较原表达、示例、备选表达。可采用示例、提出自己的表达，或有理由地保留原表达。解释原因后由 AI 核对理解；仅点击同意或写「我懂了」无法通过。通过后从原稿或已解释的选择开始自主润色，仍可与 AI 讨论更多表达。
6. 提交自己的润色稿。AI 对学生实际改动再核对、评分，区分「重要」与「不重要／可选」。逐项解释通过后生成报告；若修改产生新问题，返回修改后重新核对。
7. 报告保留原稿、学生润色稿、蓝色 AI 示例、估分、重要性、解释及核对尝试次数、问答和写作过程。第二版的个性化词汇与测试规则继续保留。

## 评分与修改重要性

- IELTS：按任务完成／回应、连贯与衔接、词汇、语法四个等权维度，给出本任务的 0–9 学习估分。单篇估分不能当作整个 Writing 科目成绩。Task 1 基于实际图片；无法辨认关键图像时不报任务和整体分数。
- GRE：当前 Analyze an Issue，0–6 整体估分；理由、组织和语言等维度为文字诊断，不伪造独立分项成绩。
- TOEFL：当前 Academic Discussion，0–5 整数任务等级；不是 1–6 科目分数。本版没有新增 Email 或历史 Integrated 题型。完整题目应包含教授问题与同学发言，否则反馈会说明上下文限制。
- 重要：实际影响任务完成、数据准确性、论证、衔接、含义、语法或规范用词的问题。可选：原表达已成立，进一步调整风格、精度或表达范围。模型在初次点评后额外核对优先级，避免把自然的简单表达误标成严重问题。
- 此二分是 WRTBU 根据评分影响给出的教学优先级，不是考试机构的官方标签。复杂句、难词和单项替换不保证提分。所有分数为 AI 学习估分。
- 使用官方标准和研究指导提示与交互，并未对 DeepSeek 模型进行额外权重训练。自动理解核对是学习反馈，不代表已验证长期掌握。

依据：[IELTS 评分描述](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf)、[IELTS 写作格式](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing)、[ETS GRE Issue](https://www.ets.org/gre/test-takers/general-test/prepare/content/analytical-writing/scoring.html)、[ETS TOEFL 评分细则](https://www.ets.org/content/dam/ets-org/pdfs/toefl/writing-rubrics.pdf)、[IELTS 图表任务研究](https://ielts.org/researchers/our-research/research-reports/task-design-in-ielts-academic-writing-task-1-the-effect-of-quantity-and-manner-of-presentation-of-information-on-candidate-writing)、[British Council 教学材料](https://takeielts.britishcouncil.org/teach-ielts/teaching-resources/lesson-plans-writing)、[纠正反馈研究](https://doi.org/10.1017/S0272263109990532)。来源只用于核对标准，没有复制整份文章。

## 管理者与数据

教师入口仍为 `/teacher`，需要独立管理者认证。查看每个学生的题目、构思、原稿与润色稿、两次估分、蓝色示例、逐项解释、优先级和核对次数，以及词汇学习、测试正确率和频繁错误。学生接口不能读取其他学生的图片、点评或教师数据。

已有练习保留旧流程和原始反馈语言；新建练习进入第三版。数据库增加四个表及题型、语言、版本字段，不删除原有账号、作文、报告或词汇数据。

图片支持 PNG/JPG/WebP，网页会缩小过大的图片；服务器保存上限 1 MB，只有该学生与管理者可读取。图片随写作资料传给已配置的 DeepSeek 服务；使用支持图片的 `deepseek-flash` Responses 接口。

每轮 AI 原稿示例最多 12 个定位修改；学生实际修改核对最多 60 组相邻片段。大量重写时可分几轮集中处理。原稿估分保存后不随报告刷新重新计算。模型或网络失败保留已保存稿件，可重试。

## 运行与升级

服务器端：`npm ci` → 配置 `.env.local` 中的服务器密钥与管理者凭据 → `npm run build:server`。设置 `WRTBU_DATABASE_PATH` 与 HTTPS 的 `WRTBU_PUBLIC_ORIGIN` 后运行 `npm run start:server`；启动会按顺序补齐迁移。上线与后台配置继续参照现有指南。

Cloudflare：先备份 D1，然后 `npm run db:migrate:cloudflare` 应用 `0004_writing_v3.sql`，再构建、部署。密钥保留为服务器 Secret，不提交 GitHub。不能仅用 GitHub Pages 静态托管替代需要认证、数据库与 AI 密钥的后台。

验证：`npm run typecheck`、`npm run verify:writing`、`npm run verify:vocabulary`、`npm run build:server`、`npm run verify:server`、`npm run build:cloudflare`。真实 AI 检查记录与模拟流程检查分别注明环境，不把模拟结果当真实调用。

## English overview

V3 preserves an independently written original, reviews it against the relevant official task rubric, and displays a polished example with blue changes. Learners can choose alternatives or justify retaining their own words. They explain every change before moving on to independent revision, then submit their own version for a final assessment and understanding check.

IELTS offers Academic Task 1 image upload and Task 2. GRE uses Analyze an Issue; TOEFL uses Academic Discussion. Scores are AI learning estimates, not official results. Important/optional priorities are teaching interpretations audited against rubric impact. The interface and new AI feedback are bilingual; historic records retain their original language. Teacher access remains authenticated and separate. V2 personalized vocabulary, review quizzes and milestone tests continue.
