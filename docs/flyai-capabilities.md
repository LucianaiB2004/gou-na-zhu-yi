# 飞猪已接入能力

核对日期：2026-11-02。依据飞猪AI开放平台文档、官方FlyAI Skill、项目当前CLI 1.0.16及真实调用记录。8类工具均已接入并实际调用成功。

## 可调用工具

| 能力 | 官方CLI命令 | 项目调用工具名 | 可以做什么 |
|---|---|---|---|
| 全品类商品查询 | `keyword-search` | `fliggy_fast_search` | 用自然语言查询酒店、机票、门票、度假套餐、演出赛事、邮轮、租车接送、签证、保险、通信卡、跟团与研学商品 |
| AI综合查询 | `ai-search` | `fliggy_ai_search` | 理解目的地、日期、预算、同行人和兴趣，跨交通、住宿、景点整理旅行结果 |
| 机票 | `search-flight` | `search_flight` | 按出发/到达地、日期、往返、舱位、航班、直达/中转、价格和时长筛选比较 |
| 国内火车 | `search-train` | `search_domestic_train` | 按城市/车站、日期、席别、车次、直达/中转、价格和时长筛选比较 |
| 酒店 | `search-hotel` | `search_hotels` | 按目的地、关键词、附近地点、入住/离店、床型、价格及排序查询住宿 |
| 景点与体验 | `search-poi` | `search_poi` | 按城市、关键词、景区等级及分类，查景点、博物馆、乐园、自然风光、文化街区和户外体验 |
| 万豪酒店 | `search-marriott-hotel` | `search_marriott_hotels` | 按目的地、品牌、酒店名、附近地点、床型、日期和价格查询 |
| 万豪套餐 | `search-marriott-package` | `search_marriott_packages` | 按城市、品牌、酒店或卖点查询住宿及餐饮、下午茶、SPA等组合套餐，按价格排序 |

具体字段由对应工具与官方返回决定；查询条件详见网页“切换查询方式”。

## 商品与预订入口

- 酒店使用返回的`detailUrl`；交通、门票及通用商品使用返回的`jumpUrl`。
- 页面和对话直接输出实际链接，用户点击进入飞猪继续查看和预订。
- 返回商品图片时展示图片；包含官方`systemMessage`时在末尾展示平台提示。
- 正常回答先展示一个主推，再列其他候选及链接；证据不足时保留实际结果，明确“证据不够，无法拍板”。

这里的“跳转预订”对应官方返回的预订链接，是当前已接入的使用路径。

## 项目中的使用方式

- **选住宿**：真实检索、预算核算、评分筛选、Jev主推、淘汰依据、保留条件重新选择及预订链接。
- **查旅行**：8类工具表单，以及演出赛事、邮轮度假、租车接送、签证通信、跟团游学等快捷入口。
- **聊行程**：阿里云理解需求、调用对应工具、比较真实候选，以Markdown输出推荐和来源链接。
- **百炼**：官方Skill在Managed Agent中直接查询；已完成高铁、酒店、景点对话与手动部署验证。

## 官方依据与项目证据

- [飞猪AI开放平台文档](https://flyai.open.fliggy.com/docs)
- [官方FlyAI Skill与8类命令](https://github.com/alibaba-flyai/flyai-skill)
- [官方展示与预订链接要求](https://github.com/alibaba-flyai/flyai-skill/blob/main/skills/flyai/SKILL.md)
- [8类真实调用记录](travel-verification.json)
- [完整验收记录](verification.md)
