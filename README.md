# WRTBU · 写作练习室

面向 IELTS、GRE 和 TOEFL 学生的写作平台。题目与思路、作文编辑器和 AI 陪练并列；学生自主构思、独立写作、互动修改，最后对照原稿与修改稿，生成学习报告。

网站已发布：[WRTBU](https://wrtbu.jessijin29.workers.dev/)。云端 DeepSeek 密钥与独立管理者凭据已配置；普通学生注册、登录、作文保存和权限隔离已通过线上验证。真实 AI 回复和管理者本人登录仍待完成验收。

## 已实现

- 用户名 / 密码注册与登录，记录按不可变学生编号关联；服务端逐次验证作文所有权。
- 两项须知及单独的可选数据分享授权。同意没有默认勾选；拒绝或撤回仍可学习和生成个人报告。
- 构思期由 AI 追问观点、理由与学生自己的具体例子；不提供范文、段落或代写句子。
- 服务器计时，前 10 分钟锁定 AI，此后每个 10 分钟区间只可成功提问一次，失败不消耗机会。
- 结束计时后固定原稿，后续修改独立保存；记录问答、用时、修改、粘贴、焦点事件与保存版本。
- 原稿 / 修改稿对照、互动证据、改进方向及模型学习估分。AI 不可用时保留过程报告，不编造成绩。
- 独立管理者后台 `/teacher`：搜索学生，查看练习、估分变化、互动主题、完整作文、对话、事件、反思和历史版本，导出单次记录。
- 管理者设置页显示 DeepSeek 配置状态并可测试真实连接，不向浏览器返回密钥。
- 浅薄荷绿、米白及深灰文字；按钮悬停、按压和等待动效，尊重系统减少动画偏好。

## 本地运行

需要 Node.js 24 LTS。安装依赖后，用隐藏输入的设置流程配置 DeepSeek 和独立管理者账号：

```sh
npm ci
npm run setup:local
npx wrangler d1 migrations apply DB --local --config wrangler.cloudflare.jsonc --persist-to .wrangler/state
npm run dev:cloudflare
```

学生地址：http://127.0.0.1:5173/。
管理者地址：http://127.0.0.1:5173/teacher。

现有 Sites 预览使用 `npm run dev`；公开部署使用 `npm run build:cloudflare`。完整步骤见 [上线与后台指南](./上线与后台指南.md)。

## GitHub 与公网服务

源码仓库：[jessijin297/WRiting.PHD](https://github.com/jessijin297/WRiting.PHD)。GitHub 保存代码，Cloudflare Worker 运行页面和后台，Cloudflare D1 保存学生数据，DeepSeek 提供模型。GitHub Pages 不能运行服务器、密码验证、AI 密钥调用与数据库接口。

`wrangler.cloudflare.jsonc` 已绑定本网站的 D1 数据库；另建独立网站时替换成自己的数据库 ID。`build:cloudflare`、`db:migrate:cloudflare`、`deploy:cloudflare`、`secrets:cloudflare` 分别负责构建、线上迁移、部署和保存后台秘密；执行线上命令需先登录自己的 Cloudflare 账号。GitHub Actions 自动检查类型和构建；连接 Cloudflare Builds 后才会自动部署。

`.env.local`、`.dev.vars`、数据库、运行目录、依赖和真实学生记录均不进入源码仓库。HTML 单文件用于学生界面预览；完整登录、保存和 AI 需要运行本项目后台。

## 账号与权限

学生密码使用独立随机盐和 scrypt（N=32768、r=8、p=3）哈希，登录令牌仅保存哈希。HttpOnly、SameSite=Lax Cookie 在 HTTPS 下使用 Secure 和 __Host- 前缀。学生会话为 7 天；退出立即撤销。用户名认证限制 10 次 / 15 分钟，同一网络认证限制 50 次 / 15 分钟，注册限制 30 次 / 小时。

管理者使用独立凭据和 Cookie，会话为 8 小时；修改凭据使旧会话失效。公开 Worker 忽略外部的 Sites 身份头，学生账号不能取得管理权限。学生页面不显示后台入口。

Sites 托管环境保留服务端允许名单模式，仅当 ADMIN_AUTH_MODE=sites 时启用受信任边缘身份；公开 Worker 即使被误设为 sites，也拒绝身份头授权。管理者 Bearer 凭据仅供服务器工具使用，不放入浏览器。

每次后台刷新可查看最近 1000 次练习及所有账号，总数包含全部记录。达到上限时界面明确显示范围；主题与分数列表仅基于此范围。最近保存时间不代表实时在线状态。不同考试量表不合并求平均，模型估分不属于官方成绩；学生求助主题不能单独证明能力缺陷。

## 数据分享

文案位于 `lib/notices.ts`。保存学习记录与提供个人报告属于学习服务；管理者可查看这些教学记录。额外教学与产品分析使用独立可选授权。

`/api/teacher/research` 仅纳入当前同意分享且完成练习的学生；少于 5 人不输出汇总；达到人数后只输出人数、练习数及粗粒度平均时间与字符数，不输出用户名、作文、题目、对话或个人成绩。撤回后不再纳入后续统计。拒绝分享仍可正常学习和查看报告。

## 验证与当前状态

账号与隔离检查见 `login-verification.json`，本轮后台和公开构建检查见 `teacher-verification.json`。单次练习报告只描述本页面收到的事件，不能推断未记录的行为或离开页面的原因。

Cloudflare 公网服务与 D1 已创建。11 项线上验证见 `public-verification.json`；测试账号与作文已清理。云端 DeepSeek 密钥、管理者用户名与密码哈希已保存为 Worker Secrets，未进入源码；已确认管理员配置生效、错误密码及学生访问后台均被拒绝。真实 AI 教学回复及管理者本人登录仍待验收。当前提供注册、登录与退出，密码找回和账号恢复仍待完善。
