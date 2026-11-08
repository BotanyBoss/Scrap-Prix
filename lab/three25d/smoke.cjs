// Smoke check for the isolated real-3D lab. Requires Chrome/Chromium and CDN access.
const {spawn,spawnSync}=require('node:child_process');
const http=require('node:http'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const chromePath=process.env.CHROME_PATH||['google-chrome','chromium','chromium-browser'].find(c=>spawnSync('which',[c]).status===0);
if(!chromePath){console.log('SKIP: Chrome or Chromium not installed.');process.exit(0);}
const target=path.join(__dirname,'index.html');
const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(fs.readFileSync(target));});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const port=server.address().port, profile=fs.mkdtempSync(path.join(os.tmpdir(),'scrap-3d-'));
 const debug=9800+Math.floor(Math.random()*900);
 const chrome=spawn(chromePath,['--headless=new','--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage',
   '--window-size=1200,860', '--remote-debugging-port='+debug,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 let socket;
 try{
   let page;
   for(let i=0;i<55&&!page;i++){await pause(250);try{
     const list=await (await fetch('http://127.0.0.1:'+debug+'/json')).json();page=list.find(x=>x.type==='page');
   }catch{}}
   assert(page,'Headless Chrome did not start');
   socket=new WebSocket(page.webSocketDebuggerUrl);
   await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
   let seq=0;const requests=new Map(),errors=[];
   socket.onmessage=event=>{
     const m=JSON.parse(event.data);
     if(m.id&&requests.has(m.id)){requests.get(m.id)(m);requests.delete(m.id);return;}
     if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
     if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text);
     if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(a=>a.value||a.description).join(' '));
   };
   const cmd=(method,params={})=>new Promise(resolve=>{const id=++seq;requests.set(id,resolve);socket.send(JSON.stringify({id,method,params}));});
   const evaluate=async expression=>{
     const r=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});return r.result?.result?.value;
   };
   await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Log.enable');
   await cmd('Page.navigate',{url:'http://127.0.0.1:'+port+'/'});
   let ready=false;
   for(let i=0;i<80&&!ready;i++){await pause(350);ready=await evaluate("document.getElementById('loading')?.textContent?.startsWith('Real 3D loaded')")===true;}
   const msg=await evaluate("document.getElementById('loading')?.textContent");
   if(!ready)console.log('Three.js loading status:',msg,'; browser errors:',errors.slice(0,8));
   assert(ready,'Three.js module and GLB loader must initialize and render');
   await pause(800);
   const calls=await evaluate("document.getElementById('calls').textContent");
   assert(Number((calls||'').replace(/[^0-9]/g,''))>15,'Scene must draw real 3D objects');
   const distance=await evaluate("document.getElementById('distance').textContent");
   assert(distance&&distance.includes('Distance:'),'Timeline label must update');
   const control=await evaluate("(()=>{const a=document.getElementById('paint');a.value='#ca6553';a.dispatchEvent(new Event('input'));const b=document.getElementById('chassis');b.value='wagon';b.dispatchEvent(new Event('input'));document.getElementById('toggle').click();return document.getElementById('toggle').textContent;})()");
   assert.equal(control,'Resume','Pause button works');
   const screenshot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   if(screenshot.result?.data)fs.writeFileSync(path.join(__dirname,'lab-browser-proof.png'),Buffer.from(screenshot.result.data,'base64'));
   assert.equal(errors.length,0,'Browser had runtime errors: '+errors.join(' | '));
   console.log('PASS: real 3D Street scene, moving camera-relative geometry, modular car and control changes.');
   console.log('Runtime metrics:',{calls,distance});
 }finally{
   if(socket&&socket.readyState===1)socket.close();
   chrome.kill('SIGTERM');server.close();fs.rmSync(profile,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
