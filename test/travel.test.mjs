import test from 'node:test';import assert from 'node:assert/strict';
import {TOOLS,validateToolCall,toolSchemas} from '../public/travel-tools.js';
import worker from '../gateway/worker.mjs';
const request=(path,body)=>new Request('https://gateway.example'+path,{method:'POST',headers:{Origin:'https://lucianaib2004.github.io',Authorization:'Bearer test-key-123','Content-Type':'application/json'},body:JSON.stringify(body)});
test('8 类官方工具拒绝未知参数、写操作、非法日期和原型注入',()=>{
 assert.equal(TOOLS.length,8);assert.equal(toolSchemas().length,8);
 assert.equal(validateToolCall('search_domestic_train',{origin:'上海',destination:'杭州'}).limit,10);
 for(const [name,args]of [['create_order',{}],['search_flight',{origin:'上海',url:'https://evil.example'}],['search_hotels',{destName:'杭州',checkInDate:'2026-02-30'}],['search_poi',{cityName:'杭州',poiLevel:9}],['fliggy_fast_search',Object.assign(Object.create({query:'x'}),{})]])assert.throws(()=>validateToolCall(name,args));
});
test('网关输入非法时在访问上游前拒绝，包括酒店反向日期和 null',async(t)=>{
 let count=0;t.mock.method(globalThis,'fetch',async()=>{count++;throw new Error('must not call');});
 for(const [path,body]of [['/api/travel',{tool:'pay',arguments:{}}],['/api/flyai',{trip:{destination:'杭州',checkIn:'2099-12-03',checkOut:'2099-12-02',maxPrice:500}}],['/api/aliyun',null],['/api/aliyun',{model:'qwen-plus',messages:[{role:'assistant',content:null,tool_calls:[null]}]}]])assert.equal((await worker.fetch(request(path,body),{})).status,400);
 assert.equal(count,0);
});
test('阿里云只使用固定地域端点和对应 Key，工具清单由服务器提供',async(t)=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(url,'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer test-key-123');assert.equal(options.redirect,'manual');const data=JSON.parse(options.body);assert.equal(data.tools.length,8);assert.equal(data.messages[0].role,'system');assert.ok(!options.body.includes('test-key'));return new Response(JSON.stringify({model:'qwen-plus',choices:[{message:{content:'旅行建议'}}]}));});
 const r=await worker.fetch(request('/api/aliyun',{model:'qwen-plus',region:'beijing',messages:[{role:'user',content:'杭州怎么安排？'}]}),{});assert.equal(r.status,200);assert.equal((await r.json()).message.content,'旅行建议');
});
