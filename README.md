# 🐕 狗拿主意

想出发，还没拿定主意？查交通、挑住处、找玩法，把这趟安排明白。

队伍：**不拿第一，就奖励自己**。2026 飞猪 AI 旅行创新大赛作品；官方报名暂未提交。

![界面与真实酒店结果](docs/screenshots/redesign-desktop.jpg)

## 直接使用

[打开网页](https://lucianaib2004.github.io/gou-na-zhu-yi/)，在右上角「API 设置」填写自己的 Key。所有 Key 仅在本页内存中使用，刷新即清除，不写入 localStorage、仓库或服务端数据库。

| 想做什么 | 需要的服务 |
|---|---|
| 查交通、景点、套餐等旅行信息 | 飞猪 Key |
| 选一个住处，查看淘汰依据与重选 | 飞猪 + TypeSafe Jev Key |
| 对话规划、解释和辅助选择 | 阿里云百炼 Key；实时查询另需飞猪 Key |

每个 Key 可以单独验证和应用。阿里云 Key 的地域需与设置一致，默认北京、`qwen-plus`。验证与使用均消耗对应服务的实际额度。设置中会明确列出传输路径：浏览器 → 用户可自选的可信 API 转发服务 → 对应官方 API；转发服务不保存用户 Key。默认服务为本项目账户下的 `gou-nazhu-yi-api.lucianaib.chatgpt.site`，源码位于 `gateway/worker.mjs`。

## 三个入口

- **选住宿**：按真实日历、间夜、房间数、住宿总预算、评分筛选；Jev 仅在合格候选中选择，非法概率或低置信度不会变成假主推。「我不服」保留原始条件、历次更正，排除上次主推。
- **查旅行**：8 类官方查询工具全部接入，涵盖机票、国内火车、景点、酒店/民宿、万豪酒店/套餐、关键词商品搜索、跨品类语义搜索。演出赛事、邮轮度假、租车接送、签证通信、跟团游学通过官方全域搜索查询，不宣称存在独立专用接口。
- **聊行程**：阿里云模型理解问题，通过 Function Calling 选择官方工具，接收真实结果后辅助判断。应急、酒店度假、入境游、活动、亲子游学、文化讲解、小众探索等提供话题入口。结构化结果的推荐必须引用本轮真实候选，事实由原始字段渲染，缺失信息显示未知；语义文本以官方搜索整理展示。连续对话保留需求与否决项，不自动清空行程。

界面外层保持一屏；长结果、对话和高级查询参数在各自区域内滚动。无账号、数据库或持久化旅行存档。

## 本地运行

Node.js 22.18+：

```powershell
npm ci
npm start
```

打开 `http://127.0.0.1:3210`，仍在界面填写自己的 Key。Windows 也可使用 `启动狗拿主意.cmd`。

```powershell
npm test
npm run check
npm run build
```

`dist/` 是可发布到 GitHub Pages 的静态网页，资源路径支持仓库子目录。原有 `scripts/decide.mjs` 命令行工具继续从本机忽略的 `.env` 读取 `FLYAI_API_KEY` 和 `TYPESAFE_API_KEY`，不要上传 `.env`。

## 百炼中的真实使用

按参赛指南在百炼 Managed Agent 创建「狗拿主意」，使用 AUTO 和默认工具，安装官方 `alibaba-flyai/flyai-skill`，将 FlyAI Key 注入运行时环境。可复制的完整提示词见 [百炼系统提示词](docs/bailian-system-prompt.md)。

百炼会话内运行官方 FlyAI CLI；酒店调用 `node cloud/decide.mjs trip.json`，其他品类按官方 Skill 的 references 使用。百炼本身承担理解、查询与判断，不只是开发环境。完整酒店对话和预算修改后重新查询已实测。

Jev 在百炼当前区域返回 HTTP 451，用户已确认接受此限制；不绕过地区限制。百炼可以使用自身模型对真实飞猪候选判断，并明确标记 Jev 未参与。Jev 在本地和 GitHub 网页的真实接口已验证成功，实际返回 `jev-1.14.0`。不要将两条路径混称为百炼直连 Jev 成功。

## 能力边界

当前飞猪官方开放以搜索为主，应用不创建订单、不付款、不出票、退改、值机或处理个人证件。所有赛道入口表示可辅助查询和规划，不能理解为每个赛道的专业全功能系统。尚未实现拍照识别、语音、实时定位、完整官方活动日历或权威政策/历史资料检索。

展示价不是锁定报价。住宿估算 = 每间每晚展示价 × 晚数 × 房间数，不含其他旅行开支；房型、人数、库存、税费、早餐、安静程度及退改需到飞猪详情核实。其他品类的计价单位与日期也需核对。模型可能误判，应核对返回依据；没有搜索来源的一般讲解不能当成已核实事实。

## 证据与来源

[验证记录](docs/verification.md) · [8 工具真实调用记录](docs/travel-verification.json) · [用户视角验收](docs/ux-review.md) · [待提交材料](docs/submission.md)

官方来源：[比赛](https://opc.aliyun.com/feizhu)、[参赛指南](https://alidocs.dingtalk.com/i/nodes/QG53mjyd800agdlKHebwk4Zj86zbX04v)、[FlyAI 文档](https://flyai.open.fliggy.com/docs)、[官方 Skill](https://github.com/alibaba-flyai/flyai-skill)、[阿里云兼容接口](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)、[Function Calling](https://help.aliyun.com/zh/model-studio/qwen-function-calling)。

官方 Skill 文档快照来自提交 `86fe2cc3e25464d0e0bd6a769b27b5f9f3b04128`，保留 MIT LICENSE；CLI 版本 1.0.16。

回答支持标题、加粗、列表、表格与可点击详情链接；证据不足时仍列出全部实际候选。Markdown依赖Marked18.1.2、DOMPurify3.4.17，随静态网页本地分发并保留许可证，不依赖公共CDN。
