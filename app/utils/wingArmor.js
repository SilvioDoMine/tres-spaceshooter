import { buildNebulaArmor } from './nebulaWing'

export function buildWingArmor(b, nebula = false) {
  if (nebula) return buildNebulaArmor(b)
  // Continuous swept armor: every seam follows the wing's load direction.
  b.plate('structure',[[.075,-.295],[.57,.105],[.635,.445],[.355,.365],[.075,.10]],-.040,.023,.007)
  b.plate('trim',[[.09,-.277],[.558,.113],[.619,.424],[.36,.35],[.09,.092]],-.032,.027,.003)
  const panels=[
    [[.106,-.258],[.548,.119],[.567,.211],[.426,.151],[.106,-.123]],
    [[.107,-.108],[.420,.164],[.566,.226],[.603,.403],[.361,.331],[.107,.086]],
  ]
  for(const p of panels) {
    b.plate('armor',p,.025,.052,.005)
    b.plate('armor',p,-.047,-.035,.003)
  }
  // Blueprint armor ribbon: stepped interlocking shields over a narrow
  // mechanical channel. No decorative triangle printed on the broad panel.
  b.plate('structure',[[.205,-.079],[.333,.027],[.467,.171],[.476,.207],[.323,.052],[.203,-.056]],.048,.056,.002)
  const shields=[
    [[.137,-.207],[.225,-.132],[.254,-.069],[.234,-.045],[.19,-.099],[.159,-.11]],
    [[.239,-.120],[.339,-.035],[.368,.02],[.341,.044],[.30,-.006],[.273,-.023]],
    [[.354,-.022],[.436,.049],[.467,.108],[.434,.127],[.405,.087],[.379,.072]],
    [[.197,.008],[.264,.063],[.29,.132],[.254,.15],[.217,.107]],
    [[.289,.086],[.359,.151],[.39,.218],[.35,.247],[.316,.192]],
  ]
  for(const p of shields) {
    b.plate('trim',p,.057,.060,.002)
    const cx=p.reduce((n,q)=>n+q[0],0)/p.length,cz=p.reduce((n,q)=>n+q[1],0)/p.length
    b.plate('armor',p.map(([x,z])=>[cx+(x-cx)*.93,cz+(z-cz)*.93]),.061,.075,.003)
  }
  // Machined dark cartridges sit in the gaps between ceramic shields.
  for(const [x,z] of [[.259,-.013],[.357,.071],[.434,.182]]) {
    b.plate('structure',[[x-.018,z-.032],[x+.014,z-.006],[x+.025,z+.036],[x-.003,z+.012]],.076,.079,.001)
    b.rail('trim',[[x-.009,.081,z-.017],[x+.011,.081,z+.014]],.002)
    for(const dz of [-.014,.014]) b.stud('copper',[x,.083,z+dz],.0024,.003)
  }
  // Segmented leading-edge spar, with clamps and a recessed cyan conduit.
  b.rail('structure',[[.193,.066,-.176],[.48,.066,.073],[.54,.062,.127]],.009)
  b.rail('trim',[[.202,.071,-.17],[.478,.071,.07]],.0035)
  for(let i=0;i<5;i++) {
    const x=.228+i*.049,z=-.146+i*.042
    b.rail('copper',[[x-.006,.074,z+.007],[x+.006,.074,z-.007]],.0025)
  }
  b.rail('light',[[.35,.076,-.04],[.392,.076,-.004]],.0025)
  // Outer edge protector is a raised tapered housing, not an isolated fin.
  b.plate('structure',[[.544,.173],[.567,.19],[.611,.408],[.583,.359]],.049,.071,.004)
  b.plate('armor',[[.554,.204],[.564,.215],[.597,.371],[.58,.343]],.069,.078,.003)
  b.rail('amber',[[.567,.078,.232],[.591,.078,.354]],.003)
  // Rear service hatch with a ceramic rim and captive fasteners.
  b.plate('trim',[[.322,.246],[.372,.28],[.402,.324],[.355,.311]],.052,.056,.002)
  b.plate('armor',[[.334,.259],[.368,.285],[.386,.308],[.357,.299]],.056,.063,.002)
  for(const [x,z] of [[.339,.267],[.372,.295]]) b.stud('copper',[x,.065,z],.002,.003)
  b.plate('structure',[[.084,-.131],[.145,-.08],[.158,.158],[.088,.115]],.033,.062,.005)
  b.plate('armor',[[.095,-.107],[.133,-.073],[.145,.139],[.1,.109]],.060,.071,.004)
  b.box('structure',[.12,.074,.038],[.018,.005,.071])
  b.box('light',[.12,.077,.038],[.007,.003,.053])
  for(const z of [-.060,.123]) b.stud('copper',[.118,.074,z],.0035,.004)
  b.plate('amber',[[.566,.225],[.577,.236],[.610,.404],[.6,.394]],.054,.056,.001)
  b.plate('amber',[[.115,-.219],[.131,-.206],[.147,-.162],[.132,-.175]],.053,.056,.001)
  b.rail('trim',[[.111,.054,-.252],[.542,.054,.122]],.0015)
  for(const [x,z] of [[.166,-.188],[.317,-.06],[.512,.12],[.577,.349],[.356,.308]]) {
    b.stud('trim',[x,.055,z],.002,.003)
    b.stud('trim',[x,-.049,z],.002,.003)
  }
  // Mechanical lines run underneath, leaving the top readable in gameplay.
  b.rail('copper',[[.105,-.052,.095],[.24,-.052,.205],[.37,-.052,.31]],.003)
  b.rail('light',[[.105,-.056,.095],[.24,-.056,.205],[.37,-.056,.31]],.0015)
}
