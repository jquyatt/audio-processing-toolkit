// SPDX-License-Identifier: GPL-3.0-or-later
// Open Stage Control custom module. No sockets, mixer or equipment commands.
const state=loadJSON('initial-state.json');let timer;
const roots={eq:'/audio-processing/demo_eq',gate:'/audio-processing/demo_gate',comp:'/audio-processing/demo_comp'};
function publish(){for(const [key,value]of Object.entries(state))receive(roots[key]+'/state',JSON.stringify(value));}
function tick(){const stamp=Date.now(),inputDb=-42+25*Math.abs(Math.sin(stamp/1100));
 for(const key of ['gate','comp']){const d=state[key],s=d.settings;const gr=key==='comp'?Math.max(0,(inputDb-s.threshold)*(1-1/s.ratio)):(s.modeIndex===3?(inputDb<s.threshold?s.range:0):Math.min(s.range,Math.max(0,(s.threshold-inputDb)*([2,3,4][s.modeIndex]-1))));d.meter={inputDb,gateReductionDb:key==='gate'?gr:0,compReductionDb:key==='comp'?gr:0};d.history.push({...d.meter,stamp});d.history=d.history.filter(v=>v.stamp>=stamp-10000);}
 const frequencies=Array.from({length:100},(_,i)=>20*1000**(i/99));state.eq.rta={available:true,source:0,stamp,frequencies,bins:frequencies.map((f,i)=>-65+18*Math.sin(i/12+stamp/4000))};publish();}
function stop(){clearInterval(timer);}function start(){stop();publish();timer=setInterval(tick,100);}
module.exports={init:start,reload:start,unload:stop,stop,oscOutFilter(data){const {address,args}=data;const v=args.map(a=>a.value);
 if(address===roots.eq+'/point'){const [channel,band,frequency,gain,q]=v;if(channel===1&&Number.isInteger(band)&&band>=1&&band<=4&&[frequency,gain,q].every(Number.isFinite))Object.assign(state.eq.bands[band-1],{frequency,gain,q});}
 for(const kind of ['gate','comp']){const d=state[kind],s=d.settings;if(v[0]!==1)continue;if(address===roots[kind]+'/threshold'&&v[1]===kind&&Number.isFinite(v[2]))s.threshold=Math.max(kind==='gate'?-80:-60,Math.min(0,v[2]));if(address===roots[kind]+'/ratio'&&v[1]===kind&&Number.isInteger(v[2])){if(kind==='gate')s.modeIndex=Math.max(0,Math.min(3,v[2]));else s.ratio=[1.1,1.3,1.5,2,2.5,3,4,5,7,10,20,100][Math.max(0,Math.min(11,v[2]))];}if(address===roots[kind]+'/value'&&Number.isFinite(v[2])){const normalized=Math.max(0,Math.min(1,v[2]));if(v[1]==='gateRange')s.range=3+normalized*57;else if(v[1]==='compGain')s.gain=normalized*24;}}
 publish();return; // Consume everything: the demo can never forward to equipment.
}};
