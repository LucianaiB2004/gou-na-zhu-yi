import {reviseTrip} from './trip.js';
import {validateTrip} from './decision-core.js';
import {DEFAULT_GATEWAY,validateSettings,createClient} from './api-client.js';
const $=id=>document.getElementById(id),form=$('trip-form');
let last=null,busy=false,settings=null;
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const addDays=(day,n)=>new Date(Date.parse(day)+n*86400000).toISOString().slice(0,10);
const nextSaturday=(()=>{let day=date;for(let n=0;n<8;n++,day=addDays(day,1))if(new Date(day).getUTCDay()===6&&day>date)return day;return addDays(date,7);})();
$('checkIn').min=date;$('checkOut').min=addDays(date,1);$('checkIn').value=nextSaturday;$('checkOut').value=addDays(nextSaturday,2);
function hint(){const nights=(Date.parse($('checkOut').value)-Date.parse($('checkIn').value))/86400000,rooms=Number($('rooms').value),budget=Number($('budget').value);$('budget-hint').textContent=nights>0&&rooms>0&&budget>0?`${nights} 晚 × ${rooms} 间 · 每间每晚约 ¥${Math.floor(budget/nights/rooms)} 以内`:'';}
form.addEventListener('input',hint);hint();
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
const money=n=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(n);
document.querySelectorAll('[data-concern]').forEach(b=>b.addEventListener('click',()=>{$('concern').value=b.dataset.concern;$('concern').focus();}));
const tabs=el('nav',undefined,'mobile-tabs');tabs.setAttribute('aria-label','切换旅行条件与判断结果');
for(const [panel,text]of [['form','填写条件'],['result','狗的判断']]){const b=el('button',text,panel==='form'?'active':'');b.type='button';b.dataset.panel=panel;b.addEventListener('click',()=>showPanel(panel));tabs.append(b);}
document.querySelector('.workspace').before(tabs);
function showPanel(panel){document.body.dataset.mobilePanel=panel;tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.panel===panel);b.setAttribute('aria-pressed',String(b.dataset.panel===panel));});}
export function openSettings(){if(busy)return;$('settings-status').textContent='';$('settings-dialog').showModal();}
$('settings-open').addEventListener('click',openSettings);$('settings-close').addEventListener('click',()=>$('settings-dialog').close());
$('evidence-close').addEventListener('click',()=>$('evidence-dialog').close());
$('gateway-url').value=DEFAULT_GATEWAY;
function disclosure(){try{$('gateway-disclosure').textContent=`当前路径：你的浏览器 → ${new URL($('gateway-url').value).origin} → 飞猪 / TypeSafe / 阿里云官方 API。`;}catch{$('gateway-disclosure').textContent='请先填写有效且可信的服务地址。';}}
$('gateway-url').addEventListener('input',disclosure);disclosure();
export function settingsInput(){return {gateway:$('gateway-url').value,flyaiKey:$('flyai-key').value,jevKey:$('jev-key').value,model:$('jev-model').value,aliyunKey:$('aliyun-key')?.value??'',aliyunModel:$('aliyun-model')?.value??'qwen-plus',region:$('aliyun-region')?.value??'beijing'};}
export function currentSettings(){return settings;}
function badge(){$('connection-badge').textContent=settings?'旅行工具 · 本次会话已配置':'飞猪 × 阿里云百炼 × Jev · 等待配置';}
$('settings-form').addEventListener('submit',e=>{e.preventDefault();try{settings=validateSettings(settingsInput(),{partial:true});if(!settings.flyaiKey&&!settings.jevKey&&!settings.aliyunKey)throw new Error('至少填写一个服务的 Key。');badge();$('settings-dialog').close();}catch(error){$('settings-status').textContent=error.message;}});
$('clear-keys').addEventListener('click',()=>{settings=null;$('flyai-key').value='';$('jev-key').value='';if($('aliyun-key'))$('aliyun-key').value='';$('flyai-test-result').textContent='';$('jev-test-result').textContent='';if($('aliyun-test-result'))$('aliyun-test-result').textContent='';$('settings-status').textContent='已清除本次会话的密钥。';badge();});
async function verify(kind){
 const button=$(`test-${kind}`),output=$(`${kind}-test-result`),field=$(`${kind}-key`);button.disabled=true;field.disabled=true;output.dataset.state='pending';output.textContent='正在真实调用…';
 try{const cfg=settingsInput();cfg.aliyunKey='';cfg.aliyunModel='qwen-plus';cfg.region='beijing';if(kind==='flyai')cfg.jevKey='';else cfg.flyaiKey='';const client=createClient(cfg);if(kind==='flyai'){const t=validateTrip(Object.fromEntries(new FormData(form)));const r=await client.search(t);if(r.notCalled)throw new Error('当前预算过低，请先调整预算再验证。');output.textContent=`✓ 查询成功 · ${r.items.length} 个真实候选`;}else{const r=await client.verifyJev();output.textContent=`✓ 调用成功 · ${r.model}`;}output.dataset.state='success';}catch(error){output.dataset.state='error';output.textContent=error.message;}finally{button.disabled=false;field.disabled=false;}
}
$('flyai-key').addEventListener('input',()=>{$('flyai-test-result').textContent='';});$('jev-key').addEventListener('input',()=>{$('jev-test-result').textContent='';});
$('test-flyai').addEventListener('click',()=>verify('flyai'));$('test-jev').addEventListener('click',()=>verify('jev'));
function section(title,lines){const s=el('section',undefined,'evidence-section');s.append(el('h3',title));const ul=el('ul');lines.forEach(line=>ul.append(el('li',line)));s.append(ul);return s;}
function evidence(data){const root=$('evidence-content');root.replaceChildren();
 root.append(section('为什么主推这个',data.selected?[`通过住宿预算与评分等硬性条件，Jev 在合格候选中选择了 ${data.selected.name}。`,`原始顾虑：${data.trip.concern||'暂无特别顾虑'}。`,`地点线索：${data.selected.nearby||data.selected.address||'暂无'}。房型、安静及退改仍需核实。`]:['本轮未给出主推，不虚构可执行结论。']));
 if(data.trip.revisions?.length)root.append(section('历次补充 / 更正',data.trip.revisions.map((r,i)=>`${i+1}. ${r}`)));
 root.append(section(`淘汰记录 · ${data.rejected.length} 个`,data.rejected.length?data.rejected.map(h=>`${h.name}：${h.reasons.join('；')}`):['没有候选因硬性条件被淘汰。']));
 const other=data.eligible.filter(h=>h.id!==data.selected?.id);root.append(section(`其余合格候选 · ${other.length} 个`,other.length?other.map(h=>`${h.name} · ¥${money(h.total)} 住宿估算。本轮未主推，不代表酒店更差。`):['没有其他合格候选。']));
 root.append(section('出发前需要核实',data.risks));
 const time=new Date(data.source.queriedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});root.append(section('可核验的调用信息',[`${data.source.name} · ${time}（北京时间） · 原始候选 ${data.source.count} 个。`,data.jev.called?`Jev 实际模型 ${data.jev.model}，置信度 ${Math.round(data.jev.answer.confidence*100)}%，调用 ${data.jev.elapsedMs}ms。置信度不是质量保证。`:'没有合格候选，Jev 未调用。',`全流程 ${data.elapsedMs}ms；${data.trip.destination}，${data.trip.checkIn} 至 ${data.trip.checkOut}，预算 ¥${money(data.trip.budget)}。`]));
 if(data.source.hint)root.append(section('平台提示',[data.source.hint]));$('evidence-title').textContent='本汪的判断依据';$('evidence-dialog').showModal();}
function reselect(){if(busy||!last?.selected)return;const previous=last;const root=$('evidence-content');root.replaceChildren();$('evidence-title').textContent='我不服，再盘一盘';const f=el('form',undefined,'reselect-form'),label=el('label','说具体点，没改的条件我都替你留着。');label.htmlFor='new-concern';const input=el('textarea');input.id='new-concern';input.maxLength=350;input.required=true;input.placeholder='比如：更便宜一些；地铁更方便；把位置要求改成机场附近';const msg=el('p',`原始顾虑：${previous.trip.concern}。${previous.trip.revisions.length?`已保留 ${previous.trip.revisions.length} 轮补充。`:''}`);const submit=el('button','保留行程，重新拿主意 ↗','primary');submit.type='submit';f.append(label,input,msg,submit);f.addEventListener('submit',e=>{e.preventDefault();try{const trip=reviseTrip(previous.trip,input.value,previous.selected.id);$('evidence-dialog').close();request(trip);}catch(error){msg.textContent=error.message;}});root.append(f);$('evidence-dialog').showModal();}
function candidateSection(data){
 const items=[...data.eligible.filter(h=>h.id!==data.selected?.id),...data.rejected];
 if(!items.length)return null;
 const section=el('section',undefined,'hotel-candidate-section');const heading=el('div',undefined,'candidate-heading');const copy=el('div');copy.append(el('h3',(data.selected?'其他候选，供参考':'本轮实际候选')+'（'+items.length+'）'));if(!data.selected)copy.append(el('p',data.eligible.length?`${data.eligible.length} 家过了预算和评分这一关，但这轮还是没法替你拍板。下面是查到的酒店。`:'这轮没找到符合条件的住处，查到的酒店都放在下面。','candidate-summary'));heading.append(copy);const dog=el('img',undefined,'candidate-dog');dog.src='./assets/travel-dog.png';dog.alt='';dog.loading='lazy';heading.append(dog);section.append(heading);
 const list=el('div',undefined,'hotel-candidate-list');
 for(const h of items){const card=el('article',undefined,'hotel-candidate-item');if(h.image){const img=el('img',undefined,'candidate-photo');img.src=h.image;img.alt=h.name+'的飞猪展示图片';img.loading='lazy';img.referrerPolicy='no-referrer';card.append(img);}card.append(el('h4',h.name),el('p',h.total==null?'住宿估算未知':'住宿估算 ¥'+money(h.total)+' · '+(h.rating??'评分未知')+' 分'));
 if(h.reasons?.length)card.append(el('p',h.reasons.join('；'),'muted'));
 if(h.link){const a=el('a','查看飞猪详情 ↗');a.href=h.link;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}else card.append(el('p','未返回可验证详情链接。','muted'));list.append(card);}
 section.append(list);return section;
}
function render(data){const root=$('result');root.replaceChildren();
 if(!data.selected){const box=el('div',undefined,'no-match compact');const hasCandidates=data.eligible.length+data.rejected.length>0;box.append(el('h3',hasCandidates?'证据不够，无法拍板':'本次没有查到候选'),el('p',hasCandidates?data.jev.called?'Jev 已经看过这轮结果，但还没有把握替你选一家。先看看查到了什么。':'这轮没有酒店通过筛选，先看看实际查到的结果。':'换个日期或预算，再查一轮。'));const b=el('button','看看筛选依据','secondary');b.type='button';b.addEventListener('click',()=>evidence(data));box.append(b);root.append(box);const candidates=candidateSection(data);if(candidates)root.append(candidates);return;}

 const h=data.selected,wrap=el('div',undefined,'recommendation');wrap.append(el('p','汪，先看这个。其他的我替你筛过了。','result-topline'));
 const card=el('div',undefined,'hotel-card');if(h.image){const img=el('img',undefined,'hotel-image');img.src=h.image;img.alt=h.name+'的飞猪展示图片';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>{img.src='./assets/travel-landscape.png';},{once:true});card.append(img);}const info=el('div',undefined,'hotel-info');info.append(el('h3',h.name,'result-title'),el('p',`${h.star||'酒店'} · ${h.rating??'评分未知'} 分 · ${h.nearby||h.address}`,'hotel-meta'));const price=el('div',undefined,'price-row');price.append(el('strong',`¥${money(h.total)}`),el('span',`${data.trip.nights} 晚 × ${data.trip.rooms} 间住宿估算`));info.append(price,el('p',`每间每晚展示价 ¥${money(h.price)} · 预算余量 ¥${money(data.trip.budget-h.total)}`,'hotel-meta'));card.append(info);wrap.append(card);
 wrap.append(el('p',`通过预算和评分筛选，Jev 本轮主推这家。${h.nearby?`地点线索：${h.nearby}。`:''}你的顾虑：${data.trip.revisions.at(-1)||data.trip.concern||'暂无特别偏好'}。`,'reason-box'));
 const actions=el('div',undefined,'result-actions'),a=el('a','去飞猪核对详情 ↗','booking');a.href=h.link;a.target='_blank';a.rel='noopener noreferrer';const no=el('button','我不服，重新选','secondary');no.type='button';no.addEventListener('click',reselect);const why=el('button',`依据 / 淘汰 ${data.rejected.length} 个`,'secondary');why.type='button';why.addEventListener('click',()=>evidence(data));actions.append(a,no,why);wrap.append(actions);
 wrap.append(el('p','展示价仅作住宿估算，非锁定报价；房型、库存、人数、早餐、税费、退改及安静程度待核实。不含交通餐饮门票。','risk-note'));
 const time=new Date(data.source.queriedAt).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});wrap.append(el('p',`飞猪实时候选 ${data.source.count} 个 · ${time}（北京时间） · Jev ${data.jev.model} · 置信度 ${Math.round(data.jev.answer.confidence*100)}%（非质量保证）`,'proof-line'));if(data.source.hint)wrap.append(el('p',data.source.hint,'risk-note'));const candidates=candidateSection(data);if(candidates)wrap.append(candidates);root.append(wrap);
}
async function request(trip){
 if(busy)return;if(!settings){openSettings();$('settings-status').textContent='先填好自己的飞猪与 Jev Key，再让本汪开工。';return;}
 try{validateTrip(trip);}catch(error){$('status').className='error';$('status').textContent=error.message;showPanel('result');return;}
 busy=true;$('submit').disabled=true;$('settings-open').disabled=true;$('live-badge').textContent='认真盘算中';$('result').setAttribute('aria-busy','true');$('status').className='loading';showPanel('result');
 try{const data=await createClient(settings).run(trip,stage=>{$('status').textContent=({flyai:'正在飞猪查询真实酒店…',rules:'正在核算间夜、预算与评分…',jev:'正在请 Jev 从合格候选中拿主意…'})[stage];});last=data;render(data);$('result').scrollTop=0;$('status').textContent='';$('status').className='';$('live-badge').textContent=data.selected?'这次主推':'暂缓推荐';}
 catch(error){$('status').className='error';$('status').textContent=error.message;$('live-badge').textContent='本次未完成';}
 finally{busy=false;$('submit').disabled=false;$('settings-open').disabled=false;$('result').removeAttribute('aria-busy');}
}
form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;request({...Object.fromEntries(new FormData(form)),excluded:[],revisions:[]});});
