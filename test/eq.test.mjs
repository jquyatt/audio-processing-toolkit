// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import math from '../src/eq-math.js';
const {eqCoefficients,eqDb,eqResponse,eqGeometry,eqX,eqY,eqDrag}=math;
const band=(gain=0,type=2,q=1)=>({known:true,type,frequency:1000,gain,q});
const near=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≠ ${b}`);
test('peaking model has exact center gain and reciprocal boost/cut response',()=>{
 near(eqDb(eqCoefficients(band(6)),1000),6);
 for(const f of [20,100,500,1000,5000,20000]){
  near(eqDb(eqCoefficients(band()),f),0);
  near(eqResponse([band(9,2,3),band(-9,2,3)],f),0);
 }
});
test('shelves reach intended asymptotes and cuts have the expected corner response',()=>{
 near(eqDb(eqCoefficients(band(6,1)),1),6,1e-4);
 near(eqDb(eqCoefficients(band(6,4)),23999),6,1e-4);
 near(eqDb(eqCoefficients(band(0,0,Math.SQRT1_2)),1000),-3.0102999566);
 near(eqDb(eqCoefficients(band(0,5,Math.SQRT1_2)),1000),-3.0102999566);
 for(let type=0;type<6;type++)for(const f of [20,1000,20000])assert.ok(Number.isFinite(eqDb(eqCoefficients(band(-15,type,10)),f)));
});
test('logarithmic drag maps frequency/gain, Q-only movement and parameter limits',()=>{
 const g=eqGeometry(800,300),b=band();
 const moved=eqDrag(b,(g.right-g.left)/3,-(g.bottom-g.top)/6,g);
 near(moved.frequency,10000);near(moved.gain,6);
 const q=eqDrag(b,200,-50,g,true);assert.ok(q.q>1);near(q.frequency,1000);near(q.gain,0);
 const clipped=eqDrag(b,1e5,-1e5,g);near(clipped.frequency,20000);near(clipped.gain,15);
 near(eqDrag(band(3,0),20,-100,g).gain,3);
});
const mathSource=await fs.readFile(new URL('../src/eq-math.js',import.meta.url),'utf8');
const touchSource=await fs.readFile(new URL('../src/eq-touch.js',import.meta.url),'utf8');
const touch=new Function('value','width','height','event','locals','get','set','send','updateCanvas',mathSource+'\n'+touchSource);
test('native canvas touch emits captured channel/band edits, supports Q, and blocks live edits',()=>{
 const width=800,height=300,g=eqGeometry(width,height),locals={},sent=[];
 let data={channel:3,editable:true,bands:[band(),{...band(),frequency:2000},{...band(),frequency:4000},{...band(),frequency:8000}]};
 const dispatch=event=>touch(JSON.stringify(data),width,height,{pointerId:1,movementX:0,movementY:0,...event},locals,()=>1,()=>{},(...args)=>sent.push(args),()=>{});
 dispatch({type:'start',offsetX:eqX(1000,g),offsetY:eqY(0,g)});
 dispatch({type:'move',movementX:40,movementY:-20});
 assert.equal(sent[0][0],'/workspace/eq-point');assert.equal(sent[0][1],3);assert.equal(sent[0][2],1);assert.ok(sent[0][3]>1000);assert.ok(sent[0][4]>0);
 dispatch({type:'stop'});
 dispatch({type:'start',offsetX:eqX(1000,g),offsetY:eqY(0,g)});
 dispatch({type:'move',movementY:-20,shiftKey:true});near(sent[1][3],1000);near(sent[1][4],0);assert.ok(sent[1][5]>1);
 data={...data,channel:4};dispatch({type:'move',movementX:30});assert.equal(sent.length,2);
 data={...data,editable:false};dispatch({type:'start',offsetX:eqX(1000,g),offsetY:eqY(0,g)});dispatch({type:'move',movementX:30});assert.equal(sent.length,2);
});
test('held-band pinch spreads/narrows Q without moving frequency/gain and rebases after finger lift',()=>{
 const g=eqGeometry(800,300),locals={},sent=[],data={channel:5,editable:true,bands:[band(4),band(),band(),band()]};
 const x=eqX(1000,g),y=eqY(4,g);
 const dispatch=event=>touch(JSON.stringify(data),800,300,{movementX:0,movementY:0,...event},locals,()=>1,()=>{},(...args)=>sent.push(args),()=>{});
 dispatch({type:'start',pointerId:1,offsetX:x,offsetY:y,pageX:x,pageY:y});
 dispatch({type:'start',pointerId:2,offsetX:x+100,offsetY:y,pageX:x+100,pageY:y});
 dispatch({type:'move',pointerId:2,pageX:x+200,pageY:y});near(sent.at(-1)[3],1000);near(sent.at(-1)[4],4);near(sent.at(-1)[5],.5);
 dispatch({type:'move',pointerId:2,pageX:x+50,pageY:y});near(sent.at(-1)[5],2);
 dispatch({type:'stop',pointerId:2});dispatch({type:'move',pointerId:1,pageX:x,pageY:y});near(sent.at(-1)[3],1000);near(sent.at(-1)[4],4);near(sent.at(-1)[5],2);
});
test('absolute pointer position drives dragging when Safari movement deltas are zero',()=>{
 const g=eqGeometry(800,300),locals={},sent=[],data={channel:5,editable:true,bands:[band(),band(),band(),band()]};const x=eqX(1000,g),y=eqY(0,g);
 const dispatch=event=>touch(JSON.stringify(data),800,300,{pointerId:1,movementX:0,movementY:0,...event},locals,()=>1,()=>{},(...args)=>sent.push(args),()=>{});
 dispatch({type:'start',offsetX:x,offsetY:y,pageX:x,pageY:y});dispatch({type:'move',pageX:x+50,pageY:y-20});assert.ok(sent[0][3]>1000);assert.ok(sent[0][4]>0);
});
const wheelSource=await fs.readFile(new URL('../src/eq-wheel.js',import.meta.url),'utf8');
const wheel=new Function('ctx','locals','data','active','width','height',mathSource+'\n'+wheelSource);
test('wheel event adapter emits Q-only native gesture and ignores read-only/untrusted wheel events',()=>{
 const handlers={},events=[];
 class Mouse{constructor(type,options){Object.assign(this,options,{type});}}
 const doc={defaultView:{PointerEvent:Mouse},dispatchEvent:e=>events.push(e)};
 const canvas={ownerDocument:doc,getBoundingClientRect:()=>({left:100,top:50}),addEventListener:(n,f)=>handlers[n]=f,dispatchEvent:e=>events.push(e)};
 const data={channel:5,editable:true,bands:[band(),band(),band(),band()]};
 wheel({canvas},{},data,1,800,300);
 const event={isTrusted:true,deltaY:-40,deltaMode:0,buttons:0,preventDefault(){},stopPropagation(){}};
 handlers.wheel(event);assert.deepEqual(events.map(e=>e.type),['pointerdown','pointermove','pointerup']);assert.ok(events[1].clientY<events[0].clientY);assert.ok(events.every(e=>e.shiftKey));
 const n=events.length;handlers.wheel({...event,isTrusted:false});assert.equal(events.length,n);
 wheel({canvas},{},{...data,editable:false},1,800,300);handlers.wheel(event);assert.equal(events.length,n);
});

test('extra fingers do not redirect or end a held-band pinch',()=>{
 const g=eqGeometry(800,300),locals={},sent=[],data={channel:5,editable:true,bands:[band(4),band(),band(),band()]};
 const x=eqX(1000,g),y=eqY(4,g);
 const dispatch=(type,id,dx)=>touch(data,800,300,{type,pointerId:id,offsetX:x+dx,offsetY:y,pageX:x+dx,pageY:y,movementX:0,movementY:0},locals,()=>1,()=>{},(...args)=>sent.push(args),()=>{});
 dispatch('start',1,0);dispatch('start',2,100);dispatch('start',3,300);dispatch('move',3,400);dispatch('stop',3,400);assert.equal(sent.length,0);
 dispatch('move',2,200);near(sent.at(-1)[3],1000);near(sent.at(-1)[4],4);near(sent.at(-1)[5],.5);
 dispatch('stop',1,0);dispatch('move',2,200);near(sent.at(-1)[3],1000);near(sent.at(-1)[4],4);near(sent.at(-1)[5],.5);
 dispatch('stop',2,200);assert.equal(locals.drag,null);assert.equal(Object.keys(locals.points).length,0);
});
test('channel changes and lost write access cancel stale gestures before further sends',()=>{
 const g=eqGeometry(800,300),locals={},sent=[];let data={channel:5,editable:true,bands:[band(),band(),band(),band()]};
 const x=eqX(1000,g),y=eqY(0,g);
 const dispatch=(type,id,dx)=>touch(data,800,300,{type,pointerId:id,offsetX:x+dx,offsetY:y,pageX:x+dx,pageY:y,movementX:0,movementY:0},locals,()=>1,()=>{},(...args)=>sent.push(args),()=>{});
 dispatch('start',1,0);data={...data,channel:4};dispatch('start',2,100);assert.equal(locals.drag.channel,4);assert.deepEqual(Object.keys(locals.points),['2']);
 dispatch('move',1,200);assert.equal(sent.length,0);data={...data,editable:false};dispatch('move',2,200);assert.equal(locals.drag,null);assert.equal(sent.length,0);
 data={...data,editable:true};dispatch('move',2,250);assert.equal(sent.length,0);dispatch('start',3,0);dispatch('move',3,30);assert.equal(sent.length,1);assert.equal(sent[0][1],4);
});
