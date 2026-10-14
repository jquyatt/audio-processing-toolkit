// SPDX-License-Identifier: GPL-3.0-or-later
const channel=Number(get('selected')),pointer=event.pointerId??'mouse';
if(locals.drag && locals.drag.channel!==channel){locals.drag=null;return;}
if(event.type==='start'){
 if(locals.drag)return;locals.drag={channel,pointer,x:event.pageX??event.offsetX,value:Number(value),dx:0};return;
}
if(!locals.drag||locals.drag.pointer!==pointer)return;
if(event.type==='move'){
 if(Number.isFinite(event.pageX))locals.drag.dx=event.pageX-locals.drag.x;else locals.drag.dx+=event.movementX||0;
 const next=Math.max(0,Math.min(1,locals.drag.value+locals.drag.dx/Math.max(1,width-24)));
 set('this',next,{send:false});send('/workspace/dynamics-value',locals.drag.channel,parameter,next);
}
if(event.type==='stop')locals.drag=null;
