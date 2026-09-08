import fs from 'node:fs';import {stripTypeScriptTypes} from 'node:module';import {pathToFileURL} from 'node:url';
const source=fs.readFileSync('app/components/game/StreamingDebris.vue','utf8').split('<script setup lang="ts">')[1].split('</script>')[0];
const stub=`let player={x:0,y:0,z:0},tick;function useCurrentRunStore(){return {getPlayerPosition:()=>player}};function useState(){return {value:{x:0,z:0,width:20,height:23}}};function useLoop(){return {onBeforeRender:f=>tick=f}};function onUnmounted(){};`;
const file='.qa-debris.mjs';fs.writeFileSync(file,stripTypeScriptTypes(stub+source+'\nexport {bodies,tick,view,player};'));
try {const {bodies,tick,view,player}=await import(pathToFileURL(process.cwd()+'/'+file));let teleports=0;for(let step=0;step<2400;step++){
 const t=step/120;player.x=Math.sin(t)*110;player.z=Math.sin(t*.73)*95;view.value.x=player.x;view.value.z=player.z;view.value.width=step<1200?20:60;
 const before=bodies.map(m=>m.position.clone());tick({delta:1/60});
 for(let i=0;i<bodies.length;i++){
 const m=bodies[i];if(m.position.distanceTo(before[i])>8){teleports++;const depth=1-m.position.y/52;const onScreen=Math.abs(m.position.x-player.x)<view.value.width*.5*depth+3 && Math.abs(m.position.z-player.z)<view.value.height*.5*depth+3;if(onScreen)throw Error('Visible recycling at step '+step)}
 for(let j=i+1;j<bodies.length;j++)if(m.position.distanceTo(bodies[j].position)<m.userData.radius+bodies[j].userData.radius)throw Error('Overlapping rocks at '+step)
 }
}console.log(JSON.stringify({bodies:bodies.length,frames:2400,offscreenRecycles:teleports,intersections:0}));}finally{fs.unlinkSync(file)}

