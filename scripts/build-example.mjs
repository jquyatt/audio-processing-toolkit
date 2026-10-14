// SPDX-License-Identifier: GPL-3.0-or-later
import fs from 'node:fs/promises';
import {createEq,createDynamics} from '../src/widgets.mjs';
const eq={channel:1,known:true,editable:true,enabled:true,sampleRate:48000,bands:[{type:2,frequency:150,gain:-3,q:1},{type:2,frequency:600,gain:2,q:2},{type:2,frequency:2500,gain:-4,q:3},{type:2,frequency:8000,gain:2,q:1}].map(b=>({...b,known:true}))};
const gate={channel:1,kind:'gate',known:true,editable:true,enabled:true,settings:{threshold:-38,range:30,modeIndex:1},history:[]};
const comp={channel:1,kind:'comp',known:true,editable:true,enabled:true,settings:{threshold:-24,ratio:4,knee:2,gain:3,mix:100},history:[]};
const session={version:'1.31.1',type:'session',content:{type:'root',id:'root',layout:'vertical',colorBg:'#121923',colorWidget:'#53b7dc',widgets:[{type:'text',value:'AUDIO PROCESSING TOOLKIT · SIMULATOR',height:40,bypass:true},{type:'panel',id:'pages',expand:true,tabs:[{type:'tab',label:'EQ',layout:'vertical',widgets:[createEq({id:'demo_eq',state:eq})]},{type:'tab',label:'Gate',layout:'vertical',widgets:[createDynamics({id:'demo_gate',kind:'gate',state:gate})]},{type:'tab',label:'Compressor',layout:'vertical',widgets:[createDynamics({id:'demo_comp',state:comp})]}]}]}};
await fs.writeFile(new URL('../examples/session.json',import.meta.url),JSON.stringify(session,null,2)+'\n');
await fs.writeFile(new URL('../examples/initial-state.json',import.meta.url),JSON.stringify({eq,gate,comp},null,2)+'\n');
