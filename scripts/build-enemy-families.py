"""Blender --background --factory-startup --python scripts/build-enemy-families.py.
Hardpoints remain in gameplay coordinates; geometry is batched by material and pivot.
"""
import bpy, json, math, pathlib, sys, shutil
from mathutils import Vector

ROOT = pathlib.Path(__file__).resolve().parents[1]
CAT = json.loads((ROOT/'app/data/enemyFleetCatalog.js').read_text(encoding='utf-8').split('export const ENEMY_FLEET = ')[1].rstrip(';\n\r'))
OUT = ROOT/'art/enemies/revision'
OUT.mkdir(parents=True, exist_ok=True)
TAU = math.tau
P = None
M = []

def xyz(p): return Vector((p[0], -p[2], p[1]))
def empty(name, parent=None):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); o.parent=parent; return o
def material(name, color, glow=False):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    s=m.node_tree.nodes.get('Principled BSDF'); s.inputs['Base Color'].default_value=(*color,1)
    s.inputs['Metallic'].default_value=.38; s.inputs['Roughness'].default_value=.42
    if glow:
        s.inputs['Emission Color'].default_value=(*color,1); s.inputs['Emission Strength'].default_value=1.6
    return m
def start(name, chapter):
    global P,M
    bpy.ops.wm.read_factory_settings(use_empty=True)
    P=empty(name)
    palettes={1:((.32,.045,.09),(.95,.15,.2)),2:((.34,.08,.18),(1,.26,.48)),3:((.24,.27,.28),(1,.13,.045)),4:((.045,.13,.24),(.10,.7,1)),5:((.20,.075,.34),(.68,.3,1))}
    armor,energy=palettes[chapter]
    M=[material('Armor',armor),material('Chassis',(.022,.032,.048)),material('Titanium',(.3,.4,.48)),material('Identification',(.67,.73,.75)),material('Energy',energy,True)]
    return P
def finish(o,name,mat,parent=None):
    o.name=name; o.data.materials.append(M[mat]); o.parent=parent or P; return o
def plate(name,pts,bottom,thick,mat=0,parent=None):
    # Inset upper face gives broad readable bevels, with no stacked coplanar panels.
    n=len(pts); cx=sum(p[0] for p in pts)/n; cz=sum(p[1] for p in pts)/n
    verts=[xyz((x,bottom,z)) for x,z in pts]+[xyz((cx+(x-cx)*.92,bottom+thick,cz+(z-cz)*.92)) for x,z in pts]
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o)
    # Recalculate winding for mirrored wings too.
    bpy.context.view_layer.objects.active=o; o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT'); o.select_set(False)
    return finish(o,name,mat,parent)
def tube(name,a,b,r,mat=1,parent=None,r2=None,sides=10):
    a,b=xyz(a),xyz(b); d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=sides,radius1=r,radius2=r if r2 is None else r2,depth=d.length,location=(a+b)/2)
    o=bpy.context.object; o.rotation_euler=d.to_track_quat('Z','Y').to_euler(); o.select_set(False)
    return finish(o,name,mat,parent)
def ring(name,r,y,width,mat=2,parent=None,n=40):
    pts=[]; verts=[]; faces=[]
    for i in range(n):
        a=TAU*i/n
        for rr,yy in [(r-width,y-width*.5),(r+width,y-width*.5),(r+width,y+width*.5),(r-width,y+width*.5)]: verts.append(xyz((math.sin(a)*rr,yy,-math.cos(a)*rr)))
    for i in range(n):
        for j in range(4): faces.append((i*4+j,i*4+(j+1)%4,((i+1)%n)*4+(j+1)%4,((i+1)%n)*4+j))
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o); return finish(o,name,mat,parent)
def radial_poly(points,a): return [(x*math.cos(a)-z*math.sin(a), x*math.sin(a)+z*math.cos(a)) for x,z in points]
def core(r,y,h):
    tube('Reactor armored pedestal',(0,y,0),(0,y+h*.55,0),r,1,r2=r*.8,sides=12)
    tube('Reactor',(0,y+h*.55,0),(0,y+h,0),r*.62,4,r2=r*.4,sides=12)
    ring('Containment',r*.84,y+h*.56,r*.1,3)
def hull(w,l,y=-.2,h=.25,mat=0):
    return plate('Hull',[(-w*.65,-l), (w*.65,-l),(w,-l*.4),(w,l*.65),(w*.6,l),(-w*.6,l),(-w,l*.65),(-w,-l*.4)],y,h,mat)
def sockets(type):
    groups={type:P}
    for s in CAT[type]['sockets']:
        group=s.get('group') or type
        if group not in groups: groups[group]=empty(group,P)
        p=Vector(s['position']); d=Vector(s['direction']); parent=groups[group]
        o=empty(s['role'],parent); o.location=xyz(p); o['role']=s['role']
        o.rotation_euler=xyz(d).to_track_quat('Y','Z').to_euler()
        if s['role'].startswith('muzzle'):
            # Rear trunnion, tapered receiver and barrel terminate at the original socket.
            length=.26 if type!='chapter4Boss' else .4
            a=p-d*length
            tube('Receiver',a,p-d*.09,.085,1,parent,r2=.055)
            tube('Barrel',p-d*.13,p,.04,2,parent)
            tube('Emitter aperture',p-d*.004,p,.027,4,parent)
            radial=group in ('ring_rotor','radial_rotor','radial_emitter','beam_rotor')
            if radial:
                radius=math.hypot(a.x,a.z)
                # A full rotating load-bearing rim under every radial battery.
                key='support_'+group
                if key not in groups:
                    ring('Battery bearing',radius,a.y-.07,.065,1,parent)
                    ring('Bearing trim',radius,a.y-.025,.023,2,parent)
                    groups[key]=parent
            else:
                # Keel ribs tie outboard hardpoints to the hull, below the barrel bore.
                inner=Vector((a.x*.38,a.y-.13,a.z*.68))
                tube('Weapon outrigger',inner,a-Vector((0,.06,0)),.085,0,parent,sides=6)
            tube('Weapon saddle',a-Vector((0,.13,0)),a,.08,2,parent,sides=8)
        elif s['role'].startswith('engine'):
            tube('Engine nacelle',p-d*.34,p-d*.02,.115,1,parent,r2=.14,sides=12)
            tube('Engine lip',p-d*.065,p,.145,2,parent,sides=12)
            tube('Exhaust',p-d*.004,p,.105,4,parent,sides=12)
            tube('Engine strut',(p.x*.55,p.y,p.z-.34),p-d*.25,.12,0,parent,sides=6)
    return groups

def sentinel():
    hull(.48,.65,-.24,.25)
    ring('Load bearing star ring',.67,-.04,.13,1)
    ring('Star shoulder',.67,.03,.055,2)
    for i in range(5):
        a=i*TAU/5
        plate('Integrated star arm',radial_poly([(-.25,-.35),(.25,-.35),(.18,-.83),(0,-1.10),(-.18,-.83)],a),-.18,.25)
        plate('Star armor',radial_poly([(-.13,-.46),(.13,-.46),(.10,-.77),(0,-.92),(-.10,-.77)],a),.09,.09,3)
    core(.36,.07,.48)

def leviathan():
    hull(.73,2.20,-.36,.40)
    plate('Armored bow',[(-.68,-.8),(.68,-.8),(.43,-1.85),(0,-2.6),(-.43,-1.85)],-.14,.30)
    plate('Flight deck',[(-.4,-1.48),(.4,-1.48),(.46,1.70),(-.46,1.70)],.08,.16,2)
    for s in [-1,1]:
        plate('Sponson structural spine',[(s*.55,-1.42),(s*1.2,-1.04),(s*1.4,.0),(s*1.35,1.54),(s*.54,1.90)],-.28,.40)
        # Three battery bays, each housing two cannons; wide spacing reads as grouped armament.
        for z in [-.56,.24,1.04]:
            plate('Paired armored casemate',[(s*.9,z-.35),(s*1.51,z-.29),(s*1.51,z+.30),(s*.9,z+.35)],-.03,.27,2)
            plate('Casemate roof',[(s*.96,z-.27),(s*1.35,z-.22),(s*1.35,z+.22),(s*.96,z+.27)],.245,.06,0)
        plate('Hangar shoulder',[(s*.50,.18),(s*.79,.34),(s*.79,1.68),(s*.50,1.80)],.20,.25)
        for z in [.55,1.0,1.45]: tube('Hangar signal',(s*.69,.46,z-.10),(s*.69,.46,z+.10),.02,4)
    plate('Bridge foundation',[(-.38,.48),(.38,.48),(.34,1.44),(-.34,1.44)],.26,.28,1)
    plate('Bridge armored crown',[(-.38,.65),(.38,.65),(.26,1.29),(-.26,1.29)],.54,.28)
    plate('Bridge panoramic visor',[(-.30,.64),(.30,.64),(.27,.76),(-.27,.76)],.82,.035,4)
    tube('Comms mast',(0,.80,1.13),(0,1.08,1.13),.045,2)

def geode():
    ring('Fragment collar',.57,-.12,.17,1)
    for i in range(4):
        a=i*TAU/4+math.pi/4
        plate('Geode fractured armor',radial_poly([(-.14,-.26),(.14,-.26),(.35,-.64),(.22,-.94),(-.22,-.87),(-.32,-.61)],a),-.25,.31,0)
        plate('Geode crown',radial_poly([(-.09,-.42),(.11,-.39),(.21,-.63),(.10,-.79),(-.17,-.66)],a),.075,.13,2)
    ring('Ring turntable foundation',.84,.01,.085,0)
    core(.20,.04,.28)

def ram():
    hull(.47,.85,-.25,.25)
    for s in [-1,1]:
        plate('Ram reinforced prong',[(s*.15,.5),(s*.53,.38),(s*.47,-.95),(s*.34,-1.34),(s*.22,-.85)],-.16,.27)
        plate('Ram blade',[(s*.23,-.25),(s*.43,-.31),(s*.35,-1.16)],.13,.09,3)
    core(.22,.02,.26)

def hammer():
    hull(.28,.83,-.22,.24,1)
    plate('Hammer transverse hull',[(-.81,-.67),(-.64,-.87),(.64,-.87),(.81,-.67),(.75,-.19),(-.75,-.19)],-.17,.25)
    for s in [-1,1]:
        plate('Hammer cheek',[(s*.28,-.68),(s*.65,-.69),(s*.69,-.28),(s*.29,-.21)],.11,.12,2)
    core(.17,.04,.22)

ROLES=['ufo','ufofast','kamikaze','asteroid','miniHarpy','miniHive','torusEnemy','compositeEnemy','miniasteroid','miniboss']
def batch():
    bins={}
    for o in list(bpy.data.objects):
        if o.type=='MESH': bins.setdefault((o.parent.name if o.parent else '',o.active_material.name),[]).append(o)
    for (parent,mat),items in bins.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in items:o.select_set(True)
        bpy.context.view_layer.objects.active=items[0]; bpy.ops.object.join(); bpy.context.object.name=parent+' / '+mat
    bpy.ops.object.select_all(action='DESELECT')
def save(key,path):
    batch()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(key+'.blend')))
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
    shutil.copy2(path,OUT/(key+'.glb'))
    print('MODEL',key,'triangles',sum(len(o.data.polygons) for o in bpy.data.objects if o.type=='MESH'),flush=True)
def render(key):
    scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=16
    scene.render.resolution_x=640; scene.render.resolution_y=640; scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('Studio'); scene.world.use_nodes=True; scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.075,.095,.14,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
    meshes=[o for o in scene.objects if o.type=='MESH']; points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
    radius=max(max(abs(p.x),abs(p.y)) for p in points)
    bpy.ops.object.camera_add(location=(radius*.65,-radius*1.35,radius*3.6)); cam=bpy.context.object
    cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=radius*2.65; scene.camera=cam
    for loc,power,color,size in [((2,1,5),550,(.77,.86,1),4),((-3,-2,3),420,(1,.75,.60),3)]:
        bpy.ops.object.light_add(type='AREA',location=Vector(loc)*max(1,radius*.6)); light=bpy.context.object;light.data.energy=power*max(1,radius**2*.4);light.data.color=color;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/(key+'.png'));bpy.ops.render.render(write_still=True)

if __name__=='__main__':
    only=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    for key,chapter,build in [('boss',1,sentinel),('chapter4Boss',4,leviathan),('chapter5Boss',5,None),('asteroidBoss',5,geode),('kamikazeBoss',3,ram),('miniboss',4,hammer)]:
        if only and key not in only:continue
        if key=='chapter5Boss':
            import runpy
            runpy.run_path(str(ROOT/'scripts/restore-flower-boss.py'),run_name='__main__')
            continue
        start(key,chapter);build();sockets(key)
        save(key,ROOT/'public'/CAT[key]['url'].lstrip('/'));render(key)
    # The legacy common-chassis generator is retired.
    import runpy
    runpy.run_path(str(ROOT/'scripts/build-distinct-fleets.py'),run_name='__main__')


