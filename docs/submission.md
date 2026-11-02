# 待提交材料（尚未报名）

## 项目与团队

**狗拿主意：飞猪全品类搜索 × 阿里云旅行助手 × Jev决策**

团队：不拿第一，就奖励自己。主要提交人：LucianaiB2004。口号：懒才是进步的阶梯。

## 场景与亮点

面向想旅行、却反复纠结怎么去、住哪里、怎么玩的人。三个入口分别解决选住宿、查旅行、聊行程：酒店可按预算与评分筛选，再由Jev只选一个；旅行搜索覆盖8种官方工具，包含交通、景点、酒店及全品类商品；阿里云对话助手按需调用飞猪，帮助应急改计划、入境游、亲子游学、活动与目的地探索。

“我不服”保留原始条件和逐轮更正，并排除已否决项。真实候选、未知价格、淘汰理由和核实风险均可查看，不把展示价说成锁定价，不把模型编写的设施或活动当成实际数据。

## 百炼使用（必填）

阿里云百炼Managed Agent，AUTO模型及默认工具，安装官方 `alibaba-flyai/flyai-skill`。运行时环境变量提供FlyAI Key；在普通旅行对话中调用官方CLI，完成真实检索、程序核算、主推解释和连续重选。可复制提示词见仓库 `docs/bailian-system-prompt.md`。

百炼境内环境调用Jev返回451，明确标记未参与，不绕过地区限制；百炼本身对真实候选判断。独立网页的Jev实际返回 `jev-1.14.0`；阿里云网页助手实际返回 `qwen-plus` 并调用飞猪工具。两种使用路径与验证边界在仓库分别说明。

## 作品与证据

- [源码与说明](https://github.com/LucianaiB2004/gou-na-zhu-yi)
- [网页](https://lucianaib2004.github.io/gou-na-zhu-yi/)，自行配置对应Key。
- [验证记录](https://github.com/LucianaiB2004/gou-na-zhu-yi/blob/main/docs/verification.md)
- [真实界面截图](https://raw.githubusercontent.com/LucianaiB2004/gou-na-zhu-yi/main/docs/screenshots/redesign-desktop.jpg)

8类官方工具真实调用成功，22项自动测试通过。Node.js 22.18+，`npm ci`、`npm start`；静态构建 `npm run build`。不需要账号、数据库或持久化旅行档案。

当前只读搜索与旅行辅助，不下单、支付、退改或处理证件。拍照、语音、实时定位未实现，不声称全赛道专业能力均已完成。

按用户要求，本材料只保留，尚未向官方仓库提交报名Issue。
