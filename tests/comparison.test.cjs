'use strict';
const assert=require('node:assert/strict');
const {validPair,bindSlider}=require('../public/assets/comparison.js');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
const version=(id,n,asset=7)=>({id,version_number:n,asset_id:asset});
check('Only distinct versions of one image in chronological order',()=>{
 assert.equal(validPair(version(40,1),version(41,2)),true);
 assert.equal(validPair(version(40,1),version(40,1)),false);
 assert.equal(validPair(version(41,2),version(40,1)),false);
 assert.equal(validPair(version(40,1),version(41,2,8)),false);
 assert.equal(validPair(null,version(41,2)),false);
 assert.equal(validPair(version('40','1'),version('41','2')),true);
});
class Element{
 constructor(){this.handlers={};this.attrs={};this.props={};this.style={setProperty:(k,v)=>this.props[k]=v};this.capture=null;}
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
 setAttribute(k,v){this.attrs[k]=v;}
 setPointerCapture(id){this.capture=id;}
 hasPointerCapture(id){return this.capture===id;}
 releasePointerCapture(id){if(this.capture===id)this.capture=null;}
 emit(type,props={}){const e={button:0,pointerId:1,preventDefault(){this.prevented=true;},...props};for(const fn of this.handlers[type]||[])fn(e);return e;}
}
const stage=new Element(),handle=new Element(),range=new Element();let rect={left:100,width:400},reported;
stage.querySelector=()=>handle;stage.getBoundingClientRect=()=>rect;
const slider=bindSlider(stage,range,50,value=>reported=value);
const expect=value=>{assert.equal(slider.get(),value);assert.equal(range.value,String(value));assert.equal(stage.props['--split'],value+'%');assert.equal(handle.attrs['aria-valuenow'],String(value));assert.equal(reported,value);};
check('Starts centered and synchronizes range, image cut and accessible handle',()=>expect(50));
check('Range input and change move the image cut',()=>{range.value='25';range.emit('input');expect(25);range.value='75';range.emit('change');expect(75);});
check('Pointer drag stays captured beyond image bounds',()=>{stage.emit('pointerdown',{clientX:200});expect(25);assert.equal(stage.capture,1);stage.emit('pointermove',{clientX:700});expect(100);stage.emit('pointermove',{clientX:0});expect(0);stage.emit('pointerup',{clientX:300});expect(50);assert.equal(stage.capture,null);stage.emit('pointermove',{clientX:400});expect(50);});
check('Other pointers and secondary clicks cannot hijack a drag',()=>{stage.emit('pointerdown',{clientX:100,button:2});expect(50);stage.emit('pointerdown',{clientX:200,pointerId:9});expect(25);stage.emit('pointerdown',{clientX:500,pointerId:10});stage.emit('pointermove',{clientX:500,pointerId:10});expect(25);stage.emit('pointercancel',{pointerId:9});stage.emit('pointermove',{clientX:500,pointerId:9});expect(25);});
check('Resizing uses current image bounds; lost capture ends drag',()=>{rect={left:50,width:200};stage.emit('pointerdown',{clientX:200});expect(75);stage.emit('lostpointercapture');stage.emit('pointermove',{clientX:50});expect(75);});
check('Keyboard arrows, Shift and endpoints update both controls',()=>{handle.emit('keydown',{key:'ArrowRight'});expect(76);handle.emit('keydown',{key:'ArrowLeft',shiftKey:true});expect(66);handle.emit('keydown',{key:'Home'});expect(0);handle.emit('keydown',{key:'ArrowLeft'});expect(0);handle.emit('keydown',{key:'End'});expect(100);handle.emit('keydown',{key:'ArrowRight'});expect(100);});
check('Range clamps invalid and out of bounds values',()=>{slider.set(-20);expect(0);slider.set(130);expect(100);slider.set(NaN);expect(50);});
console.log('ALL '+passed+' COMPARISON GROUPS PASSED');
