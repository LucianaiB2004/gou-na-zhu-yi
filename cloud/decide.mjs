// Bailian runtime: official FlyAI CLI runs directly; never bypass region restrictions.
import {readFile} from 'node:fs/promises';
import {validateTrip,screenHotels} from '../src/decision.mjs';
import {searchHotels,decide} from '../src/providers.mjs';
try {
 const inputPath=process.argv[2];
 if(!inputPath)throw new Error('请提供旅行条件 JSON 文件路径。');
 const trip=validateTrip(JSON.parse(await readFile(inputPath,'utf8')));
 const fly=await searchHotels(trip), screened=screenHotels(fly.items,trip);
 let decision=null,jev={called:false,available:false};
 if(screened.eligible.length&&process.env.TYPESAFE_API_KEY){
  try {decision=await decide(screened.eligible,trip);jev={called:true,available:true,model:decision.model};}
  catch(error){jev={called:true,available:false,error:error.message};}
 }
 const status=!screened.eligible.length?'no_match':decision?'jev_decision':'bailian_judgment_required';
 console.log(JSON.stringify({status,trip,...screened,decision,jev,
  source:{name:'Official FlyAI CLI',queriedAt:new Date().toISOString(),count:fly.items.length,hint:fly.hint},
  priceBasis:'每间每晚展示价 × 晚数 × 房间数，仅住宿估算，非锁定报价。',
  execution:{orchestrator:'Alibaba Cloud Bailian Managed Agent',integration:'Direct official FlyAI CLI; optional direct TypeSafe API. If Jev is unavailable, Bailian must identify its own evidence-based judgment without Jev probabilities.'}
 },null,2));
}catch(error){let message=String(error.message??'请求失败');for(const key of [process.env.FLYAI_API_KEY,process.env.TYPESAFE_API_KEY].filter(Boolean))message=message.split(key).join('[密钥已隐藏]');console.error(message.slice(0,350));process.exitCode=1;}
