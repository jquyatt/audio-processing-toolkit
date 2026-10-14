import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import math from '../src/dynamics-math.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('compressor transfer obeys hard-knee ratio, makeup and linear-amplitude parallel mix',()=>{
 const s={threshold:-30,ratio:3,knee:0,gain:0,mix:100};near(math.compressorOutput(-60,s),-60);near(math.compressorOutput(-30,s),-30);near(math.compressorOutput(0,s),-20);
 near(math.compressorOutput(0,{...s,gain:3}),-17);near(math.compressorOutput(0,{...s,mix:0}),0);
 near(math.compressorOutput(0,{...s,mix:50}),20*Math.log10(.55));
 for(const knee of [0,1,5])for(let input=-90;input<=0;input++)assert.ok(Number.isFinite(math.compressorOutput(input,{...s,knee})));
});
test('gate static transfer applies configured attenuation below threshold',()=>{near(math.gateOutput(-40,{threshold:-30,range:20}),-60);near(math.gateOutput(-30,{threshold:-30,range:20}),-30);near(math.gateOutput(-10,{threshold:-30,range:20}),-10);});
const draw=new Function('value','width','height','ctx','locals',(await fs.readFile(new URL('../src/dynamics-math.js',import.meta.url),'utf8'))+'\n'+(await fs.readFile(new URL('../src/dynamics-draw.js',import.meta.url),'utf8')));
test('single overlay plot uses measured input/GR at phone and desktop widths without RTA',()=>{
 const coords=[],texts=[];const ctx=new Proxy({}, {get:(o,k)=>k==='fillText'?(s,...xy)=>{texts.push(s);coords.push(...xy);}:k in o?o[k]:(...args)=>coords.push(...args.filter(x=>typeof x==='number')),set:(o,k,v)=>(o[k]=v,true)});
 for(const width of [320,1100])for(const kind of ['gate','comp']){const data={channel:5,kind,known:true,enabled:false,settings:{threshold:-30,range:60,ratio:3,knee:5,gain:3,mix:100},history:[{stamp:10000,inputDb:-20,gateReductionDb:6,compReductionDb:12}],meter:{inputDb:-20,gateReductionDb:6,compReductionDb:12}};draw(data,width,360,ctx,{});draw({...data,history:[],known:false},width,360,ctx,{});}
 assert.ok(coords.every(Number.isFinite));assert.ok(texts.includes('Signal history · 10 s'));assert.ok(texts.includes('IN -20.0 dBFS'));assert.ok(texts.includes('GR 12.0 dB'));assert.ok(!texts.some(s=>s.includes('RTA')));
});
const touch=new Function('value','width','height','event','locals','send','updateCanvas',(await fs.readFile(new URL('../src/dynamics-math.js',import.meta.url),'utf8'))+'\n'+(await fs.readFile(new URL('../src/dynamics-touch.js',import.meta.url),'utf8')));
test('touch threshold drag captures input, clips bounds and cancels when channel or permission changes',()=>{
 let data={channel:5,kind:'gate',known:true,editable:true,settings:{threshold:-40}};const locals={},sent=[];
 const event=e=>touch(data,1100,360,{pointerId:1,offsetX:200,offsetY:100,pageX:200,movementX:0,...e},locals,(...a)=>sent.push(a),()=>{});
 event({type:'start'});event({type:'move',pageX:250});assert.equal(sent[0][0],'/workspace/dynamics-threshold');assert.equal(sent[0][1],5);assert.ok(sent[0][3]>-40);event({type:'move',pageX:10000});assert.equal(sent.at(-1)[3],0);
 data={...data,channel:4};event({type:'move'});assert.equal(locals.drag,null);const n=sent.length;data={...data,editable:false};event({type:'start'});event({type:'move',pageX:300});assert.equal(sent.length,n);
});
const parameterTouch=new Function('parameter','value','width','event','locals','get','set','send',await fs.readFile(new URL('../src/parameter-touch.js',import.meta.url),'utf8'));
test('parameter sliders use absolute touch/mouse coordinates and cancel captured input on channel change',()=>{
 const locals={},sent=[],values=[];let channel=5;
 const dispatch=e=>parameterTouch('compAttack',.1,264,{pointerId:1,movementX:0,pageX:100,...e},locals,()=>channel,(id,v)=>values.push(v),(...a)=>sent.push(a));
 dispatch({type:'start'});dispatch({type:'move',pageX:124});assert.equal(sent[0][1],5);assert.equal(sent[0][2],'compAttack');assert.ok(Math.abs(sent[0][3]-.2)<1e-8);assert.equal(values[0],.2);
 channel=4;dispatch({type:'move',pageX:150});assert.equal(sent.length,1);assert.equal(locals.drag,null);
});

test('held dynamics handle pinch changes stepped ratio while preserving threshold and rebases finger lift',()=>{
 const sent=[],locals={},data={channel:5,kind:'comp',known:true,editable:true,settings:{threshold:-30,ratio:3,knee:0,gain:0,mix:100}},g=math.dynamicsGeometry(1100,360),h=math.dynamicsHandles(data,g)[0];
 const dispatch=(type,id,x,y)=>touch(data,1100,360,{type,pointerId:id,offsetX:x,offsetY:y,pageX:x,pageY:y},locals,(...a)=>sent.push(a),()=>{});
 dispatch('start',1,h.x,h.y);dispatch('start',2,h.x+80,h.y);dispatch('move',2,h.x+160,h.y);assert.deepEqual(sent.at(-1),['/workspace/dynamics-ratio',5,'comp',2]);assert.equal(locals.preview.threshold,-30);
 dispatch('start',3,h.x+300,h.y);dispatch('stop',3,h.x+300,h.y);dispatch('move',2,h.x+40,h.y);assert.equal(sent.at(-1)[3],8);dispatch('stop',2,h.x+40,h.y);dispatch('move',1,h.x,h.y);assert.equal(locals.preview.threshold,-30);assert.equal(locals.preview.ratio,7);
});
test('gate expansion mode gives finite ratios with attenuation floor; gate and duck remain distinct',()=>{
 assert.equal(math.gateOutput(-40,{threshold:-30,range:60,modeIndex:0}),-50);assert.equal(math.gateOutput(-40,{threshold:-30,range:60,modeIndex:1}),-60);assert.equal(math.gateOutput(-40,{threshold:-30,range:20,modeIndex:2}),-60);assert.equal(math.gateOutput(-20,{threshold:-30,range:20,modeIndex:4}),-40);
});
test('Gate hold/pinch follows native expansion steps and never enters Duck',()=>{
 const sent=[],locals={},data={channel:5,kind:'gate',known:true,editable:true,settings:{threshold:-40,range:30,modeIndex:3}},g=math.dynamicsGeometry(1100,360),h=math.dynamicsHandles(data,g)[0];
 const dispatch=(type,id,dx)=>touch(data,1100,360,{type,pointerId:id,offsetX:h.x+dx,offsetY:h.y,pageX:h.x+dx,pageY:h.y},locals,(...a)=>sent.push(a),()=>{});
 dispatch('start',1,0);dispatch('start',2,100);dispatch('move',2,50);assert.deepEqual(sent.at(-1),['/workspace/dynamics-ratio',5,'gate',3]);assert.equal(locals.preview.threshold,-40);assert.equal(locals.preview.range,30);
 dispatch('move',2,400);assert.equal(sent.at(-1)[3],0);
});

test('ratio handles drag down for stronger ratios and up for gentler ratios on both processors',()=>{
 for(const kind of ['comp','gate']){
  const settings=kind==='comp'?{threshold:-30,ratio:3,knee:0,gain:0,mix:100}:{threshold:-30,range:30,modeIndex:1};
  const data={channel:5,kind,known:true,editable:true,settings},g=math.dynamicsGeometry(1100,360),h=math.dynamicsHandles(data,g).find(x=>x.name==='ratio'),locals={},sent=[];
  const dispatch=(type,dy)=>touch(data,1100,360,{type,pointerId:1,offsetX:h.x,offsetY:h.y+dy,pageX:h.x,pageY:h.y+dy},locals,(...a)=>sent.push(a),()=>{});
  dispatch('start',0);dispatch('move',30);assert.equal(sent.at(-1)[0],'/workspace/dynamics-ratio');assert.ok(sent.at(-1)[3]>math.dynamicsRatioIndex(data));assert.equal(locals.preview.threshold,settings.threshold);
  dispatch('move',-30);assert.ok(sent.at(-1)[3]<math.dynamicsRatioIndex(data));assert.equal(locals.preview.threshold,settings.threshold);
 }
});

test('overlay uses full plot width and matching draw/touch geometry',()=>{for(const width of [320,736,1100]){const g=math.dynamicsGeometry(width,360);assert.equal(g.r,width-48);assert.equal(g.b,308);assert.ok(g.r-g.l>width*.65);const handles=math.dynamicsHandles({kind:'comp',settings:{threshold:-30,ratio:4,knee:0,gain:0,mix:100}},g);assert.ok(handles.every(h=>h.x>=g.l&&h.x<=g.r&&h.y>=g.t&&h.y<=g.b));}});
