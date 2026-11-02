import test from 'node:test';import assert from 'node:assert/strict';
import {createConversation,beginTurn,conversationContext} from '../public/conversation.js';
import {travelCandidates} from '../public/grounded-choice.js';
test('三轮续聊保留原始条件与更正，商品重排后也排除被否决项',()=>{
 let state=createConversation();state=beginTurn(state,'杭州，11月14到16日，一间，总预算1000，西湖附近');
 const results=[{tool:'search_hotels',data:{itemList:[{shId:'a',name:'住处A'},{shId:'b',name:'住处B'}]}}];
 state.lastSelected=travelCandidates(results)[0];state=beginTurn(state,'我不服，预算改600');state=beginTurn(state,'再便宜一点，别改日期');
 assert.match(conversationContext(state).content,/11月14到16日/);assert.match(conversationContext(state).content,/预算改600/);assert.deepEqual(state.excluded,['a']);
 const reversed=[{tool:'search_hotels',data:[{shId:'b',name:'住处B'},{shId:'a',name:'住处A'}]}];assert.deepEqual(travelCandidates(reversed,state.excluded).map(x=>x.stableId),['b']);
 assert.equal(createConversation().needs.length,0);
});
