import test from 'node:test';import assert from 'node:assert/strict';
import {answerMarkdown} from '../public/answer-view.js';
import {buildAnswerModel} from '../public/answer-model.js';
import {safeMarkdownUrl,readableTravelMarkdown} from '../public/markdown.js';
const evidence=[{tool:'search_poi',queriedAt:'2026-11-02T00:00:00Z',data:{itemList:[{id:'a',name:'甲景点',jumpUrl:'https://www.fliggy.com/a',price:20},{id:'b',name:'乙景点',jumpUrl:'https://www.fliggy.com/b',ticketInfo:{price:null}}]}}];
test('主推在上、其他候选在下；暂缓时仍保留全部实际链接和未知价格',()=>{
 const selected=answerMarkdown(buildAnswerModel(evidence,[],{selected:{stableId:'a'}}));assert.ok(selected.indexOf('这次主推')<selected.indexOf('其他候选'));assert.ok(selected.includes('https://www.fliggy.com/a'));assert.ok(selected.includes('https://www.fliggy.com/b'));
 const deferred=answerMarkdown(buildAnswerModel(evidence));assert.match(deferred,/证据不够，无法拍板/);assert.match(deferred,/甲景点/);assert.match(deferred,/乙景点/);assert.match(deferred,/展示价：\*\*未知/);
});
test('候选超过16条仍全部展示，不截断链接；空结果与语义结果有独立状态',()=>{
 const data=[{data:{itemList:Array.from({length:23},(_,i)=>({id:String(i),name:'地点'+i,jumpUrl:'https://www.fliggy.com/'+i}))}}];
 const model=buildAnswerModel(data);assert.equal(model.candidates.length,23);assert.ok(answerMarkdown(model).includes('https://www.fliggy.com/22'));
 assert.match(answerMarkdown(buildAnswerModel([])),/本次没有查到候选/);
 assert.match(answerMarkdown(buildAnswerModel([{data:'**语义结果** [查看](https://www.fliggy.com/x)'}])),/\*\*语义结果\*\*/);
});
test('Markdown仅允许无凭据HTTPS链接，图片限可信飞猪CDN',()=>{
 for(const u of ['javascript:alert(1)','data:text/html,x','http://example.com','https://user:pass@example.com','//evil.example'])assert.equal(safeMarkdownUrl(u),null);
 assert.equal(safeMarkdownUrl('https://www.fliggy.com/a'),'https://www.fliggy.com/a');assert.equal(safeMarkdownUrl('https://evil.example/img.png',true),null);assert.ok(safeMarkdownUrl('https://img.alicdn.com/a.jpg',true));
});
test('飞猪景点标记显示地点名称，保留外围加粗并阻止名称注入Markdown',()=>{
 const text='**<spot_entity>name:中国茶叶博物馆(双峰馆区);type=poi;id:2357</spot_entity>**';
 assert.equal(readableTravelMarkdown(text),'**中国茶叶博物馆(双峰馆区)**');
 assert.equal(readableTravelMarkdown('<spot_entity>name:[点我](https://bad.example);type=poi;id:1</spot_entity>'),'\\[点我\\](https://bad.example)');
});
