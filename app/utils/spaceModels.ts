import { Group, Mesh, MeshStandardMaterial, BufferGeometry, Shape, ExtrudeGeometry, BoxGeometry, CylinderGeometry, TorusGeometry, Matrix4, Quaternion, Euler, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Bake small manufactured details into one mesh per finish, rather than one draw per panel.
export function builder(colors: string[]) {
  const bins: BufferGeometry[][] = colors.map(() => [])
  const materials = colors.map((color, i) => new MeshStandardMaterial({ color, metalness: i === 2 ? .65 : .35, roughness: i === 2 ? .24 : .58, ...(i === 4 ? { emissive: color, emissiveIntensity: 1.4 } : {}) }))
  function add(geo: BufferGeometry, finish: number, pos = [0,0,0], rot = [0,0,0]) {
    const g = geo.index ? geo.toNonIndexed() : geo
    if (g !== geo) geo.dispose()
    g.deleteAttribute('uv')
    g.applyMatrix4(new Matrix4().compose(new Vector3(pos[0],pos[1],pos[2]), new Quaternion().setFromEuler(new Euler(rot[0],rot[1],rot[2])), new Vector3(1,1,1)))
    bins[finish].push(g)
  }
  const box = (w:number,h:number,d:number, f:number,p:number[],r=[0,0,0]) => add(new BoxGeometry(w,h,d),f,p,r)
  function plate(points:number[][], depth:number, f:number, pos=[0,0,0], bevel=.025) {
    const shape = new Shape(); points.forEach(([x,z],i)=>i ? shape.lineTo(x,-z) : shape.moveTo(x,-z)); shape.closePath()
    const g = new ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:1})
    g.rotateX(-Math.PI/2); add(g,f,pos)
  }
  function finish(name:string) {
    const root = new Group();root.name=name
    bins.forEach((parts,i)=>{if(!parts.length){materials[i].dispose();return}const geo=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());root.add(new Mesh(geo,materials[i]))})
    return root
  }
  return {add,box,plate,finish}
}

export function buildStation() {
  const b=builder(['#92a8b8','#293d51','#466d86','#bd8646','#69ceda'])
  // Preserve the original open ring, six spokes, hub and paired solar arrays.
  b.add(new CylinderGeometry(1.25,1.6,2.5,12),0,[0,0,0],[Math.PI/2,0,0])
  for(const z of [-1.1,0,1.1])b.add(new TorusGeometry(1.4,.07,6,32),2,[0,0,z])
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6
    for(const z of [-.7,0,.7])b.box(.17,.24,.22,4,[Math.cos(a)*1.42,Math.sin(a)*1.42,z],[0,0,a])
    b.box(.22,.07,1.95,1,[Math.cos(a)*1.49,Math.sin(a)*1.49,0],[0,0,a])
  }
  b.add(new CylinderGeometry(.75,1.1,.3,16),2,[0,0,1.4],[Math.PI/2,0,0])
  b.add(new CylinderGeometry(.03,.07,1.7,8),0,[0,0,2.25],[Math.PI/2,0,0])
  for(let i=1;i<=6;i++){
    const a=i*.85
    const at=(r:number,side=0,z=0)=>[Math.cos(a)*r-Math.sin(a)*side,Math.sin(a)*r+Math.cos(a)*side,z]
    const rot=[0,0,a]
    b.box(7,.18,.28,1,at(4.5),rot)
    for(const side of [-1,1]) {
      b.box(6.5,.06,.09,0,at(4.5,side*.22,.13),rot)
      for(let k=0;k<10;k++)b.box(.5,.04,.08,2,at(1.7+k*.64,0,.19),[0,0,a+(k%2?.7:-.7)])
      b.box(3.2,2,.12,0,at(5,side*1.4),rot)
      b.box(3.05,1.85,.05,1,at(5,side*1.4,.085),rot)
      // Cells on both faces remain readable from the original side view.
      for(let u=0;u<7;u++)for(let v=0;v<4;v++)for(const face of [-1,1])b.box(.38,.4,.025,2,at(3.7+u*.43,side*1.4-.66+v*.44,face*.12),rot)
      for(let u=0;u<7;u++)b.box(.025,1.86,.03,0,at(3.53+u*.46,side*1.4,.13),rot)
    }
    b.box(1.1,1.6,.9,0,at(8.7),rot)
    for(const face of [-1,1]){
      b.box(.78,1.3,.045,1,at(8.7,0,face*.48),rot)
      b.box(.57,.88,.025,2,at(8.7,0,face*.515),rot)
      for(let k=0;k<4;k++)b.box(.1,.08,.025,4,at(8.43+k*.18,.52,face*.51),rot)
    }
    b.box(.18,1.65,.94,3,at(8.35),rot)
  }
  b.add(new TorusGeometry(9,.38,10,96,Math.PI*1.7),0)
  for(const side of [-1,1])b.add(new TorusGeometry(9,.045,6,96,Math.PI*1.7),2,[0,0,side*.38])
  for(let i=0;i<38;i++){
    const a=i*(Math.PI*1.7)/38
    b.add(new TorusGeometry(.39,.04,5,12),1,[Math.cos(a)*9,Math.sin(a)*9,0],[Math.PI/2,a,0])
    for(const face of [-1,1])b.box(.28,.12,.04,i%4===0?3:4,[Math.cos(a)*9,Math.sin(a)*9,face*.4],[0,0,a])
  }
  return b.finish('Estação orbital — anel aberto original detalhado')
}

export function buildRaider(seed:number) {
  const colors=['#a83d49','#b56c28','#6e4ba0','#336b87']
  const b=builder([colors[seed%4],'#162737','#8199a8','#c18a42','#ff9856'])
  const width=.67+(seed%3)*.055
  // Closed bevelled profiles form a continuous fuselage and swept wings.
  b.plate([[0,-.85],[.2,-.56],[.31,.06],[.24,.56],[-.24,.56],[-.31,.06],[-.2,-.56]],.18,0,[0,-.07,0])
  b.plate([[0,-.68],[.115,-.45],[.14,-.09],[-.14,-.09],[-.115,-.45]],.075,2,[0,.14,0],.015)
  b.plate([[0,-.61],[.082,-.43],[.1,-.16],[-.1,-.16],[-.082,-.43]],.025,1,[0,.225,0],.012)
  for(const s of [-1,1]) {
    const poly=[[s*.19,-.2],[s*width,-.06],[s*(width+.05),.4],[s*.2,.3]]
    b.plate(poly,.06,0,[0,-.03,0],.018)
    b.plate([[s*.29,-.1],[s*(width-.07),.045],[s*(width-.04),.28],[s*.3,.21]],.025,2,[0,.06,0],.009)
    b.box(.028,.02,.27,3,[s*(width-.03),.105,.14])
    b.plate([[s*.15,-.03],[s*.25,.08],[s*.2,.43],[s*.12,.39]],.08,0,[0,.14,0],.013)
    for(let j=0;j<5;j++)b.box(.085,.018,.023,1,[s*.185,.245,.11+j*.048])
    b.add(new CylinderGeometry(.09,.12,.48,12),1,[s*.28,.015,.42],[Math.PI/2,0,0])
    b.add(new TorusGeometry(.092,.024,6,16),2,[s*.28,.015,.67])
    b.add(new CylinderGeometry(.068,.07,.035,12),4,[s*.28,.015,.675],[Math.PI/2,0,0])
    b.box(.08,.065,.34,1,[s*width,.035,-.03])
    b.add(new CylinderGeometry(.025,.036,.23,8),2,[s*width,.035,-.28],[Math.PI/2,0,0])
    b.add(new TorusGeometry(.029,.01,4,8),3,[s*width,.035,-.4])
    b.box(.045,.025,.07,4,[s*(width-.08),.12,.28])
    for(let j=0;j<3;j++)b.box(.018,.015,.05,3,[s*.27,.16,-.1-j*.11])
  }
  b.plate([[-.04,.1],[.04,.1],[.06,.51],[-.06,.51]],.14,0,[0,.13,0],.01)
  return b.finish('Interceptor — casco integrado')
}

export function disposeModel(root:Group) { root.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}}) }
