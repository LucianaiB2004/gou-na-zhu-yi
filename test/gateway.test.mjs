import test from 'node:test';import assert from 'node:assert/strict';
import worker from '../gateway/worker.mjs';
test('网关只接受已授权网页来源，不接受缺失密钥或任意上游地址',async()=>{
 const req=(path,headers={},body={})=>new Request('https://gateway.example'+path,{method:'POST',headers:{Origin:'https://lucianaib2004.github.io','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 assert.equal((await worker.fetch(req('/api/flyai',{Origin:'https://evil.example'}),{})).status,403);
 assert.equal((await worker.fetch(req('/api/flyai'),{})).status,401);
 assert.equal((await worker.fetch(req('/api/anything',{Authorization:'Bearer test-key'}),{})).status,404);
 const pre=await worker.fetch(new Request('https://gateway.example/api/flyai',{method:'OPTIONS',headers:{Origin:'https://lucianaib2004.github.io'}}),{});assert.equal(pre.status,204);assert.equal(pre.headers.get('Access-Control-Allow-Origin'),'https://lucianaib2004.github.io');
});
test('边缘运行时使用 manual 并拒绝上游重定向，不转发密钥到新地址',async(t)=>{
 let count=0;t.mock.method(globalThis,'fetch',async(url,options)=>{count++;assert.equal(url,'https://api.typesafe.ai/v1/systemone');assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://evil.example'}});});
 const r=await worker.fetch(new Request('https://gateway.example/api/jev',{method:'POST',headers:{Origin:'https://lucianaib2004.github.io',Authorization:'Bearer test-key-123','Content-Type':'application/json'},body:JSON.stringify({model:'jev-latest',state:'test',questions:{check:{type:'noul'}}})}),{});
 assert.equal(r.status,502);assert.match((await r.json()).error,/重定向/);assert.equal(count,1);
});
