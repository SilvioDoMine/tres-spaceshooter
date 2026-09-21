"""Distinct chapter hulls. Only mechanical fittings are shared, never hull templates.
Run Blender --background --factory-startup --python scripts/build-distinct-fleets.py.
"""
import bpy, math, pathlib, importlib.util, sys
sys.dont_write_bytecode=True
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('fleet',ROOT/'scripts/build-enemy-families.py'); f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
ROLES=f.ROLES+['hiveDrone']

def skin(name,points,y=-.30,h=.18):
    f.plate(name,points,y,h,1)
    cx=sum(x for x,z in points)/len(points);cz=sum(z for x,z in points)/len(points)
    inset=[(cx+(x-cx)*.88,cz+(z-cz)*.9) for x,z in points]
    f.plate(name+' armor',inset,y+h+.008,.065,0)
    # Recessed structure is visible around the separate armored plate.

def pair(name,pts,y=-.30,h=.18):
    for s in [-1,1]:skin(name,[(s*x,z) for x,z in pts],y,h)

def rail(a,b,r=.04,mat=2): f.tube('Structural conduit',a,b,r,mat,sides=8)
def bridge(x,z,w=.18,l=.22):
    skin('Command blister',[(x-w,z-l),(x+w,z-l),(x+w*.75,z+l),(x-w*.75,z+l)],-.02,.12)
    rail((x-w*.7,.125,z-l*.8),(x+w*.7,.125,z-l*.8),.023,4)
def strut(a,b):rail((a[0],-.2,a[1]),(b[0],-.2,b[1]),.09,1)
def arc(name,r,start,end,y=-.25,w=.13):
    n=max(5,int(abs(end-start)*10));pts=[]
    for rr,angles in [(r+w,[start+(end-start)*i/n for i in range(n+1)]),(r-w,[end-(end-start)*i/n for i in range(n+1)])]:
        pts.extend([(math.sin(a)*rr,-math.cos(a)*rr) for a in angles])
    skin(name,pts,y,.14)
def petal(angle,r,length,width,y=-.25):
    pts=[(0,-r-length),(.7*width,-r-.75*length),(width,-r-.3*length),(.45*width,-r),(0,-r+.1),(-.45*width,-r),(-width,-r-.3*length),(-.7*width,-r-.75*length)]
    skin('Faceted petal',f.radial_poly(pts,angle),y,.17)
    rail((math.sin(angle)*r,y+.25,-math.cos(angle)*r),(math.sin(angle)*(r+length*.75),y+.25,-math.cos(angle)*(r+length*.75)),.018,4)
def deck(x,z,w,l):skin('Armored deck',[(x-w,z-l),(x+w,z-l),(x+w,z+l),(x-w,z+l)])
def vents(x,z,n=3):
    for i in range(n):rail((x-.09,-.01,z+i*.09),(x+.09,-.01,z+i*.09),.02,2)

def predator(role):
    # Chapter 2: separate swept blades, insect abdomen, sickles and split tails.
    if role=='ufo':
        pair('Scissor wing',[(.09,-.9),(.38,-.3),(.95,-.55),(.57,.42),(.18,.66)])
        strut((-.25,.15),(.25,.15));bridge(0,.18,.12,.28)
    elif role=='ufofast':
        pair('Boomerang',[(.08,-.3),(.88,.05),(.55,.22),(.2,.12),(.35,.64),(.08,.42)])
        bridge(0,.13,.1,.15)
    elif role=='kamikaze':
        skin('Needle beak',[(0,-1.15),(.21,-.28),(.13,.61),(-.13,.61),(-.21,-.28)])
        pair('Reverse barb',[(.14,.08),(.55,.65),(.3,.54),(.13,.35)]);vents(0,.08)
    elif role=='asteroid':
        for i in range(3):petal(i*math.tau/3,.16,.64,.26,-.45)
        f.core(.17,-.2,.14)
    elif role=='miniHarpy':
        pair('Harpy hooked wing',[(.12,-.4),(.62,-.2),(1.2,-.65),(1.05,.25),(.58,.52),(.35,.2),(.1,.7)])
        skin('Split bird breast',[(-.2,-.83),(.2,-.83),(.25,.5),(0,.76),(-.25,.5)]);bridge(0,0,.12,.22)
    elif role=='miniHive':
        arc('Crescent brood ship',.7,.65,5.63,w=.22)
        pair('Mandible',[(.17,.2),(.25,-.89),(.46,-.55),(.49,.35)])
        bridge(0,.62,.22,.16)
    elif role=='torusEnemy':
        for i in range(3):
            a=i*math.tau/3
            skin('Rotary sickle',f.radial_poly([(.12,-.15),(.37,-.62),(.76,-.68),(.52,-.3),(.45,.2)],a),-.38,.18)
        f.core(.19,-.24,.13)
    elif role=='compositeEnemy':
        pair('Forked gun fighter',[(.18,.57),(.21,-.31),(.48,-.52),(.73,-.3),(.53,.5)])
        skin('Central fang',[(0,-.69),(.17,.1),(0,.44),(-.17,.1)]);strut((-.5,.22),(.5,.22))
    elif role=='miniasteroid':
        skin('Hook shard',[(0,-.42),(.46,-.12),(.32,.4),(.11,.18),(-.27,.36),(-.34,.05)])
    elif role=='miniboss':
        pair('Mantis carrier',[(.18,-.23),(.57,-.67),(.84,-.25),(.74,.66),(.35,1.03),(.39,.35)])
        deck(0,.25,.2,.53);bridge(0,.34,.17,.23)
    else:
        pair('Dragonfly blade',[(.02,-.25),(.59,-.49),(.31,.04),(.4,.29),(.09,.15)])
        rail((0,-.13,-.3),(0,-.13,.53),.09,0)

def foundry(role):
    # Chapter 3: asymmetric foundry machinery, bulkheads and armored casemates.
    if role=='ufo':
        deck(0,-.4,.22,.48);deck(-.49,.12,.2,.49);deck(.4,.32,.14,.28)
        strut((-.5,.04),(.4,.04));bridge(-.48,.1,.12,.2)
    elif role=='ufofast':
        skin('Industrial wedge',[(-.46,-.29),(.46,-.29),(.63,.12),(.39,.34),(.12,.16),(-.12,.16),(-.39,.34),(-.63,.12)])
        pair('Drive pylons',[(.33,.19),(.59,.15),(.57,.76),(.32,.63)]);vents(-.43,.35);vents(.43,.35)
    elif role=='kamikaze':
        skin('Breaching hammer',[(-.68,-.63),(.68,-.63),(.68,-.34),(.19,-.18),(.19,.64),(-.19,.64),(-.19,-.18),(-.68,-.34)])
        for x in [-.48,0,.48]:skin('Ram teeth',[(x-.09,-.57),(x,-.93),(x+.09,-.57)],-.17,.2)
    elif role=='asteroid':
        skin('Hexagonal mine',[(-.62,-.31),(0,-.68),(.62,-.31),(.62,.31),(0,.68),(-.62,.31)],-.46,.19)
        for x in [-.35,.35]:vents(x,-.18,4)
    elif role=='miniHarpy':
        deck(0,.04,.31,.59)
        pair('Siege outriggers',[(.76,-.6),(1.2,-.51),(1.2,.3),(.9,.5),(.76,.15)])
        skin('Front armored gantry',[(-1.08,-.25),(1.08,-.25),(.85,.04),(-.85,.04)],-.3,.18);bridge(0,.17,.2,.25)
    elif role=='miniHive':
        pair('Transport containers',[(.07,-.68),(.54,-.68),(.63,.64),(.1,.8)])
        deck(0,.63,.73,.15);bridge(0,.62,.26,.13)
        for x in [-.33,.33]:vents(x,-.3,6)
    elif role=='torusEnemy':
        deck(0,0,.49,.49)
        for i in range(4):
            a=i*math.pi/2;skin('Cruciform outrigger',f.radial_poly([(-.17,-.4),(.17,-.4),(.2,-.85),(-.2,-.85)],a),-.38,.16)
    elif role=='compositeEnemy':
        skin('Triple casemate',[(-.7,-.32),(-.4,-.48),(.4,-.48),(.7,-.32),(.7,.27),(.38,.56),(-.38,.56),(-.7,.27)])
        deck(0,-.42,.14,.19);bridge(0,.23,.27,.16)
    elif role=='miniasteroid':
        skin('Armored demolition puck',[(-.3,-.35),(.3,-.35),(.42,0),(.2,.36),(-.2,.36),(-.42,0)])
        vents(0,-.12,3)
    elif role=='miniboss':
        skin('Citadel cross',[(-.3,-.8),(.3,-.8),(.3,-.26),(.84,-.26),(.84,.41),(.3,.41),(.3,.86),(-.3,.86),(-.3,.41),(-.84,.41),(-.84,-.26),(-.3,-.26)])
        bridge(0,.36,.24,.2)
    else:
        deck(-.19,0,.11,.42);deck(.19,0,.11,.42);strut((-.2,0),(.2,0));bridge(0,0,.1,.1)

def navy(role):
    # Chapter 4: naval silhouettes with actual deck layouts, not inherited fighters.
    if role=='ufo':
        skin('Patrol cutter',[(-.14,-1.02),(.14,-1.02),(.31,-.34),(.31,.65),(-.31,.65),(-.31,-.34)])
        pair('Stern stabilizer',[(.25,.14),(.59,.4),(.56,.74),(.2,.58)]);bridge(0,.14,.19,.23)
    elif role=='ufofast':
        pair('Hydrofoil fork',[(.12,-.27),(.34,-.3),(.56,.76),(.32,.57),(.17,.05)])
        skin('Crossdeck',[(-.42,.32),(.42,.32),(.32,.53),(-.32,.53)]);bridge(0,.36,.13,.12)
    elif role=='kamikaze':
        pair('Twin torpedo ram',[(.11,-.66),(.26,-1.04),(.39,-.66),(.39,.53),(.11,.53)])
        skin('Ram crossbrace',[(-.39,.1),(.39,.1),(.48,.37),(-.48,.37)]);bridge(0,.23,.13,.12)
    elif role=='asteroid':
        skin('Coastal battery',[(-.72,-.13),(-.52,-.42),(.1,-.65),(.6,-.38),(.72,-.02),(.42,.16),(.25,.66),(-.25,.66),(-.38,.15)],-.43,.16)
        for z in [-.25,.25]:rail((-.44,-.15,z),(.44,-.15,z),.055,2)
    elif role=='miniHarpy':
        pair('Catamaran gun hull',[(.79,-.65),(1.09,-.51),(1.1,.7),(.79,.51)])
        skin('Wing bridge',[(-.94,.04),(.94,.04),(.85,.34),(-.85,.34)])
        skin('Bow rail',[(-.13,-.87),(.13,-.87),(.25,.55),(-.25,.55)]);bridge(0,.33,.19,.17)
    elif role=='miniHive':
        skin('Asymmetric flight deck',[(-.7,-.7),(.47,-.7),(.65,.66),(-.7,.79)])
        for z in [-.44,-.05,.34]:rail((-.51,-.005,z),(.12,-.005,z),.017,3)
        bridge(.41,.15,.12,.37);rail((-.23,.002,-.48),(-.23,.002,.58),.015,4)
    elif role=='torusEnemy':
        arc('Radar horseshoe',.68,.65,5.64,y=-.4,w=.17)
        skin('Radar control arm',[(-.15,-.7),(.15,-.7),(.15,.25),(-.15,.25)],-.4,.15)
        rail((0,-.17,-.48),(0,-.17,.5),.07,2)
    elif role=='compositeEnemy':
        skin('Broad beam corvette',[(-.62,-.41),(-.19,-.26),(0,-.7),(.19,-.26),(.62,-.41),(.75,.3),(.27,.57),(-.27,.57),(-.75,.3)])
        bridge(0,.24,.22,.18);vents(-.47,.04);vents(.47,.04)
    elif role=='miniasteroid':
        skin('Escort launch',[(0,-.43),(.22,-.15),(.24,.4),(-.24,.4),(-.22,-.15)])
        pair('Launch fins',[(.19,.15),(.44,.38),(.18,.32)]);bridge(0,.12,.1,.1)
    elif role=='miniboss':
        skin('Dreadnought prow',[(-.22,-.81),(.22,-.81),(.43,-.32),(.43,.8),(-.43,.8),(-.43,-.32)])
        pair('Broadside decks',[(.38,-.28),(.86,-.12),(.89,.52),(.43,.78)])
        bridge(0,.47,.27,.22);vents(-.62,.03,4);vents(.62,.03,4)
    else:
        skin('Naval launch drone',[(-.15,-.45),(.15,-.45),(.23,.36),(-.23,.36)])
        skin('Transverse rudder',[(-.43,.19),(.43,.19),(.43,.32),(-.43,.32)]);bridge(0,0,.09,.12)

def astral(role):
    # Chapter 5: open negative space, petals, orbital arcs and floating crystal ribs.
    if role=='ufo':
        arc('Lunar bow',.62,.55,5.73,w=.16);petal(0,.36,.58,.18);strut((0,.4),(0,-.5))
    elif role=='ufofast':
        for a in [-1.0,1.0]:petal(a,.16,.62,.15)
        arc('Rear crescent',.38,1.7,4.58,w=.08)
    elif role=='kamikaze':
        pair('Split crystal lance',[(.03,-1.04),(.29,-.3),(.22,.54),(.05,.18)])
        arc('Lance collar',.35,1.2,5.08,w=.075)
    elif role=='asteroid':
        for i in range(5):petal(i*math.tau/5,.12,.47,.15,-.48)
        f.core(.16,-.22,.12)
    elif role=='miniHarpy':
        pair('Celestial harp',[(.19,-.65),(.9,-.73),(1.13,-.44),(.65,-.32),(.42,.75),(.23,.24)])
        arc('Harp crescent',.49,1.3,4.98,w=.08);petal(0,.32,.48,.16)
    elif role=='miniHive':
        for a in [-.6,.6,math.pi]:petal(a,.32,.64,.27)
        arc('Open cradle',.34,0,math.tau,w=.075);f.core(.14,-.11,.22)
    elif role=='torusEnemy':
        for a in [0,math.pi]:
            arc('Twin orbital crescent',.69,a+.18,a+2.7,y=-.42,w=.1)
        for a in [math.pi/2,3*math.pi/2]:petal(a,.1,.38,.2,-.42)
    elif role=='compositeEnemy':
        for a in [-.72,0,.72]:petal(a,.12,.48,.15)
        arc('Triune root',.45,1.2,5.08,w=.11)
    elif role=='miniasteroid':
        arc('Seed crescent',.3,.5,5.78,w=.1);petal(0,.1,.31,.08)
    elif role=='miniboss':
        for i in range(4):petal(math.pi/4+i*math.pi/2,.29,.55,.22)
        arc('Lotus containment',.32,0,math.tau,w=.08);f.core(.18,-.1,.23)
    else:
        for a in [-math.pi/2,math.pi/2]:petal(a,.1,.4,.14)
        f.core(.13,-.2,.2)

BUILDERS={2:predator,3:foundry,4:navy,5:astral}
def build(chapter,role):
    BUILDERS[chapter](role)
    # Preserve an unobstructed horizontal gun plane on radial batteries.
    if role in ('asteroid','torusEnemy'):
        bpy.context.view_layer.update()
        top=max((o.matrix_world@v.co).z for o in bpy.data.objects if o.type=='MESH' for v in o.data.vertices)
        ceiling=-.055 if role=='torusEnemy' else .015
        for o in bpy.data.objects:
            if o.type=='MESH':
                for v in o.data.vertices:
                    p=o.matrix_world@v.co;p.z=(p.z-top)*.65+ceiling;v.co=o.matrix_world.inverted()@p

if __name__=='__main__':
    only=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    for chapter in range(2,6):
        for role in ROLES:
            key=f'c{chapter}_{role}'
            if only and key not in only:continue
            f.start(role,chapter);build(chapter,role);groups=f.sockets(role)
            if role in ('torusEnemy','miniboss','asteroid'):
                for o in list(bpy.data.objects):
                    if o.type=='MESH' and (o.name.startswith('Battery bearing') or o.name.startswith('Bearing trim')):bpy.data.objects.remove(o,do_unlink=True)
                for socket in f.CAT[role]['sockets']:
                    group=socket.get('group');p=socket['position'];d=socket['direction']
                    if group not in ('ring_rotor','radial_emitter'):continue
                    a=(p[0]-d[0]*.26,p[1]-.075,p[2]-d[2]*.26)
                    center=(0,p[1]-.075,0)
                    if chapter==3:
                        # A triangular reinforced beam, not a circular ring.
                        f.tube('Industrial radial girder',center,a,.07,2,groups[group],sides=4)
                    elif chapter==4:
                        f.tube('Naval gun carriage',center,a,.085,0,groups[group],sides=6)
                    elif chapter==2:
                        f.tube('Predator radial ligament',center,a,.045,1,groups[group],sides=6)
                    else:
                        f.tube('Crystal radial filament',center,a,.035,3,groups[group],sides=8)
            f.save(key,ROOT/'public/models/enemies'/(key+'.glb'))



    import subprocess
    subprocess.run(['node',str(ROOT/'scripts/version-chapter-fleets.mjs')],check=True)
