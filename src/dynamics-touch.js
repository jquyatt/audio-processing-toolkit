// SPDX-License-Identifier: GPL-3.0-or-later
let data;try{data=typeof value==='string'?JSON.parse(value):value;}catch(e){return;}
const reset=()=>{locals.drag=null;locals.preview=null;locals.points={};locals.pinch=null;};
if(!data?.known||!data.editable){reset();return;}
const g=dynamicsGeometry(width,height),pointer=event.pointerId??'mouse',pos={x:event.pageX??event.offsetX,y:event.pageY??event.offsetY};
locals.points=locals.points||{};
if(locals.drag && locals.drag.channel!==data.channel){reset();return;}
if(event.type==='start'){
 if(locals.drag){
  if(Object.keys(locals.points).length>=2)return;
  locals.points[pointer]=pos;const p=Object.values(locals.points);
  if(p.length===2 && !(data.kind==='gate'&&data.settings.modeIndex===4))locals.pinch={distance:Math.max(8,Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)),index:dynamicsRatioIndex({...data,settings:locals.preview||data.settings})};return;
 }
 if(event.offsetX<g.l||event.offsetX>g.r||event.offsetY<g.t||event.offsetY>g.b)return;
 const nearest=dynamicsHandles(data,g).map(h=>({...h,d:Math.hypot(h.x-event.offsetX,h.y-event.offsetY)})).sort((a,b)=>a.d-b.d)[0];
 locals.points[pointer]=pos;locals.drag={channel:data.channel,kind:data.kind,pointer,origin:pos,dx:0,dy:0,handle:nearest.d<30?nearest.name:'threshold',base:{...data.settings}};return;
}
if(!locals.drag||!Object.hasOwn(locals.points,pointer))return;
if(event.type==='move'){
 locals.points[pointer]=pos;const keys=Object.keys(locals.points),base=locals.drag.base;
 if(locals.pinch&&keys.length===2){
  const p=Object.values(locals.points),distance=Math.max(8,Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y));
  const index=Math.max(0,Math.min(data.kind==='gate'?3:11,Math.round(locals.pinch.index-3*Math.log2(distance/locals.pinch.distance))));
  locals.preview={...(locals.preview||base),...(data.kind==='gate'?{modeIndex:index}:{ratio:dynamicsRatios[index]})};
  send('/workspace/dynamics-ratio',locals.drag.channel,data.kind,index);
 }else{
  if(locals.drag.pointer!==pointer)return;
  if(Number.isFinite(event.pageX)){locals.drag.dx=pos.x-locals.drag.origin.x;locals.drag.dy=pos.y-locals.drag.origin.y;}else{locals.drag.dx+=event.movementX||0;locals.drag.dy+=event.movementY||0;}
  locals.preview={...base};const name=locals.drag.handle;
  if(name==='threshold'){const min=data.kind==='gate'?-80:-60;locals.preview.threshold=Math.max(min,Math.min(0,base.threshold+locals.drag.dx/(g.r-g.l)*90));send('/workspace/dynamics-threshold',locals.drag.channel,data.kind,locals.preview.threshold);}
  else if(name==='ratio'){
   const index=Math.max(0,Math.min(data.kind==='gate'?3:11,Math.round(dynamicsRatioIndex({...data,settings:base})+locals.drag.dy/(g.b-g.t)*12)));
   if(data.kind==='gate')locals.preview.modeIndex=index;else locals.preview.ratio=dynamicsRatios[index];send('/workspace/dynamics-ratio',locals.drag.channel,data.kind,index);
  }else{const key=data.kind+(name==='range'?'Range':'Gain'),min=name==='range'?3:0,max=name==='range'?60:24;locals.preview[name]=Math.max(min,Math.min(max,base[name]+locals.drag.dy/(g.b-g.t)*90*(name==='gain'?-1:1)));send('/workspace/dynamics-value',locals.drag.channel,key,(locals.preview[name]-min)/(max-min));}
 }
 updateCanvas('this');
}
if(event.type==='stop'){
 delete locals.points[pointer];locals.pinch=null;const keys=Object.keys(locals.points);
 if(keys.length){const remaining=keys[0];locals.drag={...locals.drag,pointer:isNaN(Number(remaining))?remaining:Number(remaining),origin:locals.points[remaining],base:{...(locals.preview||locals.drag.base)},dx:0,dy:0};}
 else reset();updateCanvas('this');
}
