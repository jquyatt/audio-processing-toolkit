// SPDX-License-Identifier: GPL-3.0-or-later
// DOM event adapter: a genuine wheel input becomes the native Q-only drag gesture.
// It uses public DOM events; all commands still pass the bridge's channel/parameter checks.
const wheelCanvas=ctx.canvas;
if(wheelCanvas){
 wheelCanvas.eqWheelState={data,active,width,height};
 if(!wheelCanvas.eqWheelInstalled){
  wheelCanvas.eqWheelInstalled=true;
  wheelCanvas.addEventListener('wheel',function(e){
   const state=wheelCanvas.eqWheelState;
   if(!e.isTrusted || !state?.data?.editable || !e.deltaY || e.buttons)return;
   const b=state.data.bands[state.active-1];if(!b?.known)return;
   e.preventDefault();e.stopPropagation();
   const g=eqGeometry(state.width,state.height),rect=wheelCanvas.getBoundingClientRect();
   const x=rect.left+eqX(b.frequency,g),y=rect.top+eqY([0,5].includes(b.type)?0:b.gain,g);
   const delta=Math.max(-96,Math.min(96,e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?state.height:1)));
   const dy=delta*(g.bottom-g.top)*.002/4;
   const win=wheelCanvas.ownerDocument.defaultView,doc=wheelCanvas.ownerDocument;
   const event=(type,clientY,buttons)=>new win.PointerEvent(type,{bubbles:true,cancelable:true,view:win,pointerId:2147483000,pointerType:'mouse',isPrimary:true,button:0,buttons,clientX:x,clientY,shiftKey:true});
   wheelCanvas.dispatchEvent(event('pointerdown',y,1));
   doc.dispatchEvent(event('pointermove',y+dy,1));
   doc.dispatchEvent(event('pointerup',y+dy,0));
  },{passive:false});
 }
}
