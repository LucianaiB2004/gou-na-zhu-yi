const string=(name,label,required=false)=>({name,label,type:'string',...(required?{required:true}:{})});
const number=(name,label,min,max,integer=false)=>({name,label,type:'number',min,max,integer});
const choice=(name,label,options,type='string')=>({name,label,type,options});
const date=(name,label)=>({name,label,type:'string',format:'date'});
const sort=['distance_asc','rate_desc','price_asc','price_desc','no_rank'];
const traffic=()=>[string('origin','出发城市 / 站点',true),string('destination','到达城市 / 站点'),date('depDate','出发日期'),date('backDate','返程日期'),string('seatClassName','舱位 / 席别'),string('transportNo','航班 / 车次'),string('transferCity','中转城市'),choice('journeyType','直达 1 / 中转 2',[1,2],'number'),number('maxPrice','最高展示价 / 元',1,1000000),number('totalDurationHour','最长旅程 / 小时',1,168),choice('sortType','排序：推荐 2 / 低价 3 / 短时 4',[1,2,3,4,5,6,7,8],'number')];
const hotel=()=>[string('destName','目的地',true),string('keyWords','关键词'),string('poiName','附近地点'),date('checkInDate','入住日期'),date('checkOutDate','离店日期'),string('hotelBedTypes','床型：大床房 / 双床房 / 多床房'),number('maxPrice','每晚最高展示价 / 元',1,1000000),choice('sort','排序',sort)];
const categories=['自然风光','山湖田园','森林丛林','峡谷瀑布','沙滩海岛','沙漠草原','人文古迹','古镇古村','历史古迹','园林花园','宗教场所','公园乐园','主题乐园','水上乐园','影视基地','动物园','植物园','海洋馆','体育场馆','演出赛事','剧院剧场','博物馆','纪念馆','展览馆','地标建筑','市集','文创街区','城市观光','户外活动','滑雪','漂流','冲浪','潜水','露营','温泉'];
// Names and argument casing follow @fly-ai/flyai-cli 1.0.16's online calls.
// Flights use one search_flight tool for domestic and international routes.
export const TOOLS=[
 {name:'fliggy_fast_search',label:'旅行商品搜索',description:'搜索演出、活动、度假、租车、签证、邮轮、套餐等公开旅行商品，不下单。',fields:[string('query','完整搜索需求',true)]},
 {name:'fliggy_ai_search',label:'AI 综合旅行搜索',description:'用完整自然语言查询复杂或跨品类旅行需求。返回内容可能是文本而非商品列表。',fields:[string('query','完整旅行需求',true)]},
 {name:'search_flight',label:'国内 / 国际机票',description:'查询国内及国际航线公开展示价格与航班，不出票。',fields:traffic()},
 {name:'search_domestic_train',label:'国内火车',description:'查询国内火车路线、席别与展示价格，不购票。',fields:traffic()},
 {name:'search_poi',label:'景点 / 活动地点',description:'查询景点、演出赛事、户外活动等地点与门票信息。',fields:[string('cityName','所在城市',true),string('keyword','地点关键词'),number('poiLevel','景区等级',1,5,true),choice('category','地点类别',categories)]},
 {name:'search_hotels',label:'酒店 / 民宿',description:'查询酒店、民宿、客栈的公开展示信息。',fields:[...hotel(),choice('hotelTypes','住宿类型',['酒店','民宿','客栈']),string('hotelStars','星级：1–5，逗号分隔')]},
 {name:'search_marriott_hotels',label:'万豪酒店',description:'查询万豪集团酒店公开展示信息。',fields:hotel()},
 {name:'search_marriott_packages',label:'万豪套餐',description:'按一个关键词查询城市、品牌、酒店或卖点相关套餐。',fields:[string('keyword','城市 / 品牌 / 酒店 / 卖点',true),choice('sortType','价格排序',['price_asc','price_desc'])]}
];
const fixedLimit=new Set(['search_flight','search_domestic_train','search_hotels']);
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function validateToolCall(name,args){
 const tool=TOOLS.find(t=>t.name===name);if(!tool)throw new Error('不支持的旅行查询工具。');
 if(!args||typeof args!=='object'||Array.isArray(args)||![Object.prototype,null].includes(Object.getPrototypeOf(args)))throw new Error('查询参数必须是普通对象。');
 const known=new Set(tool.fields.map(f=>f.name));
 for(const key of Reflect.ownKeys(args))if(typeof key!=='string'||!known.has(key)||['__proto__','prototype','constructor'].includes(key)||!Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(args,key),'value'))throw new Error('查询包含未知或不安全的参数。');
 const clean={};
 for(const field of tool.fields){
  let value=Object.prototype.hasOwnProperty.call(args,field.name)?args[field.name]:undefined;
  if(value===undefined){if(field.required)throw new Error(`请填写${field.label}。`);continue;}
  if(typeof value!==field.type)throw new Error(`${field.label}类型无效。`);
  if(field.type==='string'){
   value=value.trim();if(!value){if(field.required)throw new Error(`请填写${field.label}。`);continue;}
   if(value.length>(field.name==='query'?1500:1000)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw new Error(`${field.label}过长或含无效字符。`);
   if(field.format==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value||value<today()))throw new Error(`${field.label}必须是今天或之后的有效日期。`);
   if(field.name==='hotelStars'&&!/^[1-5](?:,[1-5])*$/.test(value))throw new Error('星级必须为 1–5，多个值用逗号分隔。');
   if(field.name==='hotelBedTypes'&&!/^(?:大床房|双床房|多床房)(?:,(?:大床房|双床房|多床房))*$/.test(value))throw new Error('床型无效，多个值用逗号分隔。');
  }else if(!Number.isFinite(value)||(field.min!==undefined&&value<field.min)||(field.max!==undefined&&value>field.max)||(field.integer&&!Number.isInteger(value)))throw new Error(`${field.label}超出有效范围。`);
  if(field.options&&!field.options.includes(value))throw new Error(`${field.label}不在支持范围内。`);
  clean[field.name]=value;
 }
 if(clean.checkInDate&&clean.checkOutDate&&clean.checkOutDate<=clean.checkInDate)throw new Error('离店日期必须晚于入住日期。');
 if(clean.depDate&&clean.backDate&&clean.backDate<clean.depDate)throw new Error('返程日期不能早于出发日期。');
 if(fixedLimit.has(name))clean.limit=10;
 return clean;
}
export function toolSchemas(){return TOOLS.map(tool=>({type:'function',function:{name:tool.name,description:tool.description,parameters:{type:'object',properties:Object.fromEntries(tool.fields.map(field=>[field.name,{type:field.integer?'integer':field.type,description:field.label,...(field.options?{enum:[...field.options]}:{}),...(field.type==='string'?{maxLength:field.name==='query'?1500:1000}:{}),...(field.format?{format:field.format}:{}),...(field.min!==undefined?{minimum:field.min}:{}),...(field.max!==undefined?{maximum:field.max}:{})}])),required:tool.fields.filter(f=>f.required).map(f=>f.name),additionalProperties:false}}}));}
