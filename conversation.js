export function createConversation(){return {needs:[],excluded:[],lastSelected:null};}
export function beginTurn(state,text){
 const next=[...state.needs,text];if(next.join('\n').length>8000)throw new Error('这趟对话已经较长。为完整保留条件，请开启新对话，把最终需求合并后继续。');
 const excluded=[...state.excluded];if(state.lastSelected&&/不服|换一|换个|这家不|这个不|不考虑|不要这|再选|重新选|太贵|再便宜|便宜点/.test(text)&&!excluded.includes(state.lastSelected.stableId))excluded.push(state.lastSelected.stableId);
 return {...state,needs:next,excluded};
}
export function conversationContext(state){return {role:'user',content:'以下是这趟旅行历次需求原文，保留未明确更正的条件，最新明确更正优先；不要要求重复已提供的条件。\n'+state.needs.map((x,i)=>`${i+1}. ${x}`).join('\n')+'\n已否决候选：'+state.excluded.join('、')};}
