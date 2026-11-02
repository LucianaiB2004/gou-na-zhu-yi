import {reviseTrip} from './trip.js';
const $=id=>document.getElementById(id);
let last=null,busy=false;
const form=$('trip-form');
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function addDays(day,n){return new Date(Date.parse(day)+n*86400000).toISOString().slice(0,10);}
$('checkIn').min=date;$('checkOut').min=addDays(date,1);
const nextSaturday=(()=>{let day=date;for(let n=0;n<8;n++,day=addDays(day,1))if(new Date(day).getUTCDay()===6&&day>date)return day;return addDays(date,7);})();
$('checkIn').value=nextSaturday;$('checkOut').value=addDays(nextSaturday,2);
function hint(){const nights=(Date.parse($('checkOut').value)-Date.parse($('checkIn').value))/86400000,rooms=Number($('rooms').value),budget=Number($('budget').value);$('budget-hint').textContent=nights>0&&rooms>0&&budget>0?`${nights} 晚 × ${rooms} 间 · 每间每晚约 ¥${Math.floor(budget/nights/rooms)} 以内（展示价估算）`:'';}
form.addEventListener('input',hint);hint();
document.querySelectorAll('[data-concern]').forEach(b=>b.addEventListener('click',()=>{$('concern').value=b.dataset.concern;$('concern').focus();}));
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function money(n){return new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(n);}
function details(title,lines){const d=el('details');d.append(el('summary',title));const ul=el('ul');lines.forEach(line=>ul.append(el('li',line)));d.append(ul);return d;}
function render(data){
 const root=$('result');root.replaceChildren();const h=data.selected;
 if(h){
 root.append(el('p','汪，先看这个。其他的我替你筛过了。','result-topline'),el('h3',h.name,'result-title'));
 if(h.image){const img=el('img',undefined,'hotel-image');img.src=h.image;img.alt=h.name+'的飞猪展示图片';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>img.hidden=true);root.append(img);}
 root.append(el('p',`${h.star||'酒店'} · ${h.rating===null?'评分未知':h.rating+' 分'} · ${h.nearby||h.address}`,'hotel-meta'));
 const price=el('div',undefined,'price-row');price.append(el('strong',`¥${money(h.total)}`),el('span',`${data.trip.nights} 晚 × ${data.trip.rooms} 间展示价估算 / 每间每晚 ¥${money(h.price)}`));root.append(price);
 root.append(el('p',`通过住宿预算与评分筛选，Jev 在本次合格候选中将它选为主推。你的顾虑是“${data.trip.concern||'暂无特别偏好'}”。地点线索：${h.nearby||h.address||'暂无'}。该判断不证明房型、安静程度或退改政策已核实。`,'reason-box'));
 const actions=el('div',undefined,'result-actions'),a=el('a','去飞猪核对详情 ↗','booking');a.href=h.link;a.target='_blank';a.rel='noopener noreferrer';
 const no=el('button','我不服，换个思路','secondary');no.type='button';no.addEventListener('click',()=>{$('disagree').classList.toggle('open');$('new-concern').focus();});actions.append(a,no);root.append(actions);
 const box=el('div',undefined,'disagree');box.id='disagree';const label=el('label','说具体点，我只改你在意的那一项。');label.htmlFor='new-concern';const input=el('textarea');input.id='new-concern';input.rows=2;input.maxLength=350;input.placeholder='比如：离西湖更近；这家太贵；不接受未知退改政策';
 const retry=el('button','保留行程，重新拿主意 ↗','secondary');retry.type='button';retry.addEventListener('click',()=>{if(!input.value.trim()){input.focus();return;}try{request(reviseTrip(last.trip,input.value,h.id));}catch(error){$('status').className='error';$('status').textContent=error.message;}});box.append(label,input,retry);root.append(box);
 }else{
 const box=el('div',undefined,'no-match');box.append(el('div','✳','empty-icon'),el('h3',data.status==='no_match'?'这次，我先不给你乱拿主意。':'证据还不够，本汪暂缓拍板。'),el('p',data.status==='no_match'?'当前返回的候选都没通过条件。看看淘汰原因，再调整预算、位置或评分。':'Jev 没有给出足够确定的主推。若顾虑涉及安静、退改或房型，请先在飞猪详情页核实，再缩小要求。'));root.append(box);
 }
 if(data.trip.revisions?.length)root.append(el('p',`原始顾虑：${data.trip.concern}。历次补充/更正：${data.trip.revisions.join(' → ')}。最新明确更正优先，其余条件保留。`,'reason-box'));
 const risks=el('div',undefined,'risks');risks.append(el('strong','出发前，先把这几件事看清楚。'));data.risks.forEach(r=>risks.append(el('div','· '+r)));root.append(risks);
 const selectedId=h?.id;const notChosen=data.eligible.filter(x=>x.id!==selectedId).map(x=>`${x.name} · ¥${money(x.total)} 住宿估算。通过硬性条件，本轮未选为主推；不代表酒店更差。`);
 const rejected=data.rejected.map(x=>`${x.name}：${x.reasons.join('；')}`);
 root.append(details(`淘汰记录 · ${rejected.length} 个没过条件`,rejected.length?rejected:['本轮候选均通过硬性条件。']),details(`其余合格候选 · ${notChosen.length} 个`,notChosen.length?notChosen:['没有其他合格候选。']));
 const proof=el('div',undefined,'proof');const time=new Date(data.source.queriedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
 proof.append(el('div',`来源：${data.source.name} · ${time}（北京时间）· 原始候选 ${data.source.count} 个`));
 if(data.jev.called){proof.append(el('div',`真实 Jev 调用：${data.jev.model} · 置信度 ${Math.round(data.jev.answer.confidence*100)}% · ${data.jev.elapsedMs} ms。置信度是模型信号，不是质量保证。`));}else proof.append(el('div','Jev 未调用：没有通过规则筛选的候选。'));
 proof.append(el('div',`全流程 ${data.elapsedMs} ms · 当前条件：${data.trip.destination} / ${data.trip.checkIn} → ${data.trip.checkOut} / 住宿总预算 ¥${money(data.trip.budget)}`));root.append(proof);
 if(data.source.hint)root.append(el('p',data.source.hint,'hotel-meta'));
}
async function request(trip){
 if(busy)return;busy=true;$('submit').disabled=true;$('live-badge').textContent='认真盘算中';$('result').setAttribute('aria-busy','true');$('status').className='loading';$('status').textContent='汪，正在找真实候选 → 核算住宿预算 → 请 Jev 拿主意。通常需要 5–30 秒。';
 try{const response=await fetch('/api/decide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(trip),signal:AbortSignal.timeout(95000)});const data=await response.json();if(!response.ok)throw new Error(data.error||'请求失败。');last=data;render(data);$('status').textContent='';$('status').className='';$('live-badge').textContent=data.selected?'已给出主推':'暂缓推荐';}
 catch(error){$('status').className='error';$('status').textContent=error.name==='TimeoutError'?'查询超时，请稍后重试。没有生成模拟结果。':error.message;$('live-badge').textContent='本次未完成';}
 finally{busy=false;$('submit').disabled=false;$('result').removeAttribute('aria-busy');}
}
form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const trip=Object.fromEntries(new FormData(form));trip.excluded=[];request(trip);});
