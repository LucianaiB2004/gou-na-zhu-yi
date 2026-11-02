import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateTrip,screenHotels} from './src/decision.mjs';
import {searchHotels,decide} from './src/providers.mjs';
const assets=new Map([['/',['index.html','text/html; charset=utf-8']],...['app.js','explorer.js','markdown.js','answer-model.js','answer-view.js','grounded-choice.js','conversation.js','travel-tools.js','trip.js','api-client.js','decision-core.js'].map(f=>['/'+f,[f,'text/javascript; charset=utf-8']]),...['marked.js','purify.js'].map(f=>['/vendor/'+f,['vendor/'+f,'text/javascript; charset=utf-8']]),['/style.css',['style.css','text/css; charset=utf-8']],...['travel-dog.png','travel-landscape.png','travel-stickers.png','paw.svg'].map(f=>['/assets/'+f,['assets/'+f,f.endsWith('.svg')?'image/svg+xml':'image/png']])]);
export function createApp(){
 let active=0;const rates=new Map();
 return http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https://*.alicdn.com https://*.taobaocdn.com; style-src 'self'; script-src 'self'; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));};
  if(!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test((req.headers.host??'').toLowerCase())){send(403,{error:'此版本只接受本机地址访问。'});return;}
  const path=(req.url??'').split('?')[0];
  if(req.method==='GET'&&assets.has(path)){
   const [file,type]=assets.get(path);try{const body=await readFile(new URL('./public/'+file,import.meta.url));res.writeHead(200,{'Content-Type':type});res.end(body);}catch{send(500,{error:'界面资源缺失。'});}return;
  }
  if(req.method==='GET'&&path==='/api/health'){send(200,{ok:true,flyaiConfigured:!!process.env.FLYAI_API_KEY,jevConfigured:!!process.env.TYPESAFE_API_KEY});return;}
  if(req.method!=='POST'||path!=='/api/decide'){send(404,{error:'未找到。'});return;}
  if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host){send(403,{error:'不允许跨站请求。'});return;}}catch{send(403,{error:'无效来源。'});return;}}
  if(!req.headers['content-type']?.startsWith('application/json')){send(415,{error:'需要 JSON 请求。'});return;}
  const ip=req.socket.remoteAddress??'local',now=Date.now();
  if(rates.size>5000)for(const [k,v]of rates)if(now-v.time>60000)rates.delete(k);
  let trip;
  try{let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>12000){send(413,{error:'请求过长。'});return;}}trip=validateTrip(JSON.parse(body));}catch{send(400,{error:'请检查目的地、有效日期、房间数和住宿总预算。'});return;}
  const rate=rates.get(ip);if(rate&&now-rate.time<60000&&rate.count>=8){send(429,{error:'狗狗需要喘口气，一分钟后再试。'});return;}
  if(active>=2){send(429,{error:'狗狗正在处理其他请求，请稍后再试。'});return;}
  rates.set(ip,rate&&now-rate.time<60000?{...rate,count:rate.count+1}:{time:now,count:1});active++;
  try{
   const started=Date.now();const fly=await searchHotels(trip);const screened=screenHotels(fly.items,trip);
   const base={trip,...screened,source:{name:'飞猪 FlyAI 实时检索',queriedAt:new Date().toISOString(),count:fly.items.length,hint:fly.hint},risks:['价格为查询时展示价，住宿估算不是已锁定报价，最终房型与价格以飞猪详情页为准。','未核实可售房间数、每间可住人数、早餐、税费、取消政策和安静程度。','本次预算只计算住宿，不含往返交通、餐饮与景点门票。']};
   if(!screened.eligible.length){send(200,{...base,status:'no_match',selected:null,jev:{called:false},elapsedMs:Date.now()-started});return;}
   const decision=await decide(screened.eligible,trip);
   send(200,{...base,status:decision.selected?'recommended':'deferred',selected:decision.selected,jev:{called:true,model:decision.model,answer:decision.answer,elapsedMs:decision.elapsedMs,usage:decision.usage},elapsedMs:Date.now()-started});
  }catch(error){const known=/^(Jev |飞猪|服务端)/.test(error.message);send(502,{error:known?error.message:'上游服务暂时不可用，请稍后重试；没有使用模拟结果。'});}finally{active--;}
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const server=createApp();const port=Number(process.env.PORT??3210);const host=process.env.HOST??'127.0.0.1';server.listen(port,host,()=>console.log(`狗拿主意：http://${host}:${port}`));
}
