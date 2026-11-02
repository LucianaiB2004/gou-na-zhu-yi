import {readFile} from 'node:fs/promises';
import {validateTrip,screenHotels} from '../src/decision.mjs';
import {searchHotels,decide} from '../src/providers.mjs';
try{
 const path=process.argv[2];if(!path)throw new Error('用法：node scripts/decide.mjs trip.json；密钥只从环境读取。');
 const trip=validateTrip(JSON.parse(await readFile(path,'utf8')));
 const fly=await searchHotels(trip);const screened=screenHotels(fly.items,trip);
 const decision=screened.eligible.length?await decide(screened.eligible,trip):null;
 console.log(JSON.stringify({trip,...screened,decision,source:{name:'FlyAI',queriedAt:new Date().toISOString(),count:fly.items.length,hint:fly.hint},priceBasis:'每间每晚展示价 × 晚数 × 房间数，仅住宿估算，非锁定报价；房型、库存、退改等仍需核实。'},null,2));
}catch(error){console.error(/^(Jev |飞猪|服务端|用法)/.test(error.message)?error.message:'旅行条件无效或上游请求失败。');process.exitCode=1;}
