// SPDX-License-Identifier: GPL-3.0-or-later
import fs from 'node:fs';
const source=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const sources=Object.fromEntries(['eq-math.js','eq-draw.js','eq-touch.js','eq-wheel.js','dynamics-math.js','dynamics-draw.js','dynamics-touch.js'].map(n=>[n,source(n)]));
function binding(id,namespace){
 if(!/^[a-zA-Z][\w-]{0,63}$/.test(id||''))throw Error('Provide a unique id starting with a letter');
 namespace??='/audio-processing/'+id;
 if(!/^\/(?:[\w-]+\/)*[\w-]+$/.test(namespace))throw Error('Namespace must be an absolute OSC path without a trailing slash');
 return namespace;
}
function colorize(script,theme={}){
 const colors={background:'#101722',grid:'#28364a',text:'#b9c9dc',muted:'#9caec5',curve:'#53b7dc',threshold:'#ffbf69',ratio:'#6cd9a5',secondary:'#db92ff',combined:'#f3f7fc'};
 for(const key of Object.keys(theme))if(!Object.hasOwn(colors,key)||!/^#[\da-f]{6}$/i.test(theme[key]))throw Error('Invalid theme color: '+key);
 return script.replace(/#[\da-f]{6}/gi,c=>{const key=Object.keys(colors).find(k=>colors[k]===c);return key&&theme[key]?theme[key]:c;});
}
/** Return an importable panel. Feed JSON to `${namespace}/state`. */
export function createEq({id,namespace,height=360,state=null,theme}={}){
 namespace=binding(id,namespace);const selected=id+'_selected_band',rta=id+'_rta_visible';
 const bind=s=>s.replaceAll('eq_selected_band',selected).replaceAll('rta_visible',rta).replaceAll('/workspace/eq-point',namespace+'/point');
 return {type:'panel',id,layout:'vertical',widgets:[
  {type:'variable',id:selected,value:1,bypass:true},
  {type:'canvas',id:id+'_graph',height,address:namespace+'/state',value:JSON.stringify(state),valueLength:1,bypass:true,interaction:true,onDraw:colorize(bind(sources['eq-math.js']+'\n'+sources['eq-draw.js']+'\n'+sources['eq-wheel.js']),theme),onTouch:bind(sources['eq-math.js']+'\n'+sources['eq-touch.js'])},
  {type:'panel',height:64,layout:'horizontal',widgets:[{type:'dropdown',id:id+'_band',height:44,label:'%key',value:'@{'+selected+'}',values:{'Band 1':1,'Band 2':2,'Band 3':3,'Band 4':4},onValue:`set('${selected}', value, {send:false}); updateCanvas('${id}_graph');`,bypass:true,expand:true},{type:'button',id:rta,height:44,label:'RTA',mode:'toggle',value:1,bypass:true,onValue:`updateCanvas('${id}_graph');`,width:100}]}
 ]};
}
/** X32-style stepped ratio semantics; see BINDINGS.md for adapter requirements. */
export function createDynamics({id,namespace,kind='comp',height=360,state=null,theme}={}){
 namespace=binding(id,namespace);if(!['comp','gate'].includes(kind))throw Error('kind must be comp or gate');
 if(state&&state.kind!==kind)throw Error('State kind must match widget kind');
 const touch=sources['dynamics-math.js']+'\n'+sources['dynamics-touch.js'].replaceAll('/workspace/dynamics-threshold',namespace+'/threshold').replaceAll('/workspace/dynamics-ratio',namespace+'/ratio').replaceAll('/workspace/dynamics-value',namespace+'/value');
 return {type:'canvas',id,height,address:namespace+'/state',value:JSON.stringify(state),valueLength:1,bypass:true,interaction:true,onDraw:colorize(sources['dynamics-math.js']+'\n'+sources['dynamics-draw.js'],theme),onTouch:touch};
}
