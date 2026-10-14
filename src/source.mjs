// SPDX-License-Identifier: GPL-3.0-or-later
// Public source access for hosts composing native Canvas scripts into larger sessions.
import fs from 'node:fs';
const names=new Set(['eq-math','eq-draw','eq-touch','eq-wheel','dynamics-math','dynamics-draw','dynamics-touch','parameter-touch']);
export function readScript(name){if(!names.has(name))throw Error('Unknown processing script');return fs.readFileSync(new URL('./'+name+'.js',import.meta.url),'utf8');}
