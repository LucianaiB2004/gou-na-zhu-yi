import {mkdir,copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),target=new URL('public/vendor/',root);
await mkdir(target,{recursive:true});
for(const [source,name]of [['marked/lib/marked.esm.js','marked.js'],['marked/LICENSE','marked-LICENSE.md'],['dompurify/dist/purify.es.mjs','purify.js'],['dompurify/LICENSE','DOMPurify-LICENSE'],['dompurify/LICENSE-MPL','DOMPurify-LICENSE-MPL']])await copyFile(new URL('node_modules/'+source,root),new URL(name,target));
console.log('Markdown 浏览器依赖与许可证已同步。');
