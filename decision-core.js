export const todayChina = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function validateTrip(input,today=todayChina()) {
 const t={destination:String(input.destination??'').trim(),checkIn:input.checkIn,checkOut:input.checkOut,rooms:Number(input.rooms),budget:Number(input.budget),minRating:Number(input.minRating??0),concern:String(input.concern??'').trim(),excluded:Array.isArray(input.excluded)?input.excluded.map(String).slice(0,30):[]};
 t.revisions=input.revisions??[];
 if(!Array.isArray(t.revisions)||t.revisions.length>8||t.revisions.some(x=>typeof x!=='string'||!x.trim()||x.length>350))throw new Error('补充顾虑无效。');
 if(!t.destination||t.destination.length>60||t.concern.length>500) throw new Error('请填写目的地，顾虑最多 500 字。');
 for(const d of [t.checkIn,t.checkOut]) if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d) throw new Error('日期无效，请选择真实日历日期。');
 t.nights=(Date.parse(t.checkOut)-Date.parse(t.checkIn))/86400000;
 if(t.checkIn<today||t.nights<1||t.nights>30) throw new Error('入住不能早于今天，住宿为 1–30 晚。');
 if(!Number.isInteger(t.rooms)||t.rooms<1||t.rooms>10||!Number.isFinite(t.budget)||t.budget<1||t.budget>1000000||!Number.isFinite(t.minRating)||t.minRating<0||t.minRating>5) throw new Error('请检查房间数、住宿总预算和最低评分。');
 return t;
}
export function parsePrice(value) {
 if(typeof value==='number') return Number.isFinite(value)&&value>0?value:null;
 if(typeof value!=='string'||!/^\s*(?:¥|￥|CNY\s*)?\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:元)?\s*$/.test(value)) return null;
 const n=Number(value.replace(/CNY|[¥￥,元\s]/g,''));return n>0&&Number.isFinite(n)?n:null;
}
export function safeUrl(raw,kind='booking') {
 try{const u=new URL(raw);const hosts=kind==='image'?['alicdn.com','taobaocdn.com']:['feizhu.com','fliggy.com','fly.ai','taobao.com','tmall.com'];return u.protocol==='https:'&&hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
export function screenHotels(items,trip) {
 const eligible=[],rejected=[],seen=new Set();
 for(const [i,h] of items.entries()){
  if(!h||typeof h!=='object'||Array.isArray(h))throw new Error('飞猪候选结构异常，请稍后重试。');
  const id=String(h.shId??`hotel_${i}`);if(seen.has(id))continue;seen.add(id);
  const price=parsePrice(h.price),rating=Number(h.rate??h.score),link=safeUrl(h.detailUrl),name=String(h.name??'未命名酒店').slice(0,120);
  const total=price===null?null:Math.round(price*trip.nights*trip.rooms*100)/100;
  const reasons=[];
  if(trip.excluded.includes(id))reasons.push('你已否决这个方案');
  if(price===null)reasons.push('价格口径不明确，无法核算');
  if(total!==null&&total>trip.budget)reasons.push(`住宿展示价估算 ¥${total}，超过预算 ¥${trip.budget}`);
  if(trip.minRating>0&&(!Number.isFinite(rating)||rating<trip.minRating))reasons.push('评分未知或低于你设置的下限');
  if(/床位|青旅|青年旅|多人间|胶囊/.test(name))reasons.push('疑似共享床位，不能按整间客房核算');
  if(!link)reasons.push('缺少可验证的飞猪详情链接');
  const hotel={id,name,price,total,rating:Number.isFinite(rating)?rating:null,address:String(h.address??'').slice(0,200),nearby:String(h.interestsPoi??'').slice(0,200),star:String(h.star??'').slice(0,60),image:safeUrl(h.mainPic,'image'),link};
  if(reasons.length)rejected.push({...hotel,reasons});else eligible.push(hotel);
 }
 return {eligible,rejected};
}
export function validateDecision(answer,ids,threshold=0.65){
 if(!answer||answer.type!=='choice'||!ids.includes(answer.choice)||!Number.isFinite(answer.confidence)||answer.confidence<0||answer.confidence>1) throw new Error('Jev 返回了无效决策。');
 const p=answer.probabilities;
 if(!p||Object.keys(p).length!==ids.length||ids.some(id=>!Number.isFinite(p[id])||p[id]<0||p[id]>1)||Math.abs(ids.reduce((s,id)=>s+p[id],0)-1)>0.025)throw new Error('Jev 返回的概率分布不合法。');
 return {...answer,choice:answer.confidence<threshold?'defer':answer.choice,lowConfidence:answer.confidence<threshold};
}
