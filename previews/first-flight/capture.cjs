const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{let b=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});try{
let page=await b.newPage({viewport:{width:1100,height:740}}), errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(require('url').pathToFileURL(path.resolve('dist/FIRST-FLIGHT.html')).href);
console.log('start',await page.locator('#facts').innerText(),errors);const dir=path.resolve(process.env.CAPTURE_DIR || 'dist/first-flight-proof');fs.mkdirSync(dir,{recursive:true});
async function seek(t){await page.locator('#seek').evaluate((e,t)=>{e.value=t;e.dispatchEvent(new Event('input'))},t);}
await page.waitForFunction(()=>document.querySelector('#film').dataset.shot==='opening',null,{timeout:10000});
await page.locator('#play').click();await seek(1200);await page.screenshot({path:path.join(dir,'opening.png')});
for(let [seed,pick,name,t] of [['76','safe','detour',11900],['76','risk','impact',14300],['385','risk','flight',12300]]){
await page.selectOption('#seed',seed);await page.click('#restart');await seek(21000);assert.equal(await page.locator('#film').getAttribute('data-shot'),'choice');await page.waitForTimeout(200);assert.equal(await page.locator('#seek').inputValue(),'7200');await page.click('#'+pick);await seek(t);await page.locator('#native').check();
let film=page.locator('#film');await film.screenshot({path:path.join(dir,name+'.png')});
let frame=await film.evaluate(e=>e.toDataURL());await seek(t+250);assert.notEqual(frame,await film.evaluate(e=>e.toDataURL()));await seek(t);assert.ok(frame===await film.evaluate(e=>e.toDataURL()),'Seek must reproduce identical pixels');
// Play across a cut instead of only sampling still frames.
await seek(name==='impact'?13500:14000);await page.click('#play');
await page.waitForFunction(id=>document.querySelector('#film').dataset.shot===id,
  {impact:'impact',detour:'detourMerge',flight:'landing'}[name],{timeout:5000});
await page.click('#play');
if(name==='flight')await film.screenshot({path:path.join(dir,'landing.png')});
await seek(18000);await page.screenshot({path:path.join(dir,name+'-report.png')});const report=await page.locator('#facts').innerText();assert.ok(report.includes('Bridge damage: '+({detour:0,impact:9,flight:1}[name])));console.log(seed,pick,report);await page.locator('#native').uncheck();
}
await page.locator('#reduce').check();await seek(1700);await page.selectOption('#speed','4x');await page.click('#play');await page.waitForTimeout(420);await page.click('#play');console.log('4x elapsed',await page.locator('#seek').inputValue());await page.click('#restart');await page.click('#skip');assert.equal(await page.locator('#seek').inputValue(),'24300');console.log('skip',await page.locator('#facts').innerText());assert.deepEqual(errors,[]);console.log('PASS');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
