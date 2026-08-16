const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9377;
const USER = fs.mkdtempSync(path.join(os.tmpdir(), 'fav-render-'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--remote-debugging-port='+PORT,'--user-data-dir='+USER,'about:blank'], { stdio: 'ignore' });
  let t;
  for (let i=0;i<50;i++){ try { const l = await (await fetch('http://127.0.0.1:'+PORT+'/json/list')).json(); const p = l.find(x=>x.type==='page'); if (p){ t=p; break; } } catch{} await sleep(200); }
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ ws.onopen=res; ws.onerror=rej; });
  let id=0; const pend=new Map();
  ws.onmessage=e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){ pend.get(m.id)(m); pend.delete(m.id); } };
  const send=(m,p={})=>new Promise(res=>{ const i=++id; pend.set(i,res); ws.send(JSON.stringify({id:i,method:m,params:p})); });
  const ev=async ex=>{ const r=await send('Runtime.evaluate',{expression:ex,returnByValue:true,awaitPromise:true}); return r.result&&r.result.result&&r.result.result.value; };
  await send('Page.enable');
  await send('Page.navigate',{url:'http://localhost:3000/'});
  await sleep(6000);
  const out = await ev(`(async()=>{
    const img=new Image();
    const ok=await new Promise(res=>{ img.onload=()=>res('RENDERS '+img.naturalWidth+'x'+img.naturalHeight); img.onerror=()=>res('FAILED'); img.src='/favicon.svg'; });
    const txt=await (await fetch('/favicon.svg')).text();
    return { render: ok, hasVite: txt.includes('863bff'), isSun: txt.includes('059669'), sizeBytes: txt.length };
  })()`);
  console.log(JSON.stringify(out,null,2));
  ws.close(); chrome.kill();
})().catch(e=>{ console.error(e); process.exit(1); });
