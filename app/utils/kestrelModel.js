import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial,
  BoxGeometry, CylinderGeometry, TorusGeometry, Matrix4, Quaternion, Euler, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Model space: nose -Z, dorsal +Y. Dimensions match existing weapon/engine sockets.
// Convex, closed, bevelled plates with flat normals: no intersecting placeholder boxes.
export function hullPlate(outline, bottom, top, bevel = .008) {
  const cx = outline.reduce((n,p)=>n+p[0],0)/outline.length;
  const cz = outline.reduce((n,p)=>n+p[1],0)/outline.length;
  const inset = outline.map(([x,z])=>{
    const length=Math.hypot(x-cx,z-cz);
    const f=Math.max(.65,1-bevel/length);
    return [cx+(x-cx)*f,cz+(z-cz)*f];
  });
  const bevelHeight=Math.min(bevel,(top-bottom)*.48);
  const layers=[inset.map(([x,z])=>[x,bottom,z]),outline.map(([x,z])=>[x,bottom+bevelHeight,z]),
    outline.map(([x,z])=>[x,top-bevelHeight,z]),inset.map(([x,z])=>[x,top,z])];
  const vertices=[];
  const center=new Vector3(cx,(bottom+top)/2,cz);
  const tri=(a,b,c)=>{
    const va=new Vector3(...a),vb=new Vector3(...b),vc=new Vector3(...c);
    const normal=vb.clone().sub(va).cross(vc.clone().sub(va));
    const outward=va.clone().add(vb).add(vc).multiplyScalar(1/3).sub(center);
    if(normal.dot(outward)<0)vertices.push(...a,...c,...b);else vertices.push(...a,...b,...c);
  };
  for(let k=0;k<3;k++)for(let i=0;i<outline.length;i++){
    const j=(i+1)%outline.length;tri(layers[k][i],layers[k][j],layers[k+1][j]);
    tri(layers[k][i],layers[k+1][j],layers[k+1][i]);
  }
  for(const k of [0,3])for(let i=1;i<outline.length-1;i++)tri(layers[k][0],layers[k][i],layers[k][i+1]);
  const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(vertices,3));geo.computeVertexNormals();return geo;
}

// Each station describes an octagonal cross-section: [z, halfWidth, floor, roof].
// Unlike extruded plates, the upper facets climb from the nose into the canopy.
export function hullLoft(stations) {
  const rings=stations.map(([z,w,b,t])=>[
    [-w*.70,b,z],[w*.70,b,z],[w,b+(t-b)*.24,z],[w,b+(t-b)*.68,z],
    [w*.67,t,z],[-w*.67,t,z],[-w,b+(t-b)*.68,z],[-w,b+(t-b)*.24,z],
  ]);
  const vertices=[];
  const triangle=(a,b,c)=>vertices.push(...a,...c,...b);
  for(let k=0;k<rings.length-1;k++)for(let i=0;i<8;i++){
    const j=(i+1)%8;
    triangle(rings[k][i],rings[k+1][j],rings[k][j]);
    triangle(rings[k][i],rings[k+1][i],rings[k+1][j]);
  }
  for(let i=1;i<7;i++){
    triangle(rings[0][0],rings[0][i],rings[0][i+1]);
    const last=rings.at(-1);triangle(last[0],last[i+1],last[i]);
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();return geometry;
}

export function buildKestrelHull() {
  const root=new Group();root.name='Kestrel07BlueprintHull';
  const materials={
    armor:new MeshStandardMaterial({name:'K07 ceramic armor',color:'#dce3e5',metalness:.16,roughness:.42}),
    paint:new MeshStandardMaterial({name:'K07 customizable panels',color:'#17a2ad',metalness:.4,roughness:.4}),
    structure:new MeshStandardMaterial({name:'K07 graphite chassis',color:'#182a36',metalness:.65,roughness:.44}),
    trim:new MeshStandardMaterial({name:'K07 edge alloy',color:'#70858e',metalness:.72,roughness:.33}),
    copper:new MeshStandardMaterial({name:'K07 copper fasteners',color:'#b78750',metalness:.72,roughness:.35}),
    glass:new MeshStandardMaterial({name:'K07 armored canopy',color:'#173f52',metalness:.25,roughness:.24}),
    light:new MeshStandardMaterial({name:'K07 running lights',color:'#7eeeff',emissive:'#29b9cf',emissiveIntensity:1.6,roughness:.3}),
  };
  const buckets=new Map();
  function add(kind,geometry,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
    const q=new Quaternion().setFromEuler(new Euler(...rotation));
    geometry.applyMatrix4(new Matrix4().compose(new Vector3(...position),q,new Vector3(...scale)));
    if(geometry.index){const flat=geometry.toNonIndexed();geometry.dispose();geometry=flat;}
    geometry.deleteAttribute('uv');
    if(!buckets.has(kind))buckets.set(kind,[]);buckets.get(kind).push(geometry);
  }
  const plate=(kind,outline,bottom,top,bevel=.008)=>add(kind,hullPlate(outline,bottom,top,bevel));
  const box=(kind,p,s)=>add(kind,new BoxGeometry(...s),p);
  const cylinder=(kind,p,r,length)=>add(kind,new CylinderGeometry(r,r,length,12),p,[Math.PI/2,0,0]);
  const ring=(kind,p,r)=>add(kind,new TorusGeometry(r,.006,4,16),p);
  const mirror=(points,side)=>points.map(([x,z])=>[side*x,z]);
  const loft=(kind,sections,x=0)=>add(kind,hullLoft(sections),[x,0,0]);
  const seam=(kind,points,r=.0025)=>{
    for(let i=1;i<points.length;i++){
      const a=new Vector3(...points[i-1]),b=new Vector3(...points[i]);
      const g=new CylinderGeometry(r,r,a.distanceTo(b),5);
      g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),b.clone().sub(a).normalize()));
      add(kind,g,a.add(b).multiplyScalar(.5).toArray());
    }
  };
  // Continuous keel and nose with a dark bevel seam around each armored panel.
  loft('structure',[[-.93,.042,-.102,-.029],[-.76,.078,-.105,.012],[-.48,.139,-.092,.061],[-.15,.193,-.077,.076],[.21,.171,-.074,.092],[.49,.13,-.06,.086]].map(([z,w,b,t])=>[z,w*.90,b,t]));
  loft('armor',[[-.92,.038,-.081,-.022],[-.76,.073,-.078,.018],[-.49,.132,-.063,.085],[-.15,.177,-.053,.102],[.19,.158,-.05,.112],[.44,.125,-.038,.098]]);
  // Raised canopy seat and two separate glass facets, enclosed by the frame.
  loft('structure',[[-.65,.030,.042,.06],[-.49,.075,.061,.15],[-.20,.110,.078,.237],[.003,.088,.092,.227],[.055,.068,.095,.13]]);
  loft('glass',[[-.624,.026,.054,.070],[-.485,.067,.077,.154],[-.205,.098,.094,.230]]);
  loft('glass',[[-.193,.098,.095,.232],[-.005,.079,.104,.223],[.039,.062,.106,.137]]);
  seam('trim',[[-.073,.19,-.20],[-.065,.238,-.20],[.065,.238,-.20],[.073,.19,-.20]],.004);
  // Belly armor, landing/access panels and longitudinal engine beams.
  loft('armor',[[-.86,.034,-.108,-.099],[-.46,.087,-.095,-.083],[.12,.102,-.079,-.068],[.39,.089,-.070,-.057]]);
  plate('structure',[[-.026,-.62],[-.034,-.58],[-.034,-.48],[.034,-.48],[.034,-.58],[.026,-.62]],-.102,-.096,.001);
  plate('trim',[[-.012,-.597],[-.018,-.58],[-.018,-.50],[.018,-.50],[.018,-.58],[.012,-.597]],-.105,-.102,.0005);
  for(let i=0;i<8;i++)box('structure',[0,-.084+i*.00095,.0+i*.034],[.095,.005,.012]);
  for(const side of [-1,1]){
    seam('trim',[[side*.017,.073,-.622],[side*.045,.157,-.485],[side*.065,.233,-.207]],.0017);
    seam('trim',[[side*.065,.235,-.19],[side*.053,.226,-.007]],.0017);
    loft('structure',[[-.39,.066,-.054,.053],[-.29,.095,-.073,.110],[.05,.105,-.074,.166],[.34,.098,-.064,.181],[.46,.084,-.055,.10]].map(([z,w,b,t])=>[z,w*.87,b,t]),side*.306);
    loft('armor',[[-.37,.061,-.030,.065],[-.28,.086,-.042,.12],[.05,.095,-.042,.177],[.33,.088,-.036,.186],[.44,.075,-.034,.105]],side*.306);
    // Shoulder bridge joins fuselage and engine; removable sensor mount rests on it.
    plate('armor',mirror([[.105,-.38],[.215,-.32],[.255,-.16],[.215,.14],[.13,.10]],side),-.037,.092,.008);
    plate('paint',mirror([[.14,-.58],[.22,-.36],[.22,-.20],[.15,-.34]],side),-.054,-.022,.006);
    // Swept wing: inset turquoise panel and border, with no top-facing gaps.
    const wing=[[.25,-.26],[.837,.12],[.823,.29],[.37,.43],[.25,.30]];
    plate('structure',mirror(wing,side),-.040,.015,.010);
    plate('armor',mirror([[.28,-.225],[.812,.131],[.797,.267],[.387,.397],[.28,.28]],side),.009,.041,.007);
    plate('paint',mirror([[.39,-.111],[.758,.142],[.743,.239],[.416,.343]],side),.040,.045,.0015);
    plate('trim',mirror([[.435,.350],[.776,.246],[.782,.260],[.431,.377]],side),.040,.047,.002);
    plate('armor',mirror([[.545,.31],[.639,.29],[.665,.354],[.564,.385]],side),.019,.038,.005);
    // Underwing service hatch and wingtip equipment rail.
    plate('armor',mirror([[.29,-.19],[.783,.136],[.777,.204],[.41,.264]],side),-.047,-.040,.002);
    plate('paint',mirror([[.44,-.04],[.715,.15],[.685,.182],[.456,.22]],side),-.050,-.047,.001);
    loft('armor',[[-.28,.061,-.078,-.067],[.05,.082,-.081,-.067],[.39,.066,-.075,-.060]],side*.306);
    for(let i=0;i<6;i++)box('structure',[side*.306,-.083,-.035+i*.026],[.079,.004,.010]);
    for(const z of [-.22,.265]){
      box('trim',[side*.306,-.080,z],[.076,.004,.058]);
      box('armor',[side*.306,-.084,z],[.061,.004,.044]);
    }
    box('structure',[side*.785,.049,.168],[.040,.033,.12]);
    for(const z of [.126,.206])box('copper',[side*.785,.067,z],[.029,.009,.013]);
    // Tall swept stabilizer as a closed beveled plate, rotated into the YZ plane.
    add('structure',hullPlate([[.05,-.07],[.26,.22],[.275,.38],[.046,.28]],-.016,.016,.004),[side*.415,0,0],[0,0,Math.PI/2]);
    add('paint',hullPlate([[.064,-.041],[.251,.228],[.263,.359],[.060,.274]],-.018,.018,.003),[side*.415,0,0],[0,0,Math.PI/2]);
    // Intake and radiator banks on the engine tops, away from each equipment socket.
    loft('structure',[[-.22,.050,.12,.132],[-.01,.052,.156,.172],[.04,.042,.161,.180]],side*.306);
    for(let i=0;i<9;i++){
      const z=-.207+i*.025, y=.147+i*.0047;
      box('trim',[side*.306,y,z],[.083,.007,.009]);
    }
    plate('paint',mirror([[.275,.11],[.337,.11],[.337,.28],[.275,.28]],side),.186,.189,.001);
    for(const z of [-.30,.355]){
      const y=z<0?.100:.177;
      plate('structure',mirror([[.282,z-.029],[.325,z-.029],[.339,z-.012],[.329,z+.023],[.282,z+.023],[.273,z+.008]],side),y,y+.003,.001);
      plate('armor',mirror([[.286,z-.024],[.323,z-.024],[.333,z-.010],[.324,z+.018],[.285,z+.018],[.28,z+.006]],side),y+.003,y+.005,.0005);
    }
    cylinder('structure',[side*.306,.011,.498],.086,.21);
    for(const z of [.43,.487,.55])ring('copper',[side*.306,.011,z],.087);
    ring('trim',[side*.306,.011,.592],.085);
    cylinder('structure',[side*.306,.011,.582],.074,.025);
    cylinder('light',[side*.306,.011,.597],.046,.008);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      box('trim',[side*.306+Math.cos(a)*.078,.011+Math.sin(a)*.078,.578],[.012,.012,.05]);
    }
    // Designed sensor and shield saddles; modules sit on these, not in the canopy.
    box('structure',[side*.153,.105,-.16],[.082,.025,.30]);
    for(const z of [-.30,-.02])box('copper',[side*.153,.120,z],[.06,.008,.012]);
    box('structure',[side*.218,.083,.19],[.072,.055,.26]);
    for(const z of [.07,.31])box('copper',[side*.218,.112,z],[.048,.008,.013]);
    for(const z of [-.84,-.79])box('structure',[side*.025,-.002,z],[.008,.004,.016]);
    // Landing bay and front auxiliary sockets on the underside.
    box('structure',[side*.168,-.093,-.32],[.098,.032,.22]);
    box('armor',[side*.168,-.114,-.28],[.077,.012,.115]);
    cylinder('light',[side*.38,-.022,-.23],.016,.01);
    for(const z of [.145,.235])box('copper',[side*.785,.047,z],[.013,.008,.012]);
    // Panel breaks, flush fasteners, access handles and wing conduits.
    seam('trim',[[side*.046,.011,-.795],[side*.082,.044,-.65],[side*.10,.064,-.52]],.002);
    seam('structure',[[side*.16,.074,-.20],[side*.19,.080,-.07],[side*.183,.085,.09]],.0025);
    seam('structure',[[side*.443,.048,-.040],[side*.475,.048,.011],[side*.533,.048,.052]],.002);
    seam('trim',[[side*.49,.048,.21],[side*.58,.048,.199],[side*.64,.048,.155]],.002);
    for(const x of [.45,.65,.79])for(const z of [.17,.205]){
      add('copper',new CylinderGeometry(.003,.003,.003,6),[side*x,.050,z]);
    }
    for(const z of [-.27,.055,.305]){
      const y=z<0?.124:.184;
      for(const offset of [-.054,.054])add('trim',new CylinderGeometry(.003,.003,.004,6),[side*.306+offset,y,z]);
    }
    // Sloped outer engine side panel and gill assembly.
    loft('trim',[[-.23,.014,-.023,.075],[.10,.014,-.018,.127],[.27,.012,-.016,.132]],side*.397);
    for(let i=0;i<8;i++)box('structure',[side*.403,.06,-.07+i*.026],[.010,.027,.009]);
    seam('structure',[[side*.254,.183,.08],[side*.25,.191,.16],[side*.251,.19,.29]],.002);
    seam('trim',[[side*.355,.173,.082],[side*.363,.172,.17],[side*.354,.17,.294]],.003);
    // Fastened panels at the front of each cowling, with a small recessed handle.
    seam('structure',[[side*.272,.112,-.31],[side*.283,.124,-.277],[side*.33,.124,-.277],[side*.34,.114,-.30]],.002);
    box('structure',[side*.306,.126,-.268],[.031,.004,.009]);
    for(const x of [.278,.336])add('copper',new CylinderGeometry(.003,.003,.004,6),[side*x,.13,-.255]);
    // Short copper service lines protected by the wing root.
    seam('copper',[[side*.433,.014,.30],[side*.469,.014,.29],[side*.493,.014,.257]],.004);
    // Two small front cheek intakes have metal rims and dark internal throats.
    cylinder('trim',[side*.192,.022,-.34],.030,.014);
    cylinder('structure',[side*.192,.022,-.351],.024,.012);
    cylinder('light',[side*.192,.022,-.358],.010,.004);
  }
  // Dorsal reactor housing and rear gun plinth separated along Z.
  plate('structure',[[-.105,.13],[-.124,.20],[-.104,.42],[.104,.42],[.124,.20],[.105,.13]],.049,.115,.008);
  for(const x of [-.11,.11])box('trim',[x,.119,.27],[.018,.008,.21]);
  plate('armor',[[-.065,.43],[-.073,.51],[.073,.51],[.065,.43]],.05,.123,.006);
  box('structure',[0,.122,.48],[.063,.015,.052]);
  box('light',[0,.103,.095],[.04,.005,.064]);
  // Merge immutable detail by material: the detailed hull costs seven draw calls.
  for(const [kind,parts] of buckets){
    const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());
    geometry.computeBoundingSphere();
    const mesh=new Mesh(geometry,materials[kind]);mesh.name=`K07_${kind}`;root.add(mesh);
  }
  return {root,paint:materials.paint,dispose(){root.children.forEach(m=>m.geometry.dispose());Object.values(materials).forEach(m=>m.dispose());root.clear();}};
}
