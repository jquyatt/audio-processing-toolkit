// SPDX-License-Identifier: GPL-3.0-or-later
let data;try{data=typeof value==='string'?JSON.parse(value):value;}catch(e){data=null;}
ctx.fillStyle='#101722';ctx.fillRect(0,0,width,height);
ctx.font='12px sans-serif';ctx.textBaseline='middle';ctx.fillStyle='#b9c9dc';
if(!data){ctx.fillText('Waiting for mixer settings',20,20);return;}
const transfer=dynamicsGeometry(width,height);
if(locals.drag?.channel===data.channel && locals.preview)data={...data,settings:{...data.settings,...locals.preview}};
const x=v=>transfer.l+(v+90)/90*(transfer.r-transfer.l),y=v=>transfer.b-Math.max(0,Math.min(90,v+90))/90*(transfer.b-transfer.t);
const reductionKey=data.kind==='gate'?'gateReductionDb':'compReductionDb';
const history=data.history||[],now=history.at(-1)?.stamp||Date.now();
const hx=stamp=>transfer.r-(now-stamp)/10000*(transfer.r-transfer.l);
const gy=gr=>transfer.t+Math.max(0,Math.min(60,gr))/60*(transfer.b-transfer.t);
ctx.textAlign='left';ctx.fillText(data.kind==='gate'?'Gate':'Compressor',transfer.l,14);
ctx.textAlign='right';ctx.fillStyle='#9caec5';ctx.fillText('Signal history · 10 s',transfer.r,14);
// History time and transfer input use different horizontal axes on the same plot.
for(const db of [-90,-60,-30,0]){
 const yy=y(db);ctx.strokeStyle='#28364a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(transfer.l,yy);ctx.lineTo(transfer.r,yy);ctx.stroke();ctx.fillStyle='#9caec5';ctx.textAlign='right';ctx.fillText(String(db),transfer.l-8,yy);
 const xx=x(db);ctx.beginPath();ctx.moveTo(xx,transfer.t);ctx.lineTo(xx,transfer.b);ctx.stroke();ctx.textAlign=db===-90?'left':db===0?'right':'center';ctx.fillText(String(db),xx,transfer.b+17);
}
for(const seconds of [10,5,0]){ctx.textAlign=seconds===10?'left':seconds===0?'right':'center';ctx.fillStyle='#9caec5';ctx.fillText(seconds?'-'+seconds+'s':'now',transfer.r-seconds/10*(transfer.r-transfer.l),transfer.t-13);}
ctx.textAlign='left';ctx.fillStyle='#9caec5';ctx.fillText('dBFS',4,transfer.t-13);ctx.textAlign='right';ctx.fillStyle='#ffbf69';ctx.fillText('GR',width-5,transfer.t-13);
for(const gr of [0,30,60])ctx.fillText(String(gr),width-5,gy(gr));
ctx.save();ctx.beginPath();ctx.rect(transfer.l,transfer.t,transfer.r-transfer.l,transfer.b-transfer.t);ctx.clip();
// Actual input envelope, filled subtly so controls remain legible. Break at gaps.
let run=[];const fillRun=()=>{if(!run.length)return;ctx.beginPath();ctx.moveTo(hx(run[0].stamp),transfer.b);for(const sample of run)ctx.lineTo(hx(sample.stamp),y(sample.inputDb));ctx.lineTo(hx(run.at(-1).stamp),transfer.b);ctx.closePath();ctx.fillStyle='rgba(52,211,153,0.12)';ctx.fill();run=[];};
for(const sample of history){if(!Number.isFinite(sample.stamp)||!Number.isFinite(sample.inputDb)||sample.stamp<now-10000){fillRun();continue;}if(run.length&&sample.stamp-run.at(-1).stamp>1000)fillRun();run.push(sample);}fillRun();
for(const reduction of [false,true]){
 ctx.beginPath();let started=false,previous=null;
 for(const sample of history){const v=reduction?sample[reductionKey]:sample.inputDb;if(!Number.isFinite(v)||!Number.isFinite(sample.stamp)||sample.stamp<now-10000){started=false;previous=null;continue;}const xx=hx(sample.stamp),yy=reduction?gy(v):y(v);if(started&&sample.stamp-previous<=1000)ctx.lineTo(xx,yy);else ctx.moveTo(xx,yy);started=true;previous=sample.stamp;}
 ctx.strokeStyle=reduction?'rgba(255,191,105,0.75)':'rgba(52,211,153,0.5)';ctx.lineWidth=1.5;ctx.stroke();
}
ctx.strokeStyle='#61718a';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(transfer.l,transfer.b);ctx.lineTo(transfer.r,transfer.t);ctx.stroke();ctx.setLineDash([]);
if(data.known){
 const configured=v=>data.kind==='gate'?gateOutput(v,data.settings):compressorOutput(v,data.settings);
 const curve=(output,color,dash,lineWidth)=>{ctx.beginPath();for(let i=0;i<=360;i++){const v=-90+i/4;if(i===0)ctx.moveTo(x(v),y(output(v)));else ctx.lineTo(x(v),y(output(v)));}ctx.strokeStyle=color;ctx.setLineDash(dash);ctx.lineWidth=lineWidth;ctx.stroke();ctx.setLineDash([]);};
 curve(configured,'#53b7dc',data.enabled?[]:[4,3],data.enabled?3:2);
 if(!data.enabled)curve(v=>v,'#8391a5',[],2);
 const t=data.settings.threshold;ctx.strokeStyle='rgba(255,191,105,0.5)';ctx.setLineDash([4,3]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x(t),transfer.t);ctx.lineTo(x(t),transfer.b);ctx.stroke();ctx.beginPath();ctx.moveTo(transfer.l,y(t));ctx.lineTo(transfer.r,y(t));ctx.stroke();ctx.setLineDash([]);
 const input=data.meter?.inputDb;
 if(Number.isFinite(input)){const xx=x(Math.max(-90,Math.min(0,input))),yy=y(data.enabled?configured(input):input);ctx.beginPath();ctx.arc(xx,yy,4,0,2*Math.PI);ctx.fillStyle='#34d399';ctx.fill();}
}
ctx.restore();
// Labels and hit handles sit above the traces; drawing never changes hit geometry.
ctx.font='12px sans-serif';ctx.textAlign='left';ctx.fillStyle='#53b7dc';ctx.fillText('Curve input · dBFS',transfer.l,transfer.b+35);
ctx.textAlign='right';ctx.fillStyle='#34d399';ctx.fillText('Input',transfer.r-38,35);ctx.fillStyle='#ffbf69';ctx.fillText('GR',transfer.r,35);
if(data.known){
 const ratio=data.kind==='gate'?['2:1','3:1','4:1','Gate','Duck'][data.settings.modeIndex??3]:data.settings.ratio+':1';
 ctx.textAlign='left';ctx.fillStyle='#b9c9dc';ctx.fillText(width<450?ratio:(data.enabled?'':'BYPASS · ')+ratio+' · TH '+data.settings.threshold.toFixed(1)+' dB',transfer.l,35);
 for(const h of dynamicsHandles(data,transfer)){ctx.beginPath();ctx.arc(h.x,h.y,10,0,Math.PI*2);ctx.fillStyle=h.color;ctx.fill();ctx.strokeStyle='#101722';ctx.lineWidth=2;ctx.stroke();ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#101722';ctx.fillText(h.label,h.x,h.y);}
}else{ctx.font='12px sans-serif';ctx.fillStyle='#9caec5';ctx.textAlign='center';ctx.fillText('Waiting for complete settings',(transfer.l+transfer.r)/2,(transfer.t+transfer.b)/2);}
ctx.font='12px sans-serif';ctx.textAlign='right';const input=data.meter?.inputDb,gr=data.meter?.[reductionKey];ctx.fillStyle='#34d399';ctx.fillText(Number.isFinite(input)?'IN '+input.toFixed(1)+' dBFS':'Meters · waiting',transfer.r,transfer.b+35);
if(width>=500){ctx.fillStyle='#ffbf69';ctx.textAlign='center';ctx.fillText(Number.isFinite(gr)?'GR '+gr.toFixed(1)+' dB':'GR unavailable',(transfer.l+transfer.r)/2,transfer.b+35);}
if(!history.length){ctx.fillStyle='#9caec5';ctx.textAlign='center';ctx.fillText('Waiting for live meter history',(transfer.l+transfer.r)/2,transfer.b-16);}
