import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.mjs';
test('HTTP 入口保护密钥、拒绝跨站写入与无效请求',async(t)=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const url=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(url+'/.env')).status,404);
 assert.equal((await fetch(url+'/api/decide',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:'{}'})).status,403);
 assert.equal((await fetch(url+'/api/decide',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,400);
 const home=await fetch(url);assert.equal(home.status,200);assert.match(home.headers.get('content-security-policy'),/default-src 'self'/);
});
