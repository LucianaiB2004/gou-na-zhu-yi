import {renderMarkdown} from './markdown.js';
import {safeUrl} from './decision-core.js';
import {TOOLS} from './travel-tools.js';
const escape=value=>String(value??'').replace(/[\\`*_{}\[\]<>#!|]/g,'\\$&').replace(/\r?\n/g,' ');
function candidateLines(h,{primary=false}={}){
 const lines=[`${primary?'###':'####'} ${escape(h.name)}`];
 lines.push(h.price==null?'展示价：**未知**，请在详情页核实。':`展示价：**${escape(h.price)}**（最终金额与计价单位以详情页为准）。`);
 if(h.address)lines.push(`地址：${escape(h.address)}`);
 if(h.nearby)lines.push(`位置线索：${escape(h.nearby)}`);
 if(h.rating!=null)lines.push(`展示评分：${escape(h.rating)}`);
 if(h.departure)lines.push(`出发：${escape(h.departure)}`);
 if(h.arrival)lines.push(`到达：${escape(h.arrival)}`);
 const link=safeUrl(h.link);lines.push(link?`[查看「${escape(h.name)}」的飞猪详情 ↗](<${link}>)`:'详情链接：本次未返回可验证链接，不编造跳转地址。');
 return lines[0]+'\n\n'+lines.slice(1).join('\n');
}
export function answerMarkdown(model,{reason='',notice=''}={}){
 const lines=[];
 if(model.status==='recommended'){
  lines.push('## 这次主推',candidateLines(model.selected,{primary:true}));
  if(reason)lines.push(`**选择依据：** ${escape(reason)}。它是本轮真实候选，不代表未核实条件已得到保证。`);
 }else if(model.status==='empty')lines.push('## 本次没有查到候选','查询已完成，但接口没有返回匹配候选。可以调整关键词、日期或预算再查一次。');
 else if(model.status==='semantic')lines.push('## 证据不够，无法拍板','本轮返回的是语义搜索整理，尚未给出可逐项校验的结构化主推。下面保留实际搜索内容和链接，供你直接核对。');
 else lines.push('## 证据不够，无法拍板',`本轮查到了 **${model.candidates.length} 个候选**，关键条件尚未核实。先列出来，供你查看。`);
 if(notice)lines.push(`> ${escape(notice)}`);
 if(model.alternatives.length){lines.push(`## ${model.selected?'其他候选，供参考':'本轮候选，供参考'}（${model.alternatives.length}）`);for(const h of model.alternatives)lines.push(candidateLines(h));}
 if(model.excludedCandidates.length){lines.push(`## 你已否决的候选（${model.excludedCandidates.length}）`,'这些结果仍由接口返回，保留供核对，不会再次主推。');for(const h of model.excludedCandidates)lines.push(candidateLines(h));}
 if(model.semantic.length){lines.push('## 飞猪搜索返回','以下为官方搜索整理，未独立核实其中每项描述。');for(const s of model.semantic)lines.push(s.text);}
 if(model.candidates.length){lines.push('---','**查看后再决定：** 展示价与库存随时可能变化；开放、预约、适用人群、设施、税费与退改，以官方详情确认。');
  const sources=[...new Set(model.candidates.map(h=>`${TOOLS.find(t=>t.name===h.tool)?.label??'飞猪查询'} · ${new Date(h.queriedAt).toLocaleString('zh-CN')}`))];lines.push('查询来源：'+sources.map(escape).join('；')+'。');}
 for(const hint of model.hints)lines.push(`> 平台提示：${escape(hint)}`);
 if(model.candidates.some(h=>h.link)||model.semantic.length)lines.push('部分飞猪详情在电脑端会显示官方扫码页，可用飞猪、淘宝或支付宝继续查看。');
 return lines.join('\n\n');
}
export function renderEvidenceAnswer(target,model,options){const text=answerMarkdown(model,options);renderMarkdown(target,text);return text;}
