import {travelCandidates} from './grounded-choice.js';
import {safeUrl} from './decision-core.js';

// Keep presentation independent of whether the model can justify a selection.
export function buildAnswerModel(evidence,excluded=[],selection=null){
 if(!Array.isArray(evidence)||!Array.isArray(excluded))throw new Error('候选证据与排除记录必须是数组。');
 const semantic=[],hints=[],results=[];
 const addText=(result,text)=>{if(typeof text==='string'&&text.trim())semantic.push({tool:result.tool,queriedAt:result.queriedAt,text});};
 const addHint=text=>{if(typeof text==='string'&&text.trim()&&!hints.includes(text))hints.push(text);};
 for(const result of evidence){
  if(!result||typeof result!=='object'||Array.isArray(result)||!Object.hasOwn(result,'data'))throw new Error('查询返回结构异常，不能将其当作没有候选。');
  addHint(result.hint);addHint(result.systemMessage);
  const data=result.data;
  const known=typeof data==='string'?!!data.trim():Array.isArray(data)||(data&&typeof data==='object'&&(Array.isArray(data.itemList)||['text','content','answer','summary'].some(k=>typeof data[k]==='string'&&data[k].trim())));
  if(!known)throw new Error('查询返回结构异常，不能将其当作没有候选。');
  if(typeof data==='string'){addText(result,data);continue;}
  const items=Array.isArray(data?.itemList)?data.itemList:Array.isArray(data)?data:[];
  if(items.some(item=>item===null||!['string','object'].includes(typeof item)||Array.isArray(item)))throw new Error('候选结构异常，不能将其当作没有候选。');
  for(const item of items)if(typeof item==='string')addText(result,item);
  if(data&&typeof data==='object'&&!Array.isArray(data)){
   for(const key of ['text','content','answer','summary'])addText(result,data[key]);
   addHint(data.systemMessage);
  }
  const actual=items.filter(item=>item&&typeof item==='object'&&!Array.isArray(item));
  if(actual.length)results.push({...result,data:{itemList:actual}});
 }
 const candidates=travelCandidates(results).map(candidate=>({...candidate,link:safeUrl(candidate.link)}));
 const denied=new Set(excluded.map(String));
 const excludedCandidates=candidates.filter(candidate=>denied.has(candidate.stableId));
 const available=candidates.filter(candidate=>!denied.has(candidate.stableId));
 let selected=null;
 if(selection!==null){
  if(!selection||typeof selection!=='object'||Array.isArray(selection))throw new Error('主推选择无效。');
  if(selection.selected!=null){
   const id=selection.selected?.stableId;
   selected=available.find(candidate=>candidate.stableId===id);
   if(!selected)throw new Error('主推必须属于本轮真实候选，且不能是已被否决的候选。');
  }
 }
 return {status:selected?'recommended':candidates.length?'deferred':semantic.length?'semantic':'empty',selected,candidates,alternatives:available.filter(candidate=>candidate!==selected),excludedCandidates,semantic,hints};
}
