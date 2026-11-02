import test from 'node:test';import assert from 'node:assert/strict';
import {travelCandidates,parseGroundedChoice} from '../public/grounded-choice.js';
test('AI 只能选择本轮真实候选，事实由原始字段渲染，不能注入编造主推',()=>{
 const candidates=travelCandidates([{tool:'search_poi',queriedAt:'2026-11-02',data:{itemList:[{name:'西湖',address:'原始地址',ticketInfo:{price:null},jumpUrl:'https://feizhu.com/example'}]}}]);
 assert.equal(candidates[0].price,null);assert.equal(parseGroundedChoice('{"selectedKey":"candidate_0","reasonCode":"theme"}',candidates).selected.name,'西湖');
 assert.throws(()=>parseGroundedChoice('{"selectedKey":"made_up","reasonCode":"theme"}',candidates));
 assert.throws(()=>parseGroundedChoice('{"selectedKey":"candidate_0","reasonCode":"guaranteed_free"}',candidates));
 assert.equal(parseGroundedChoice('{"selectedKey":null}',candidates).selected,null);
});

test('中转交通使用最终目的地和到达时间，保留 ticketPrice 并支持数组结果',()=>{
 const candidates=travelCandidates([{tool:'search_flight',data:[{id:'flight-a',ticketPrice:880,journeys:[{segments:[
  {depCityName:'上海',arrCityName:'武汉',marketingTransportNo:'TEST1',depDateTime:'2026-11-14 08:00',arrDateTime:'2026-11-14 10:00'},
  {depCityName:'武汉',arrCityName:'成都',marketingTransportNo:'TEST2',depDateTime:'2026-11-14 12:00',arrDateTime:'2026-11-14 14:00'}
 ]}]}]}]);
 assert.match(candidates[0].name,/上海 → 成都/);
 assert.equal(candidates[0].departure,'2026-11-14 08:00');
 assert.equal(candidates[0].arrival,'2026-11-14 14:00');
 assert.equal(candidates[0].price,880);
 assert.equal(travelCandidates([{tool:'search_flight',data:[{id:'flight-a',ticketPrice:880}]}],['flight-a']).length,0);
});
