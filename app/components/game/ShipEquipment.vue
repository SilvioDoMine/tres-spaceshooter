<script setup lang="ts">
import { watch, onUnmounted } from 'vue';
import { Group, Mesh, BoxGeometry, CylinderGeometry, TorusGeometry, SphereGeometry,
  MeshStandardMaterial, MeshBasicMaterial, AdditiveBlending, Vector3 } from 'three';
import { useLoop } from '@tresjs/core';
import { weaponMounts } from '~/utils/combatPatterns';
import { subscribeMuzzleFlashes } from '~/utils/weaponVisuals';
import { useEquipmentStore } from '~/stores/useEquipmentStore';
import { useSkillStore } from '~/stores/SkillStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { hullPlate, hullLoft } from '~/utils/kestrelModel';
const props = defineProps<{ gameplay?: boolean; preview?: Record<string, string | number> }>();
const gear = useEquipmentStore(), skills = useSkillStore(), run = useCurrentRunStore();
const root = new Group();
const armor = new MeshStandardMaterial({ color: '#d5dee2', metalness: .38, roughness: .39 });
const dark = new MeshStandardMaterial({ color: '#202d43', metalness: .8, roughness: .28 });
const paint = new MeshStandardMaterial({color:'#17a2ad',metalness:.3,roughness:.42});
const appearance=useShipAppearance();
watch(()=>appearance.value.color,color=>paint.color.set(color),{immediate:true});
const copper = new MeshStandardMaterial({ color: '#b67848', metalness: .75, roughness: .3 });
const energy = new MeshStandardMaterial({ color: '#5ce5ff', emissive: '#20aee8', emissiveIntensity: 2, metalness: .35, roughness: .24 });
const secondary = new MeshStandardMaterial({ color: '#bc86ff', emissive: '#7638eb', emissiveIntensity: 1.6, metalness: .4, roughness: .3 });
const flashMaterial = new MeshBasicMaterial({ color: '#d5faff', transparent: true, opacity: .85, blending: AdditiveBlending, depthWrite: false });
const haloMaterial = new MeshBasicMaterial({ color: '#38baff', transparent: true, opacity: .22, blending: AdditiveBlending, depthWrite: false });
const box = new BoxGeometry(1, 1, 1), cylinder = new CylinderGeometry(1, 1, 1, 12), sphere = new SphereGeometry(1, 10, 8), torus = new TorusGeometry(1, .13, 5, 20);
const fairing=new CylinderGeometry(.72,1,1,4); fairing.rotateY(Math.PI/4);
const cannons = new Map<string, { barrel: Group; flash: Group; ttl: number; burst: boolean }>();
const animated: Group[] = [];
const item=(slot: string)=>props.preview ? props.preview[slot] || undefined : gear.equippedItem(slot as any)?.defId;
const level=(id: string)=>props.preview ? Number(props.preview[id] || 0) : props.gameplay ? skills.getSkillLevel(id) || 0 : 0;
const customGeometry: any[] = [];
function panel(parent: Group, points: number[][], bottom: number, top: number, material: any) {
  const geometry=hullPlate(points,bottom,top,Math.min(.006,(top-bottom)/3));
  customGeometry.push(geometry);const part=new Mesh(geometry,material);parent.add(part);return part;
}
function casing(parent: Group, sections: number[][], material=armor) {
  const geometry=hullLoft(sections);customGeometry.push(geometry);
  const part=new Mesh(geometry,material);parent.add(part);return part;
}
function mesh(parent: Group, geometry: any, material: any, x:number,y:number,z:number,sx:number,sy:number,sz:number) {
  const m = new Mesh(geometry, material); m.position.set(x,y,z); m.scale.set(sx,sy,sz); parent.add(m); return m;
}
function tube(parent: Group, material: any, x:number,y:number,z:number,r:number,length:number) {
  const m = mesh(parent,cylinder,material,x,y,z,r,length,r); m.rotation.x=Math.PI/2; return m;
}
function rebuild() {
  root.clear(); cannons.clear(); animated.length=0;
  customGeometry.splice(0).forEach(g=>g.dispose());
  const weapon = item('weapon');
  const ion = weapon === 'lanca-ionica';
  energy.color.set(ion?'#dab2ff':'#72e7ff'); energy.emissive.set(ion?'#984dff':'#16bafa');
  haloMaterial.color.set(ion?'#aa65ff':'#38baff');
  const layout = weaponMounts(level('front_shot'),level('back_shot'),level('diagonal_shot'));
  layout.forEach(mount => {
    const g=new Group(); g.position.set(mount.x,mount.y,mount.z); g.rotation.y=Math.atan2(-mount.dx,-mount.dz); root.add(g);
    // The tip is local origin; every shot starts here, not at the hull center.
    const barrel=new Group(); g.add(barrel);
    const auxiliary=mount.role==='diagonal';
    if(auxiliary)barrel.scale.setScalar(.43);
    casing(barrel,[[.17,.047,-.027,.030],[.26,.068,-.030,.055],[.365,.056,-.022,.055]]);
    if(ion) {
      // Split accelerator spear replaces the circular plasma barrel entirely.
      for(const side of [-1,1]) {
        const tine=casing(barrel,[[-.045,.008,-.018,.022],[-.018,.018,-.027,.032],[.18,.018,-.027,.032],[.245,.012,-.017,.023]]);
        tine.position.x=side*.065;
        tine.rotation.y=side*-.09;
        mesh(barrel,box,dark,side*.045,0,.115,.016,.041,.24);
        mesh(barrel,box,energy,side*.043,.023,.08,.009,.01,.22);
        for(let i=0;i<4;i++)mesh(barrel,box,copper,side*.076,.008,.03+i*.048,.014,.071,.012);
      }
      // Central staff connects the rear socket to the emitter between the rails.
      tube(barrel,dark,0,0,.145,.022,.29);
      tube(barrel,armor,0,0,.15,.015,.25);
      for(const z of [.065,.15,.235])mesh(barrel,torus,copper,0,0,z,.026,.026,.026);
      mesh(barrel,box,energy,0,.021,.145,.008,.006,.21);
      mesh(barrel,sphere,energy,0,0,.018,.025,.025,.036);
    } else if(weapon==='canhao-plasma') {
      tube(barrel,dark,0,0,.13,.062,.26);
      tube(barrel,energy,0,0,.018,.035,.036);
      for(let i=0;i<3;i++)mesh(barrel,torus,copper,0,0,.07+i*.055,.07,.07,.07);
      tube(barrel,armor,0,0,.011,.064,.025);
      tube(barrel,dark,0,0,-.004,.048,.009);
      tube(barrel,energy,0,0,-.009,.032,.004);
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3;
        mesh(barrel,box,armor,Math.cos(a)*.057,Math.sin(a)*.057,.12,.014,.014,.064);
        mesh(barrel,sphere,copper,Math.cos(a)*.053,Math.sin(a)*.053,.026,.004,.004,.004);
      }
    } else {
      // Recessed factory emitter: visibly simpler than the equipped plasma chamber.
      tube(barrel,armor,0,0,.10,.034,.20);
      tube(barrel,dark,0,0,.015,.025,.03);
      tube(barrel,energy,0,0,.002,.012,.006);
    }
    const scale=auxiliary?.43:1;
    const end=new Vector3(mount.x-mount.dx*.28*scale,mount.y+.035,mount.z-mount.dz*.28*scale);
    const center=mount.role==='front'&&Math.abs(mount.x)<.05;
    const anchor=new Vector3(end.x,auxiliary?.037:mount.role==='rear'?.11:-.025,
      center?-.69:end.z);
    const neck=mesh(root,fairing,armor,0,0,0,auxiliary?.05:.09,anchor.distanceTo(end),auxiliary?.06:.12);
    neck.position.copy(anchor).add(end).multiplyScalar(.5);
    neck.quaternion.setFromUnitVectors(new Vector3(0,1,0),new Vector3().subVectors(end,anchor).normalize());
    mesh(g,box,dark,0,.025*scale,.28*scale,.145*scale,.085*scale,.15*scale);
    for(const side of [-1,1])mesh(g,sphere,copper,side*.055*scale,.07*scale,.29*scale,.009*scale,.006*scale,.009*scale);
    const flash=new Group(); g.add(flash); flash.visible=false;
    mesh(flash,sphere,flashMaterial,0,0,-.05,.052,.052,.15);
    mesh(flash,sphere,haloMaterial,0,0,-.08,.14,.1,.24);
    cannons.set(mount.id,{barrel,flash,ttl:0,burst:false});
  });
  const wings=item('wings');
  for(const side of [-1,1]) {
    const p=new Group();root.add(p);
    const shape=[[.435,-.048],[.63,.098],[.655,.172],[.451,.21]].map(([x,z])=>[side*x,z]);
    panel(p,shape,.046,wings?.064:.048,wings?dark:paint);
    if(wings){
      panel(p,[[.459,-.013],[.602,.10],[.625,.161],[.475,.188]].map(([x,z])=>[side*x,z]),.064,.073,armor);
      for(let i=0;i<3;i++)mesh(p,box,wings==='asas-nebula'?secondary:energy,side*(.49+i*.044),.079,.137,.010,.004,.052);
      if(wings==='asas-falcao'){
        const fin=panel(p,[[.076,.11],[.17,.20],[.17,.26],[.075,.23]],-.009,.009,armor);
        fin.rotation.z=Math.PI/2;fin.position.x=side*.61;
      }else{
        const socket=mesh(p,torus,secondary,side*.49,.08,.21,.032,.032,.032);socket.rotation.x=Math.PI/2;
      }
    }
  }
  // Canopy glazing stays within x ±.088; sensors rest on the external shoulders.
  // Sensor pods sit outside the glazing on the existing frame shoulders.
  const cockpit=item('cockpit');
  if(!cockpit)for(const side of [-1,1])panel(root,[[side*.121,-.28],[side*.184,-.28],[side*.184,-.04],[side*.121,-.04]],.118,.125,armor);
  if(cockpit) for(const side of [-1,1]) {
    const pod=new Group();root.add(pod);pod.position.set(side*.151,.116,-.15);
    panel(pod,[[-.036,-.132],[-.022,-.155],[.027,-.145],[.036,-.10],[.036,.145],[-.036,.145]],-.006,.029,armor);
    casing(pod,[[-.145,.022,.008,.024],[-.10,.03,.008,.05],[.09,.029,.008,.045],[.135,.021,.008,.025]],dark);
    const lensMaterial=cockpit==='cockpit-mira'?energy:secondary;
    tube(pod,dark,0,.027,-.127,.029,.055);
    tube(pod,lensMaterial,0,.027,-.158,.021,.012);
    const bezel=mesh(pod,torus,copper,0,.027,-.163,.027,.027,.027);
    for(let i=0;i<5;i++)mesh(pod,box,dark,side*.035,-.008,-.08+i*.041,.008,.025,.012);
    for(const z of [-.11,.11])mesh(pod,sphere,copper,0,.049,z,.01,.005,.01);
    for(let i=0;i<7;i++)mesh(pod,box,lensMaterial,0,.049,-.075+i*.021,.012,.004,.013);
  }  const generator=item('generator');
  if(!generator)panel(root,[[-.08,.165],[-.098,.22],[-.08,.398],[.08,.398],[.098,.22],[.08,.165]],.115,.123,armor);
  if(generator) {
    const reactor=new Group(); reactor.position.set(0,.140,.30); root.add(reactor);
    mesh(reactor,cylinder,dark,0,0,0,.115,.08,.115);
    mesh(reactor,sphere,generator==='gerador-solar'?copper:energy,0,.045,0,.077,.045,.077);
    const ring=mesh(reactor,torus,generator==='gerador-solar'?copper:energy,0,.025,0,.12,.12,.12); ring.rotation.x=Math.PI/2;
    for(const side of [-1,1]) for(let i=0;i<4;i++) mesh(reactor,box,armor,side*.13,.01,-.07+i*.045,.045,.05,.018);
    animated.push(ring as unknown as Group);
  }
  const field=item('forcefield');
  for(const side of [-1,1]) {
    panel(root,[[side*.189,.08],[side*.247,.08],[side*.247,.30],[side*.189,.30]],.113,field?.136:.12,armor);
    if(field)for(let i=0;i<3;i++)mesh(root,sphere,field==='campo-prisma'?secondary:energy,side*.218,.143,.115+i*.075,.025,.016,.024);
  }
  const thrusters=item('thrusters');
  if(thrusters) for(const side of [-1,1]) {
    tube(root,armor,side*.306,.011,.52,.093,.19);
    tube(root,dark,side*.306,.011,.618,.075,.006);
    tube(root,energy,side*.306,.011,.622,.046,.006);
    const rim=mesh(root,torus,thrusters==='propulsor-cometa'?copper:secondary,side*.306,.011,.623,.087,.087,.087);
    for(let i=0;i<3;i++) mesh(root,box,dark,side*.306,.097,.46+i*.047,.11,.022,.017);
  }
}
watch(() => [props.gameplay, JSON.stringify(props.preview), ...gear.equippedItems.map(i=>`${i.defId}:${i.rarity}`),
  props.gameplay?skills.getSkillLevel('front_shot'):0,props.gameplay?skills.getSkillLevel('back_shot'):0,
  props.gameplay?skills.getSkillLevel('diagonal_shot'):0],rebuild,{immediate:true});
const unsubscribe=subscribeMuzzleFlashes(({id,burst})=>{
  if(!props.gameplay)return;
  const c=cannons.get(id); if(c){c.ttl=.14;c.burst=burst;}
});
let time=0;
useLoop().onBeforeRender(({delta})=>{
  if(props.gameplay&&!run.isPlaying)return;
  const dt=Math.min(delta,.05); time+=dt;
  cannons.forEach(c=>{
    c.ttl=Math.max(0,c.ttl-dt); const f=c.ttl/.14;
    c.barrel.position.z=Math.sin(f*Math.PI)*.045;
    c.flash.visible=f>0; c.flash.scale.setScalar((c.burst?1.8:1)*f);
  });
  energy.emissiveIntensity=1.8+Math.sin(time*3)*.25;
  secondary.emissiveIntensity=1.5+Math.sin(time*2.5)*.35;
  animated.forEach((g,i)=>g.rotation.z=time*(i%2?.22:.4));
});
onUnmounted(()=>{
  customGeometry.forEach(g=>g.dispose());
  unsubscribe(); root.clear(); [box,cylinder,sphere,torus,fairing].forEach(g=>g.dispose());
  [armor,paint,dark,copper,energy,secondary,flashMaterial,haloMaterial].forEach(m=>m.dispose());
});
</script>
<template><primitive :object="root" /></template>
