'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const scripts = path.join(__dirname, '../public/assets');
const context = vm.createContext({URLSearchParams, URL});
function include(name) {
  vm.runInContext(fs.readFileSync(path.join(scripts, name+'.js'), 'utf8'), context, {filename:name});
}
const run = code => vm.runInContext(code, context);
run(`const location={hash:'',search:'?id=12&v=31',assign(){}};
  const controls = {};
  const document = {body:{dataset:{page:'review'}}, querySelector:s=>controls[s],querySelectorAll:()=>[]};
  let confirmed=false;
  const window={confirm:()=>confirmed};
  const writes=[];
`);
include('routes');
include('app');
include('pages/review');
include('pages/compare');
include('manage');
context.PixelComparison = require('../public/assets/comparison.js');
function equal(source, expected) {
  assert.equal(run(source), expected, source);
}
async function main() {
  equal("pageUrl('/review/12?v=31')", 'review.php?v=31&id=12');
  equal("routeParts().parts.join('/')", 'review/12');
  equal("routeParts().params.get('v')",'31');
  console.log('PASS PHP navigation retains design and version IDs');
  run(`S.user={id:1,system_role:'user'}; S.project={id:5,role:'reviewer',archived:0};
    S.asset={id:12,versions:[{id:8,asset_id:12,version_number:1},{id:10,asset_id:12,version_number:2},{id:15,asset_id:12,version_number:3}]};
    const makeSelect=()=>({value:'',options:S.asset.versions.map(v=>({value:String(v.id)}))});
    controls['#compare-old']=makeSelect();controls['#compare-new']=makeSelect();
    S.oldVersion=S.asset.versions[0];S.newVersion=S.asset.versions[2];syncCompareControls();
  `);
  equal("controls['#compare-new'].options[0].disabled",true);
  equal("controls['#compare-old'].options[2].disabled",true);
  equal("controls['#compare-new'].options[1].disabled",false);
  console.log('PASS both UI selectors disable the other selected version');
  run(`S.threads=[{id:71,display_number:3,author_id:1,author_name:'Linh',body:'<script>x</script>',created_at:'2026-01-01 10:00:00',kind:'point',x:.75,y:.3,status:'open',revision:2,replies:[]}];
    S.selected=71; S.status='open'; S.search='script';
    const actionButton=(action,label)=>'<button data-action="'+action+'">'+label+'</button>';
  `);
  equal("threadCards().includes('#3') && pins(visibleThreads()).includes('Góp ý 3')",true);
  equal("threadCards().includes('&lt;script&gt;') && !threadCards().includes('<script>')",true);
  console.log('PASS filtered cards and pins share the stored number and escape user input');
  run(`api=async (a,data)=>writes.push([a,data]);refreshThreads=async()=>{};
    paintThreads=()=>{};toast=()=>{};controls['#modal']={open:false};
  `);
  await run("deleteItem('thread',71)");
  equal('writes.length',0);
  run('confirmed=true');
  await run("deleteItem('thread',71)");
  equal("writes[0][0]",'thread.delete');
  equal("writes[0][1].confirmed===true && writes[0][1].revision===2",true);
  console.log('PASS Cancel performs no write and OK sends the confirmed current revision');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
