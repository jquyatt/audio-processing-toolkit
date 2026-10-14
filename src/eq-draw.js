// SPDX-License-Identifier: GPL-3.0-or-later
// Native Open Stage Control canvas onDraw script. Math functions are prepended by generator.
let data;
try{data=typeof value==='string'?JSON.parse(value):value;}catch(e){data=null;}
ctx.fillStyle='#101722';ctx.fillRect(0,0,width,height);
if(!data || !data.bands){ctx.fillStyle='#aab9cd';ctx.fillText('Waiting for EQ state',20,30);return;}
const g=eqGeometry(width,height),colors=['#ffbf69','#6cd9a5','#63b5ff','#db92ff'];
const active=Number(get('eq_selected_band')||1);
const bands=data.bands.map(b=>({...b}));
if(locals.drag && locals.drag.channel===data.channel && locals.preview)bands[locals.drag.band-1]=locals.preview;
ctx.font='12px sans-serif';ctx.textBaseline='middle';
for(const f of [20,50,100,200,500,1000,2000,5000,10000,20000]){
 const x=eqX(f,g);ctx.beginPath();ctx.moveTo(x,g.top);ctx.lineTo(x,g.bottom);ctx.strokeStyle='#28364a';ctx.lineWidth=1;ctx.stroke();
 ctx.fillStyle='#9caec5';ctx.textAlign='center';ctx.fillText(f>=1000?(f/1000)+'k':String(f),x,g.bottom+20);
}
for(const db of [-18,-12,-6,0,6,12,18]){
 const y=eqY(db,g);ctx.beginPath();ctx.moveTo(g.left,y);ctx.lineTo(g.right,y);ctx.strokeStyle=db===0?'#61718a':'#28364a';ctx.stroke();
 ctx.fillStyle='#9caec5';ctx.textAlign='right';ctx.fillText((db>0?'+':'')+db,g.left-8,y);
}
ctx.save();ctx.beginPath();ctx.rect(g.left,g.top,g.right-g.left,g.bottom-g.top);ctx.clip();
// Actual meter-15 spectrum, with its own dBFS scale (EQ gain uses the left axis).
if(get('rta_visible') && data.rta?.available && data.rta.bins?.length===100){
 if(locals.rtaSource!==data.rta.source){locals.rtaSource=data.rta.source;locals.spectrum=null;}
 if(locals.rtaStamp!==data.rta.stamp){
  locals.rtaStamp=data.rta.stamp;
  locals.spectrum=data.rta.bins.map((v,i)=>locals.spectrum?.[i]===undefined?v:locals.spectrum[i]*.6+v*.4);
 }
 const floor=-90,yRta=db=>g.top+Math.min(1,Math.max(0,-db/-floor))*(g.bottom-g.top);
 ctx.beginPath();ctx.moveTo(g.left,g.bottom);
 for(let i=0;i<100;i++)ctx.lineTo(eqX(data.rta.frequencies[i],g),yRta(locals.spectrum[i]));
 ctx.lineTo(eqX(data.rta.frequencies[99],g),g.bottom);ctx.closePath();ctx.fillStyle='rgba(145,190,215,.25)';ctx.fill();
 ctx.beginPath();for(let i=0;i<100;i++){const x=eqX(data.rta.frequencies[i],g),y=yRta(locals.spectrum[i]);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
 ctx.strokeStyle='rgba(183,220,240,.65)';ctx.lineWidth=1;ctx.stroke();
}else{locals.spectrum=null;locals.rtaStamp=null;}
const drawCurve=(response,color,lineWidth,dash=[])=>{
 ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;
 const steps=Math.min(600,Math.max(200,Math.round(g.right-g.left)));
 for(let i=0;i<=steps;i++){
  const f=20*1000**(i/steps),x=eqX(f,g),y=eqY(response(f),g);
  if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
 ctx.stroke();ctx.setLineDash([]);
};
for(let i=0;i<4;i++)if(bands[i].known){const coeff=eqCoefficients(bands[i],data.sampleRate);drawCurve(f=>eqDb(coeff,f,data.sampleRate),colors[i],i+1===active?2:1,[5,4]);}
const combined=bands.map(b=>b.known?eqCoefficients(b,data.sampleRate):null);
if(data.known)drawCurve(f=>data.enabled?combined.reduce((sum,c)=>sum+eqDb(c,f,data.sampleRate),0):0,data.enabled?'#f3f7fc':'#8391a5',2.6);
ctx.restore();
for(const i of [0,1,2,3].filter(i=>i+1!==active).concat(active-1)){
 const b=bands[i];if(!b.known)continue;
 const x=eqX(b.frequency,g),y=eqY([0,5].includes(b.type)?0:b.gain,g);
 ctx.beginPath();ctx.arc(x,y,i+1===active?12:9,0,2*Math.PI);ctx.fillStyle=colors[i];ctx.fill();ctx.strokeStyle='#101722';ctx.lineWidth=2;ctx.stroke();
 ctx.font='bold 12px sans-serif';ctx.fillStyle='#101722';ctx.textAlign='center';ctx.fillText(String(i+1),x,y);
}
ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillStyle='#9caec5';
for(const db of [0,-30,-60,-90])ctx.fillText(String(db),g.right+7,g.top+(-db/90)*(g.bottom-g.top));
ctx.fillText('dBFS',g.right+4,g.top-12);
ctx.font='12px sans-serif';ctx.textAlign='left';ctx.fillStyle='#b9c9dc';
const b=bands[active-1];
ctx.fillText(b?.known?`Band ${active}  ${Math.round(b.frequency)} Hz  ${b.gain.toFixed(1)} dB  Q ${b.q.toFixed(2)}${data.enabled?'':'  · BYPASSED'}`:'Some band settings are unavailable',g.left,8);
