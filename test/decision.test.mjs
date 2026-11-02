import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTrip, parsePrice, screenHotels, validateDecision } from '../src/decision.mjs';
const trip = {destination:'杭州',checkIn:'2026-11-14',checkOut:'2026-11-16',rooms:2,budget:1000,minRating:4,concern:'安静'};
test('核算间夜，拒绝过去日期、无效日历和零晚',()=>{
 assert.equal(validateTrip(trip,'2026-11-02').nights,2);
 for(const patch of [{checkIn:'2026-02-30'},{checkIn:'2026-10-01'},{checkOut:trip.checkIn},{rooms:0},{budget:Infinity}]) assert.throws(()=>validateTrip({...trip,...patch},'2026-11-02'));
});
test('仅接受明确的人民币展示金额，不将起价区间未知值当准确金额',()=>{
 assert.equal(parsePrice('¥1,234.50'),1234.5);
 for(const value of ['¥23起','23-80','免费','未知',null,'$50',0,-1]) assert.equal(parsePrice(value),null);
});
test('未知价格、评分、超预算、共享床位和不安全链接被淘汰',()=>{
 const hotels=[{shId:'ok',name:'正常酒店',price:'¥200',rate:'4.8',detailUrl:'https://router.feizhu.com/test'},
 {shId:'price',name:'起价',price:'¥20起',rate:'4.9'},
 {shId:'budget',name:'超支',price:'¥300',rate:'4.9'},
 {shId:'rating',name:'无评分',price:'¥100'},
 {shId:'bed',name:'青年旅舍床位房',price:'¥50',rate:'4.9'},
 {shId:'link',name:'恶意',price:'¥100',rate:'4.9',detailUrl:'javascript:alert(1)'}];
 const result=screenHotels(hotels,validateTrip(trip,'2026-11-02'));
 assert.equal(result.eligible.length,1); assert.equal(result.eligible[0].total,800); assert.equal(result.rejected.length,5);
});
test('Jev 必须返回合法候选、完整概率、有效置信度；低置信度暂缓',()=>{
 const ids=['a','b','defer'];
 const answer={type:'choice',choice:'a',confidence:0.8,probabilities:{a:0.8,b:0.1,defer:0.1}};
 assert.equal(validateDecision(answer,ids).choice,'a');
 assert.equal(validateDecision({...answer,confidence:0.4},ids).choice,'defer');
 for(const bad of [{...answer,choice:'hack'},{...answer,confidence:2},{...answer,probabilities:{a:1}},{...answer,probabilities:{a:2,b:-1,defer:0}}]) assert.throws(()=>validateDecision(bad,ids));
});
test('上游混入非对象酒店时明确报告结构异常',()=>{
 assert.throws(()=>screenHotels([null],validateTrip(trip,'2026-11-02')),/候选结构异常/);
});
