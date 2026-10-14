// SPDX-License-Identifier: GPL-3.0-or-later
// Static transfer approximations, not the console's measured envelope or exact DSP.
function compressorOutput(input,s){
 const slope=1/Math.max(1,s.ratio),knee=Math.max(0,s.knee)*5,delta=input-s.threshold;
 let wet=input;
 if(knee && Math.abs(delta)<=knee/2)wet=input+(slope-1)*(delta+knee/2)**2/(2*knee);
 else if(delta>0)wet=s.threshold+delta*slope;
 wet+=s.gain;
 const mix=Math.max(0,Math.min(1,s.mix/100));
 return 20*Math.log10((1-mix)*10**(input/20)+mix*10**(wet/20));
}
function gateOutput(input,s){
 const mode=s.modeIndex??3,range=s.range??60;
 if(mode===4)return input>s.threshold?input-range:input;
 if(input>=s.threshold)return input;
 if(mode===3)return input-range;
 return Math.max(input-range,s.threshold+(input-s.threshold)*[2,3,4][mode]);
}
const dynamicsRatios=[1.1,1.3,1.5,2,2.5,3,4,5,7,10,20,100];
function dynamicsGeometry(width,height){return {l:48,t:60,r:width-48,b:height-52};}
function dynamicsRatioIndex(data){return data.kind==='gate'?(data.settings.modeIndex??3):Math.max(0,dynamicsRatios.indexOf(data.settings.ratio));}
function dynamicsHandles(data,g){
 const s=data.settings,x=v=>g.l+(v+90)/90*(g.r-g.l),y=v=>g.b-Math.max(0,Math.min(90,v+90))/90*(g.b-g.t);
 const output=v=>data.kind==='gate'?gateOutput(v,s):compressorOutput(v,s),threshold=s.threshold;
 const handles=[{name:'threshold',label:'TH',x:x(threshold),y:y(output(threshold)),color:'#ffbf69'}];
 if(data.kind==='comp'){const input=Math.min(-3,threshold+18);handles.push({name:'ratio',label:'R',x:x(input),y:y(output(input)),color:'#6cd9a5'},{name:'gain',label:'G',x:x(-75),y:y(-75+s.gain),color:'#db92ff'});}
 else{if((s.modeIndex??3)!==4){const input=Math.max(-85,threshold-12);handles.push({name:'ratio',label:'R',x:x(input),y:y(output(input)),color:'#6cd9a5'});}handles.push({name:'range',label:'RG',x:x(threshold),y:y(threshold-(s.range??60)),color:'#db92ff'});}
 return handles;
}

if(typeof module!=='undefined')module.exports={compressorOutput,gateOutput,dynamicsRatios,dynamicsGeometry,dynamicsRatioIndex,dynamicsHandles};
