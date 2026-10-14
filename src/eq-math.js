// SPDX-License-Identifier: GPL-3.0-or-later
// Independently implemented biquad model using the W3C Audio EQ Cookbook equations:
// https://www.w3.org/TR/audio-eq-cookbook/ . Not a measured X32 DSP transfer function.
function eqCoefficients(band,sampleRate=48000){
 const f=Math.max(20,Math.min(sampleRate*.499,band.frequency));
 const w=2*Math.PI*f/sampleRate,c=Math.cos(w),s=Math.sin(w);
 const A=10**(band.gain/40),alpha=s/(2*Math.max(.3,band.q));
 const base=[1+alpha,-2*c,1-alpha];
 if(band.type===0)return {b:[(1+c)/2,-(1+c),(1+c)/2],a:base};
 if(band.type===5)return {b:[(1-c)/2,1-c,(1-c)/2],a:base};
 // Shelves use a monotonic S=1 slope; X32 shelf Q/vintage behavior is unverified.
 const shelfAlpha=s/Math.sqrt(2),t=2*Math.sqrt(A)*shelfAlpha;
 if(band.type===1)return {b:[A*((A+1)-(A-1)*c+t),2*A*((A-1)-(A+1)*c),A*((A+1)-(A-1)*c-t)],a:[(A+1)+(A-1)*c+t,-2*((A-1)+(A+1)*c),(A+1)+(A-1)*c-t]};
 if(band.type===4)return {b:[A*((A+1)+(A-1)*c+t),-2*A*((A-1)+(A+1)*c),A*((A+1)+(A-1)*c-t)],a:[(A+1)-(A-1)*c+t,2*((A-1)-(A+1)*c),(A+1)-(A-1)*c-t]};
 // Vintage bell is shown using the standard peaking model until calibrated.
 return {b:[1+alpha*A,-2*c,1-alpha*A],a:[1+alpha/A,-2*c,1-alpha/A]};
}
function eqDb(coefficients,frequency,sampleRate=48000){
 const w=2*Math.PI*frequency/sampleRate;
 const magnitude=values=>{
  const real=values[0]+values[1]*Math.cos(w)+values[2]*Math.cos(2*w);
  const imaginary=-values[1]*Math.sin(w)-values[2]*Math.sin(2*w);
  return Math.max(1e-24,real*real+imaginary*imaginary);
 };
 return 10*Math.log10(magnitude(coefficients.b)/magnitude(coefficients.a));
}
function eqResponse(bands,frequency,sampleRate=48000){return bands.reduce((sum,b)=>sum+eqDb(eqCoefficients(b,sampleRate),frequency,sampleRate),0);}
function eqGeometry(width,height){return {left:48,right:width-46,top:20,bottom:height-36};}
function eqX(f,g){return g.left+Math.log(f/20)/Math.log(1000)*(g.right-g.left);}
function eqY(db,g){return g.top+(18-db)/36*(g.bottom-g.top);}
function eqDrag(band,dx,dy,g,qOnly=false){
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 if(qOnly)return {...band,q:clamp(band.q*Math.exp(-dy/(g.bottom-g.top)*4),.3,10)};
 return {...band,frequency:clamp(band.frequency*1000**(dx/(g.right-g.left)),20,20000),gain:[0,5].includes(band.type)?band.gain:clamp(band.gain-dy*36/(g.bottom-g.top),-15,15)};
}
if(typeof module!=='undefined')module.exports={eqCoefficients,eqDb,eqResponse,eqGeometry,eqX,eqY,eqDrag};
