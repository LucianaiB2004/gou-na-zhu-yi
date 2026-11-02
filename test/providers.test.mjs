import test from 'node:test';
import assert from 'node:assert/strict';
import {extractHotelResponse, decide} from '../src/providers.mjs';
test('上游业务错误和结构改变不能成为空搜索成功',()=>{
 assert.deepEqual(extractHotelResponse({status:0,data:{itemList:[]}}).items,[]);
 for(const raw of [{status:1,message:'failed'},{status:0,data:{}},{data:{itemList:[]}}])assert.throws(()=>extractHotelResponse(raw));
});
test('Jev 使用真实官方接口，HTTP 失败显式失败，禁止转发授权到重定向',async()=>{
 const eligible=[{id:'a',name:'A'},{id:'b',name:'B'}];
 let called=false;
 await assert.rejects(()=>decide(eligible,{concern:'安静'},'test-key',async(url,opts)=>{
  called=true;assert.equal(url,'https://api.typesafe.ai/v1/systemone');assert.equal(opts.redirect,'error');
  const body=JSON.parse(opts.body);assert.ok(body.questions.pick.criteria.defer);
  return new Response('{}',{status:401});
 }),/401/);assert.ok(called);
});
