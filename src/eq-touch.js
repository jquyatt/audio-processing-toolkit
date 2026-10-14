// SPDX-License-Identifier: GPL-3.0-or-later
// Native canvas touch handler; supports a held band plus a second-finger Q pinch.
let data;try{data=typeof value==='string'?JSON.parse(value):value;}catch(e){return;}
if(!data?.bands){locals.drag=null;locals.preview=null;locals.pinch=null;locals.points={};return;}
const g=eqGeometry(width,height),pointer=event.pointerId??'mouse';
const position={x:Number.isFinite(event.pageX)?event.pageX:event.offsetX,y:Number.isFinite(event.pageY)?event.pageY:event.offsetY};
locals.points=locals.points||{};
const reset=()=>{locals.drag=null;locals.preview=null;locals.pinch=null;locals.points={};updateCanvas('this');};
if(locals.drag && (locals.drag.channel!==data.channel || !data.editable)){reset();if(event.type!=='start')return;}
if(event.type==='start'){
 // Two fingers define one pinch. Ignore extra contacts until this gesture ends.
 if(Object.keys(locals.points).length>=2 && !Object.hasOwn(locals.points,pointer))return;
 locals.points[pointer]=position;
 if(locals.drag && locals.drag.channel===data.channel){
  const keys=Object.keys(locals.points);
  if(keys.length===2){const a=locals.points[keys[0]],b=locals.points[keys[1]],distance=Math.hypot(a.x-b.x,a.y-b.y);locals.pinch={distance:Math.max(8,distance),base:{...(locals.preview||locals.drag.base)}};}
  return;
 }
 let best=Infinity,pick=Number(get('eq_selected_band')||1);
 data.bands.forEach((b,i)=>{if(!b.known)return;const d=Math.hypot(eqX(b.frequency,g)-event.offsetX,eqY([0,5].includes(b.type)?0:b.gain,g)-event.offsetY);if(d<best){best=d;pick=i+1;}});
 set('eq_selected_band',pick,{send:false});
 locals.drag={channel:data.channel,band:pick,pointer,dx:0,dy:0,pageX:position.x,pageY:position.y,base:{...data.bands[pick-1]}};
 locals.preview=null;locals.pinch=null;updateCanvas('this');return;
}
if(!locals.drag || !Object.hasOwn(locals.points,pointer))return;
if(event.type==='move' && data.editable && locals.drag.base.known){
 if(locals.points[pointer])locals.points[pointer]=position;
 const keys=Object.keys(locals.points);
 if(locals.pinch && keys.length>=2){
  const a=locals.points[keys[0]],b=locals.points[keys[1]],distance=Math.max(8,Math.hypot(a.x-b.x,a.y-b.y));
  locals.preview={...locals.pinch.base,q:Math.max(.3,Math.min(10,locals.pinch.base.q*locals.pinch.distance/distance))};
 }else{
  if(locals.drag.pointer!==pointer)return;
  if(Number.isFinite(event.pageX)&&Number.isFinite(event.pageY)){locals.drag.dx=position.x-locals.drag.pageX;locals.drag.dy=position.y-locals.drag.pageY;}
  else{locals.drag.dx+=event.movementX;locals.drag.dy+=event.movementY;}
  locals.preview=eqDrag(locals.drag.base,locals.drag.dx,locals.drag.dy,g,event.shiftKey||event.altKey);
 }
 send('/workspace/eq-point',locals.drag.channel,locals.drag.band,locals.preview.frequency,locals.preview.gain,locals.preview.q);
 updateCanvas('this');
}
if(event.type==='stop'){
 delete locals.points[pointer];locals.pinch=null;
 const keys=Object.keys(locals.points);
 if(keys.length){const remaining=keys[0],p=locals.points[remaining];locals.drag={...locals.drag,pointer:isNaN(Number(remaining))?remaining:Number(remaining),base:{...(locals.preview||locals.drag.base)},pageX:p.x,pageY:p.y,dx:0,dy:0};}
 else{locals.drag=null;locals.preview=null;}
 updateCanvas('this');
}
