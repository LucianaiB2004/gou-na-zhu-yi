import test from 'node:test';import assert from 'node:assert/strict';
import {validateSettings,createClient} from '../public/api-client.js';
const cfg={gateway:'https://gateway.example',flyaiKey:'fly-key-123',jevKey:'jev-key-123',model:'jev-latest'};
test('API 设置拒绝不安全地址和不完整密钥',()=>{
 assert.equal(validateSettings(cfg).gateway,'https://gateway.example');
 for(const patch of [{gateway:'http://evil.example'},{gateway:'https://user:password@evil.example'},{flyaiKey:''},{jevKey:'short'},{model:'arbitrary-model'}])assert.throws(()=>validateSettings({...cfg,...patch}));
});
test('飞猪与 Jev 凭据只发往各自接口，不混入请求体',async()=>{
 const requests=[];const client=createClient(cfg,async(url,options)=>{requests.push({url,...options});return new Response(JSON.stringify(url.endsWith('flyai')?{items:[],hint:null}:{model:'jev-test',answers:{check:{type:'noul',noul:.9}}}),{status:200});});
 await client.search({destination:'杭州',checkIn:'2026-11-14',checkOut:'2026-11-16',budget:1000,nights:2,rooms:1});await client.verifyJev();
 assert.equal(requests[0].headers.Authorization,'Bearer fly-key-123');assert.equal(requests[1].headers.Authorization,'Bearer jev-key-123');
 for(const r of requests){assert.ok(!r.body.includes('key-123'));assert.equal(r.credentials,'omit');assert.equal(r.redirect,'error');}
});
test('错误与非法验证输出不会报告 API 成功',async()=>{
 await assert.rejects(()=>createClient(cfg,async()=>new Response('{}',{status:451})).verifyJev(),/451/);
 await assert.rejects(()=>createClient(cfg,async()=>new Response(JSON.stringify({answers:{check:{noul:7}}}))).verifyJev(),/无效/);
});
test('分别验证单个 Key 时，另一空 Key 不破坏错误信息',async()=>{
 await assert.rejects(()=>createClient({...cfg,flyaiKey:''},async()=>new Response(JSON.stringify({error:'HTTP 401: Key 无效'}),{status:401})).verifyJev(),e=>e.message==='HTTP 401: Key 无效');
});
test('成功状态下的空 JSON 也必须明确失败',async()=>{
 const client=createClient(cfg,async()=>new Response('null'));
 await assert.rejects(()=>client.verifyJev(),/无效验证结果/);
 await assert.rejects(()=>client.search({destination:'杭州',budget:1000,nights:2,rooms:1}),/有效候选/);
});
