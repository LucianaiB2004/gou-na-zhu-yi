import {marked} from './vendor/marked.js';
import DOMPurify from './vendor/purify.js';
export function safeMarkdownUrl(raw,image=false){
 try{if(typeof raw!=='string'||!/^https:\/\//i.test(raw))return null;const u=new URL(raw);if(u.username||u.password)return null;if(image&&!['alicdn.com','taobaocdn.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return null;return u.href;}catch{return null;}
}
// FlyAI sometimes embeds an entity marker inside otherwise ordinary Markdown.
// Keep the human-readable name and let the normal Markdown sanitizer handle it.
export function readableTravelMarkdown(value){
 return String(value??'').replace(/<spot_entity>\s*name:([^;<>\r\n]+);type=[^<>]*<\/spot_entity>/gi,(_,name)=>name.trim().replace(/([\\`*_{}\[\]<>#!|])/g,'\\$1'));
}
export function renderMarkdown(target,text){
 const html=marked.parse(readableTravelMarkdown(text).replace(/^[\u200B-\u200F\uFEFF]/,''),{gfm:true,breaks:true});
 const fragment=DOMPurify.sanitize(html,{RETURN_DOM_FRAGMENT:true,ALLOWED_TAGS:['h1','h2','h3','h4','h5','h6','p','strong','em','del','s','ul','ol','li','a','img','code','pre','blockquote','hr','br','table','thead','tbody','tr','th','td'],ALLOWED_ATTR:['href','src','alt','title','start','colspan','rowspan'],ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false});
 for(const a of fragment.querySelectorAll('a')){const href=safeMarkdownUrl(a.getAttribute('href'));if(href){a.href=href;a.target='_blank';a.rel='noopener noreferrer';}else a.removeAttribute('href');}
 for(const img of fragment.querySelectorAll('img')){const src=safeMarkdownUrl(img.getAttribute('src'),true);if(!src){img.replaceWith(document.createTextNode(img.alt??''));continue;}img.src=src;img.loading='lazy';img.referrerPolicy='no-referrer';}
 for(const table of fragment.querySelectorAll('table')){const wrap=document.createElement('div');wrap.className='markdown-table';table.before(wrap);wrap.append(table);}
 target.replaceChildren(fragment);target.classList.add('markdown-body');
}
