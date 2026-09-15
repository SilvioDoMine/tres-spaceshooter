// Nébula has its own open chassis. No Falcon silhouette underneath it.
export function buildNebulaArmor(b) {
  // Load-bearing fork: narrow graphite members, with actual open space
  // between the outer blade, optical housing and trailing blade.
  const spars = [
    [[.075,-.17],[.19,-.13],[.23,.19],[.085,.15]],
    [[.13,-.12],[.39,-.065],[.51,.10],[.43,.18],[.20,.10]],
    [[.12,.08],[.20,.05],[.50,.27],[.44,.36]],
    [[.36,.11],[.45,.11],[.51,.38],[.44,.36]],
  ]
  for(const p of spars) b.plate('structure',p,-.040,.031,.008)
  b.plate('trim',[[.11,-.13],[.16,-.115],[.18,.13],[.12,.11]],.028,.039,.003)

  // Long inner spear, broad central shield, and two swept outer prongs.
  // Each is a closed solid with a graphite edge and a smaller ceramic cap.
  const blades = [
    {outline:[[.115,-.30],[.277,-.12],[.323,.061],[.228,.039],[.126,-.08]],
      cap:[[.126,-.265],[.257,-.111],[.29,.027],[.238,.012],[.14,-.086]]},
    {outline:[[.23,-.099],[.42,-.013],[.51,.139],[.395,.187],[.267,.087]],
      cap:[[.25,-.071],[.404,.003],[.478,.124],[.398,.161],[.281,.077]]},
    {outline:[[.294,-.178],[.501,-.071],[.653,.188],[.53,.062]],
      cap:[[.351,-.119],[.488,-.046],[.601,.116],[.53,.041]]},
    {outline:[[.239,.16],[.34,.189],[.448,.318],[.615,.454],[.422,.359]],
      cap:[[.279,.187],[.327,.209],[.428,.335],[.551,.408],[.427,.337]]},
    {outline:[[.468,.207],[.559,.257],[.646,.446],[.543,.347]],
      cap:[[.495,.239],[.543,.274],[.612,.395],[.559,.339]]},
  ]
  for(const {outline,cap} of blades) {
    b.plate('structure',outline,-.037,.035,.007)
    b.plate('trim',cap,.032,.039,.003)
    b.plate('armor',cap,.038,.061,.008)
    b.plate('armor',cap,-.052,-.035,.006)
  }
  // Slim continuous violet conduits on selected edges. The white plates
  // remain white; energy never fills the wing's open slots.
  const routes = [
    [[.123,.040,-.284],[.269,.040,-.12],[.309,.040,.041]],
    [[.313,.042,-.165],[.497,.042,-.061],[.638,.042,.163]],
    [[.256,.040,.18],[.434,.040,.339],[.595,.040,.439]],
    [[.482,.039,.222],[.551,.039,.266],[.631,.039,.417]],
  ]
  for(const p of routes) {
    b.rail('secondary',p,.005)
    b.rail('secondary',p.map(([x,y,z])=>[x,-y-.004,z]),.003)
  }
  // Recessed dark chevrons and raised mechanical pockets.
  b.plate('structure',[[.32,-.027],[.391,.006],[.427,.056],[.365,.031]],.061,.065,.002)
  b.plate('structure',[[.177,-.153],[.225,-.104],[.245,-.032],[.208,-.069]],.061,.065,.002)
  b.plate('structure',[[.429,-.07],[.472,-.048],[.508,.012],[.475,-.012]],.061,.065,.002)
  // Optical module is a substantial housing suspended between fork spars.
  const hub=[[.325,.132],[.377,.095],[.427,.13],[.444,.219],[.397,.266],[.34,.225]]
  b.plate('structure',hub,-.067,.067,.009)
  for(const face of [-1,1]) {
    const y=face*.069
    b.tube('trim',[.385,y,.184],.045,.012,[0,0,0])
    b.tube('structure',[.385,y+face*.007,.184],.039,.014,[0,0,0])
    b.topRing('secondary',[.385,y+face*.015,.184],.030,.004)
    b.tube('secondary',[.385,y+face*.015,.184],.021,.006,[0,0,0])
    b.tube('light',[.385,y+face*.019,.184],.010,.003,[0,0,0])
    for(const z of [.122,.241]) b.stud('copper',[.385,face*.07,z],.004,.004)
  }
  b.plate('armor',[[.086,-.12],[.126,-.102],[.151,.10],[.11,.141],[.088,.10]],.035,.075,.006)
  b.box('structure',[.12,.077,.014],[.023,.008,.106])
  b.box('light',[.12,.082,.014],[.008,.003,.076])
  for(const [x,z] of [[.178,-.15],[.272,-.03],[.398,.05],[.483,-.027],[.544,.293],[.467,.356]]) {
    b.stud('structure',[x,.063,z],.004,.004)
    b.stud('trim',[x,.066,z],.002,.003)
  }
  for(let i=0;i<5;i++) b.box('trim',[.197,.036,.045+i*.017],[.025,.005,.005])
}
