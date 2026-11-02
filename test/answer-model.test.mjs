import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAnswerModel} from '../public/answer-model.js';
const evidence=[{tool:'search_poi',queriedAt:'2026-11-02',hint:'核实预约',data:{itemList:[
 {id:'a',name:'真实甲',price:20,jumpUrl:'https://www.fliggy.com/a'},
 {id:'b',name:'真实乙',ticketInfo:{price:null}},
 {id:'c',name:'真实丙',jumpUrl:'javascript:alert(1)'}
]}}];

test('主推仅采用本轮候选事实，其余实际候选全部保留',()=>{
 const answer=buildAnswerModel(evidence,[],{selected:{stableId:'a',name:'伪造名称',price:0},reason:'位置'});
 assert.equal(answer.status,'recommended');assert.equal(answer.selected.name,'真实甲');assert.equal(answer.selected.price,20);
 assert.deepEqual(answer.alternatives.map(c=>c.stableId),['b','c']);assert.equal(answer.candidates.length,3);
 assert.equal(answer.selected.link,'https://www.fliggy.com/a');assert.deepEqual(answer.hints,['核实预约']);
});
test('没有足够依据仍保留实际候选，不冒充无结果',()=>{
 for(const selection of [null,{selected:null,reason:null}]){const answer=buildAnswerModel(evidence,[],selection);assert.equal(answer.status,'deferred');assert.equal(answer.selected,null);assert.equal(answer.alternatives.length,3);}
 const answer=buildAnswerModel(evidence,['a','b','c']);assert.equal(answer.status,'deferred');assert.equal(answer.candidates.length,3);assert.equal(answer.alternatives.length,0);assert.equal(answer.excludedCandidates.length,3);
});
test('真正空结果为empty，单独与混合语义内容完整保留',()=>{
 assert.equal(buildAnswerModel([{data:{itemList:[]}}]).status,'empty');
 const semantic={tool:'fliggy_ai_search',data:'## 官方语义结果\n未单独核实'};
 const only=buildAnswerModel([semantic]);assert.equal(only.status,'semantic');assert.equal(only.semantic[0].text,semantic.data);assert.equal(only.candidates.length,0);
 const mixed=buildAnswerModel([...evidence,semantic,{data:{itemList:['补充文字'],text:'另一段整理'}}]);
 assert.equal(mixed.status,'deferred');assert.equal(mixed.candidates.length,3);assert.deepEqual(mixed.semantic.map(s=>s.text),[semantic.data,'补充文字','另一段整理']);
});
test('未知价格与无链接不伪造事实，不安全链接不能成为详情链接',()=>{
 const answer=buildAnswerModel(evidence);assert.equal(answer.candidates[1].price,null);assert.equal(answer.candidates[1].link,null);assert.equal(answer.candidates[2].link,null);
});
test('拒绝本轮以外、已否决或无stableId的主推',()=>{
 for(const selected of [{stableId:'missing'},{name:'真实甲'},'a'])assert.throws(()=>buildAnswerModel(evidence,[],{selected}),/本轮真实候选/);
 assert.throws(()=>buildAnswerModel(evidence,['a'],{selected:{stableId:'a'}}),/已被否决/);
 const answer=buildAnswerModel(evidence,['b'],{selected:{stableId:'a'}});assert.deepEqual(answer.excludedCandidates.map(c=>c.stableId),['b']);assert.deepEqual(answer.alternatives.map(c=>c.stableId),['c']);
});

test('非法成功响应不能伪装空结果，显式空列表才是正常empty',()=>{
 for(const result of [{},{data:null},{data:{}},{data:{itemList:'bad'}},{data:{itemList:[null]}}])assert.throws(()=>buildAnswerModel([result]),/结构异常/);
 assert.equal(buildAnswerModel([{data:{itemList:[]}}]).status,'empty');
});
