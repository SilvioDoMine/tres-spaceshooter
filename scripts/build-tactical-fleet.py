"""Run with installed Blender. Reuses the project's GLB/material batching pipeline."""
import importlib.util, pathlib, math, json, sys, hashlib
import bpy
from mathutils import Vector
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('fleet', ROOT/'scripts/build-enemy-families.py')
f = importlib.util.module_from_spec(spec); spec.loader.exec_module(f)
plate, tube, ring, core = f.plate, f.tube, f.ring, f.core
roles = ['sniper', 'skirmisher', 'broadside', 'spiral']
names = {
  1: ['AGULHA', 'LASCA', 'ESCUDO', 'ORBITAL'],
  2: ['FERRÃO', 'TESOURA', 'FALCE', 'GARRA'],
  3: ['OBUSEIRO', 'MARTELO', 'BALUARTE', 'FORNALHA'],
  4: ['VIGIA', 'VANGUARDA', 'FRAGATA', 'RETRANSMISSOR'],
  5: ['ORÁCULO', 'SERAFIM', 'RELICÁRIO', 'ASTROLÁBIO'],
}

def panel(name, points, y=.03, thickness=.07, mat=3):
    return plate(name, points, y, thickness, mat)

def mirror(points, s): return [(s*x,z) for x,z in points]

def keel(w, front, back, y=-.2, h=.23, mat=1):
    return plate('Structural keel', [(-w*.5,front),(w*.5,front),(w,front*.5),(w,back*.7),(w*.5,back),(-w*.5,back),(-w,back*.7),(-w,front*.5)],y,h,mat)

def vent(x,z,length=.3):
    for i in range(4):
        tube('Heat exchanger',(x-.075,.18,z+i*length/4),(x+.075,.18,z+i*length/4),.018,1,sides=4)

def drive(x,z,r=.10):
    tube('Vector drive housing',(x,-.055,z-.2),(x,-.055,z+.08),r,1,r2=r*1.15)
    tube('Drive collar',(x,-.055,z+.03),(x,-.055,z+.10),r*1.2,2)
    tube('Drive aperture',(x,-.055,z+.1),(x,-.055,z+.11),r*.78,4)

def chapter_one(role):
    # Split mineral armor locked into an industrial frame, broad faceted surfaces.
    if role == 'sniper':
        keel(.20,-.82,.67)
        for s in [-1,1]:
            panel('Cleaved cheek',mirror([(.10,-.60),(.41,-.32),(.47,.31),(.26,.66),(.12,.38)],s),-.10,.23,0)
            panel('Mineral facet',mirror([(.16,-.36),(.35,-.18),(.36,.24),(.18,.41)],s),.14,.08,3)
            drive(s*.27,.65)
    elif role == 'skirmisher':
        keel(.25,-.67,.44)
        for s in [-1,1]:
            panel('Sheared arrow wing',mirror([(.15,-.55),(.34,-.72),(.73,.11),(.54,.43),(.21,.26)],s),-.15,.24,0)
            panel('Impact edge',mirror([(.35,-.53),(.61,.09),(.52,.20)],s),.10,.045,3)
            drive(s*.43,.45,.12)
    elif role == 'broadside':
        keel(.56,-.58,.54)
        for s in [-1,1]:
            panel('Shield slab',mirror([(.15,-.53),(.60,-.59),(.79,-.15),(.69,.49),(.20,.60)],s),-.18,.33,0)
            panel('Mineral cap',mirror([(.26,-.36),(.55,-.38),(.62,-.03),(.54,.33),(.24,.4)],s),.16,.045,3)
            drive(s*.31,.58)
    else:
        ring('Orbital collar',.58,-.12,.16,1,n=20)
        for i in range(3):
            a=i*math.tau/3
            panel('Captured shard',f.radial_poly([(-.19,-.32),(.20,-.32),(.33,-.66),(.12,-.91),(-.22,-.77)],a),-.12,.27,0)
            panel('Shard crown',f.radial_poly([(-.10,-.46),(.14,-.45),(.20,-.65),(.03,-.78),(-.13,-.67)],a),.16,.04,3)
        core(.23,.0,.36)

def chapter_two(role):
    # Harpy descendants: open negative space, blades and split forward mandibles.
    if role == 'sniper':
        keel(.15,-.78,.66)
        for s in [-1,1]:
            panel('Long mandible',mirror([(.13,-.66),(.33,-1.02),(.43,-.50),(.32,.46),(.13,.64)],s),-.13,.19,0)
            panel('Knife edge',mirror([(.25,-.67),(.34,-.85),(.37,-.48),(.25,.24)],s),.07,.05,3)
            drive(s*.22,.7)
    elif role == 'skirmisher':
        keel(.18,-.7,.58)
        for s in [-1,1]:
            panel('Scissor mainplane',mirror([(.14,-.25),(.80,-.84),(.72,-.19),(.38,.63),(.19,.45)],s),-.13,.18,0)
            panel('Swept blade armor',mirror([(.3,-.21),(.69,-.62),(.61,-.15),(.35,.43)],s),.06,.05,3)
            drive(s*.30,.63,.115)
    elif role == 'broadside':
        keel(.19,-.79,.70)
        for s in [-1,1]:
            panel('Crescent weapons wing',mirror([(.14,-.15),(.74,-.62),(.69,.05),(.80,.55),(.27,.37)],s),-.14,.24,0)
            panel('Crescent spine',mirror([(.28,-.09),(.61,-.36),(.53,.06),(.64,.37),(.34,.24)],s),.11,.05,3)
            drive(s*.20,.7)
    else:
        ring('Three-claw gimbal',.41,-.12,.10,2,n=24)
        for i in range(3):
            a=i*math.tau/3
            panel('Hooked rotating claw',f.radial_poly([(-.10,-.26),(.13,-.27),(.42,-.63),(.33,-.95),(.14,-.66),(-.12,-.56)],a),-.10,.20,0)
            panel('Claw armor',f.radial_poly([(.10,-.42),(.28,-.62),(.26,-.79),(.06,-.60)],a),.11,.06,3)
        core(.18,.02,.31)

def chapter_three(role):
    # Colossus: armored transverse shoulders, recessed bridges and visible heat sinks.
    if role == 'sniper':
        keel(.34,-.80,.75)
        for s in [-1,1]:
            panel('Recoil carriage',mirror([(.12,-.72),(.48,-.55),(.47,.61),(.14,.75)],s),-.18,.32,0)
            panel('Heavy recoil rail',mirror([(.19,-.47),(.35,-.44),(.35,.37),(.19,.41)],s),.15,.06,2)
            vent(s*.32,.03); drive(s*.3,.79,.14)
    elif role == 'skirmisher':
        keel(.21,-.72,.67)
        for s in [-1,1]:
            panel('Hammer shoulder',mirror([(.17,-.63),(.69,-.59),(.78,-.28),(.60,.03),(.20,-.04)],s),-.18,.33,0)
            panel('Assault engine pod',mirror([(.19,.05),(.42,.03),(.48,.63),(.21,.74)],s),-.17,.29,2)
            vent(s*.39,-.47); drive(s*.34,.75,.14)
    elif role == 'broadside':
        keel(.49,-.68,.64)
        for s in [-1,1]:
            panel('Casemate block',mirror([(.36,-.59),(.75,-.53),(.77,.48),(.35,.60)],s),-.21,.40,0)
            for z in [-.4,.16]:
                panel('Casemate roof',mirror([(.41,z),(.67,z),(.67,z+.23),(.41,z+.27)],s),.20,.05,3)
            drive(s*.4,.71,.13)
    else:
        ring('Foundry armored drum',.57,-.14,.20,0,n=12)
        for i in range(3):
            a=i*math.tau/3
            panel('Radial armored buttress',f.radial_poly([(-.19,-.25),(.19,-.25),(.24,-.80),(-.24,-.80)],a),-.15,.31,1)
            panel('Furnace cap',f.radial_poly([(-.14,-.43),(.14,-.43),(.17,-.69),(-.17,-.69)],a),.17,.04,3)
        core(.25,.02,.34)

def chapter_four(role):
    # Leviathan: naval spine, independent sponsons and inset silver flight decks.
    if role == 'sniper':
        keel(.24,-.87,.90)
        for s in [-1,1]:
            panel('Long-range nacelle',mirror([(.17,-.31),(.39,-.51),(.48,.60),(.29,.87),(.16,.46)],s),-.14,.22,0)
            panel('Spotter deck',mirror([(.22,-.2),(.32,-.26),(.38,.55),(.24,.59)],s),.09,.05,3)
            drive(s*.30,.86)
    elif role == 'skirmisher':
        keel(.25,-.76,.56)
        for s in [-1,1]:
            panel('Canard',mirror([(.14,-.44),(.55,-.59),(.48,-.27),(.18,-.16)],s),-.12,.14,3)
            panel('Escort wing',mirror([(.16,.07),(.74,-.04),(.60,.47),(.22,.64)],s),-.15,.24,0)
            panel('Escort insignia',mirror([(.30,.15),(.56,.10),(.46,.32),(.29,.39)],s),.10,.04,3)
            drive(s*.24,.66,.12)
    elif role == 'broadside':
        keel(.30,-.84,.85)
        for s in [-1,1]:
            panel('Independent gun sponson',mirror([(.38,-.57),(.71,-.64),(.80,-.32),(.75,.57),(.37,.65)],s),-.14,.28,0)
            tube('Sponson bridge',(s*.16,-.06,0),(s*.63,-.06,0),.15,2,sides=6)
            panel('Battery deck',mirror([(.44,-.44),(.65,-.43),(.67,.42),(.43,.46)],s),.15,.035,3)
            drive(s*.21,.87,.11)
    else:
        keel(.26,-.6,.68)
        ring('Radar race',.54,-.10,.09,2,n=32)
        for i in range(3):
            a=i*math.tau/3
            panel('Sensor boom',f.radial_poly([(-.10,-.2),(.10,-.2),(.26,-.67),(.2,-.84),(-.2,-.84),(-.26,-.67)],a),-.10,.21,0)
            panel('Sensor array',f.radial_poly([(-.11,-.57),(.11,-.57),(.14,-.74),(-.14,-.74)],a),.12,.04,3)
        core(.18,.0,.39)

def chapter_five(role):
    # Cathedral: split archways, suspended central channel, ornate but broad ivory plates.
    if role == 'sniper':
        keel(.13,-.83,.63)
        for s in [-1,1]:
            panel('Oracle arch',mirror([(.12,-.60),(.49,-.72),(.58,-.26),(.32,.58),(.13,.76),(.28,-.15)],s),-.13,.22,0)
            panel('Ivory arch cap',mirror([(.23,-.51),(.42,-.56),(.46,-.25),(.29,.24),(.34,-.19)],s),.10,.055,3)
            drive(s*.17,.77)
    elif role == 'skirmisher':
        keel(.15,-.62,.48)
        for s in [-1,1]:
            panel('Seraph outer quill',mirror([(.18,-.28),(.78,-.82),(.64,-.10),(.24,.52)],s),-.14,.22,0)
            panel('Seraph inner quill',mirror([(.29,.13),(.75,-.13),(.61,.56),(.19,.74)],s),-.12,.18,3)
            tube('Quill energy channel',(s*.38,.10,-.14),(s*.61,.10,-.51),.027,4)
            drive(s*.20,.73)
    elif role == 'broadside':
        ring('Reliquary oval seat',.40,-.13,.13,1,n=20)
        for s in [-1,1]:
            panel('Reliquary flanking arch',mirror([(.21,-.67),(.62,-.55),(.78,0),(.62,.55),(.21,.67),(.42,0)],s),-.16,.33,0)
            panel('Ivory flanking crest',mirror([(.33,-.49),(.52,-.4),(.64,0),(.52,.4),(.33,.49),(.49,0)],s),.18,.04,3)
        core(.19,.0,.40)
    else:
        ring('Astrolabe outer toroid',.71,-.12,.095,3,n=36)
        ring('Astrolabe inner toroid',.34,.04,.065,2,n=24)
        for i in range(3):
            a=i*math.tau/3
            panel('Astrolabe crown',f.radial_poly([(-.12,-.22),(.12,-.22),(.27,-.68),(0,-.95),(-.27,-.68)],a),-.12,.23,0)
            panel('Ivory crown tip',f.radial_poly([(-.13,-.54),(.13,-.54),(0,-.83)],a),.12,.06,3)
        core(.18,.03,.43)

def mounts(key,role):
    if role == 'broadside':
        return [dict(role=f'muzzle_side_{s}_{i}',position=[s*1.03,.32,z],direction=[s,0,0],group=key) for s in [-1,1] for i,z in enumerate([-.26,.26])]
    if role == 'spiral':
        return [dict(role=f'muzzle_radial_{i}',position=[math.sin(i*math.tau/3)*1.03,.34,-math.cos(i*math.tau/3)*1.03],direction=[math.sin(i*math.tau/3),0,-math.cos(i*math.tau/3)],group='radial_rotor') for i in range(3)]
    return [dict(role='muzzle_front',position=[0,.32,-1.27 if role=='sniper' else -.97],direction=[0,0,-1],group=key)]

def clip_polygon(points,z,keep_lower):
    result=[]
    for a,b in zip(points,points[1:]+points[:1]):
        ina=a[1]<=z if keep_lower else a[1]>=z
        inb=b[1]<=z if keep_lower else b[1]>=z
        if ina: result.append(a)
        if ina!=inb:
            t=(z-a[1])/(b[1]-a[1]);result.append((a[0]+t*(b[0]-a[0]),z))
    return result

def craftsmanship(chapter,role):
    # Broad armor breaks and recessed seams remain legible at gameplay scale.
    armor=[o for o in bpy.data.objects if o.type=='MESH' and o.active_material==f.M[3] and len(o.data.vertices)<=24]
    for o in armor:
        n=len(o.data.vertices)//2
        points=[(v.co.x,-v.co.y) for v in list(o.data.vertices)[:n]]
        lo=min(z for x,z in points);hi=max(z for x,z in points)
        if hi-lo<.28: continue
        bottom=min(v.co.z for v in o.data.vertices);height=max(v.co.z for v in o.data.vertices)-bottom
        middle=lo+(hi-lo)*.52
        bpy.data.objects.remove(o,do_unlink=True)
        for lower in [True,False]:
            part=clip_polygon(points,middle+(-.014 if lower else .014),lower)
            if len(part)<3:continue
            panel('Separate service armor',part,bottom,height,3)
        # A single dark service recess, with one energy status light.
        center=sum(x for x,z in points)/len(points)
        if role!='spiral':
            x=center;z=middle+(hi-lo)*.19;y=bottom+height+.006
            panel('Inset service pocket',[(x-.045,z-.065),(x+.045,z-.065),(x+.045,z+.065),(x-.045,z+.065)],y,.009,1)
            tube('Service indicator',(x,y+.013,z-.035),(x,y+.013,z+.020),.012,4,sides=4)
    if role=='broadside':
        panel('Bow armor',[(-.16,-.64),(.16,-.64),(.22,-.26),(0,-.14),(-.22,-.26)],.045,.065,3)
        panel('Bridge pedestal',[(-.20,.0),(.20,.0),(.17,.45),(-.17,.45)],.055,.18,1)
        panel('Bridge forward glass',[(-.13,.045),(.13,.045),(.11,.18),(-.11,.18)],.24,.025,4)
        panel('Bridge roof',[(-.15,.21),(.15,.21),(.12,.38),(-.12,.38)],.24,.055,0)
        vent(0,.43,.20)
    elif role in ('sniper','skirmisher'):
        # Framed rear avionics and paired power conduits physically join the gun to its reactor.
        panel('Avionics collar',[(-.12,.37),(.12,.37),(.14,.61),(-.14,.61)],.03,.14,2)
        vent(0,.40,.16)
        for side in [-1,1]:
            tube('Gun power conduit',(side*.105,.09,-.42),(side*.105,.09,.30),.022,2,sides=6)
        if chapter==2:
            for side in [-1,1]:
                # Thin upright fin changes the side silhouette without obscuring the wing planform.
                fin=panel('Swept tail fin',[(side*.23,.33),(side*.29,.38),(side*.29,.62),(side*.23,.64)],.10,.22,0)
        if chapter==5:
            for side in [-1,1]:
                tube('Reliquary raised arch',(side*.28,.10,.28),(side*.13,.43,.48),.035,3,sides=6)
                tube('Reliquary crown',(side*.13,.43,.48),(0,.48,.37),.032,2,sides=6)
    else:
        for i in range(3):
            a=i*math.tau/3
            x,z=math.sin(a)*.42,-math.cos(a)*.42
            tube('Emitter capacitor seat',(x,.10,z),(x,.17,z),.105,1,sides=10)
            tube('Emitter capacitor',(x,.17,z),(x,.205,z),.077,4,sides=10)
    # Larger bevels on the receivers/nacelles were modeled directly; these edge
    # fasteners are grouped with existing materials, never separate draw calls.
    if role!='spiral':
        for side in [-1,1]:
            tube('Rear armor lock',(side*.11,.06,.57),(side*.11,.20,.57),.035,2,sides=6)

def fittings(key,role):
    if role in ('sniper','skirmisher'):
        front=-1.27 if role=='sniper' else -.97
        tube('Continuous gun cradle',(0,.12,-.28),(0,.12,front+.24),.13,1,sides=8)
        tube('Barrel heat jacket',(0,.32,-.40),(0,.32,front+.12),.075,2,sides=10)
        for z in [-.40,-.57,-.74] if role=='sniper' else [-.42]:
            tube('Capacitor band',(0,.32,z+.02),(0,.32,z-.02),.087,4,sides=10)
        panel('Cockpit surround',[(-.12,.05),(.12,.05),(.10,.41),(-.10,.41)],.06,.13,1)
        panel('Inset command visor',[(-.08,.08),(.08,.08),(.06,.30),(-.06,.30)],.20,.025,4)
    if role=='broadside':
        for s in [-1,1]:
            for z in [-.26,.26]:
                tube('Continuous lateral trunnion',(s*.46,.17,z),(s*.79,.25,z),.11,2,sides=8)
    groups=f.sockets(key)
    if role=='spiral':
        rotor=groups['radial_rotor']
        tube('Rotor central bearing',(0,-.06,0),(0,.20,0),.26,1,sides=16)
        for i in range(3):
            a=i*math.tau/3
            tube('Rotor support spoke',(math.sin(a)*.20,.23,-math.cos(a)*.20),(math.sin(a)*.77,.23,-math.cos(a)*.77),.065,2,rotor,sides=8)

def sentinel():
    # Static star and front battery sit below the rotating radial guns.
    ring('Star foundation',.63,-.22,.15,1)
    for i in range(5):
        a=i*math.tau/5
        panel('Star arm',f.radial_poly([(-.22,-.32),(.22,-.32),(.24,-.58),(0,-1.05),(-.24,-.58)],a),-.32,.17,0)
        panel('Star inset armor',f.radial_poly([(-.12,-.40),(.12,-.40),(.13,-.59),(0,-.88),(-.13,-.59)],a),-.14,.055,3)
    tube('Central structural drum',(0,-.25,0),(0,.20,0),.42,1,sides=20)
    ring('Radial race support',.64,.12,.085,2)
    for i in range(10):
        a=i*math.tau/10
        tube('Load bearing spoke',(math.sin(a)*.36,.12,-math.cos(a)*.36),(math.sin(a)*.64,.12,-math.cos(a)*.64),.055,2,sides=6)
    # Wide continuous crescent supports all five fixed forward receivers.
    for i in range(5):
        a=(i-2)*.28
        panel('Forward gun foundation',f.radial_poly([(-.10,-.62),(.10,-.62),(.10,-.98),(-.10,-.98)],a),-.26,.13,1)
        tube('Forward gun lock',(math.sin(a)*.94,-.13,-math.cos(a)*.94),(math.sin(a)*.94,-.06,-math.cos(a)*.94),.10,2,sides=8)
    core(.28,.19,.34)
    f.sockets('boss')

def shard():
    keel(.22,-.34,.39,-.18,.22)
    panel('Left fracture',[(-.15,-.37),(-.48,-.20),(-.44,.19),(-.21,.39),(-.06,.19)],-.14,.30,2)
    panel('Right fracture',[(.02,-.29),(.24,-.43),(.47,-.12),(.35,.27),(.16,.35)],-.13,.27,0)
    panel('Left reflective facet',[(-.19,-.23),(-.36,-.12),(-.32,.16),(-.17,.26)],.17,.035,3)
    panel('Right reflective facet',[(.15,-.19),(.28,-.27),(.35,-.10),(.25,.12)],.15,.035,3)
    tube('Readable fissure',(-.06,.18,-.23),(.02,.18,.22),.041,4,sides=6)
    f.sockets('miniasteroid')

if __name__ == '__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    catalog={}
    for chapter,build in enumerate([chapter_one,chapter_two,chapter_three,chapter_four,chapter_five],1):
        for i,role in enumerate(roles):
            key=f'c{chapter}_{role}'
            entry=dict(name=names[chapter][i],chapter=chapter,fleetRole=role,url=f'/models/enemies/{key}.glb',sockets=mounts(key,role))
            catalog[key]=entry;f.CAT[key]=entry
            if args and key not in args: continue
            f.start(key,chapter);build(role);craftsmanship(chapter,role);fittings(key,role)
            f.save(key,ROOT/'public'/entry['url'].lstrip('/'));f.render(key)
    (ROOT/'app/data/tacticalFleetCatalog.js').write_text('// Generated by Blender: scripts/build-tactical-fleet.py\nexport const TACTICAL_FLEET = '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    for key,build in [('boss',sentinel),('miniasteroid',shard)]:
        if args and key not in args: continue
        f.start(key,1);build();f.save(key,ROOT/'public'/f.CAT[key]['url'].lstrip('/'));f.render(key)
    # Existing filenames are shared with previous builds. A hash invalidates only
    # the changed GLB instead of asking players to clear their browser cache.
    base_catalog={k:v for k,v in f.CAT.items() if k not in catalog}
    for key,entry in base_catalog.items():
        path=ROOT/'public'/entry['url'].lstrip('/')
        entry['revision']=hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    (ROOT/'app/data/enemyFleetCatalog.js').write_text('// Generated from Blender export manifests.\nexport const ENEMY_FLEET = '+json.dumps(base_catalog,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')

    import subprocess
    subprocess.run(['node',str(ROOT/'scripts/version-chapter-fleets.mjs')],check=True)
