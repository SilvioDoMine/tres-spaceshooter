import bpy, pathlib, math
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
roles=['ufo','ufofast','kamikaze','asteroid','miniHarpy','miniHive','torusEnemy','compositeEnemy','miniasteroid','miniboss','hiveDrone']
gray=bpy.data.materials.new('Neutral silhouette');gray.diffuse_color=(.48,.5,.53,1)
for row,chapter in enumerate(range(2,6)):
 for col,role in enumerate(roles):
  before=set(bpy.data.objects)
  bpy.ops.import_scene.gltf(filepath=str(ROOT/f'public/models/enemies/c{chapter}_{role}.glb'))
  objs=set(bpy.data.objects)-before
  for o in objs:
   if o.type=='MESH':o.data.materials.clear();o.data.materials.append(gray)
   if not o.parent:o.location+=Vector((col*3,-row*3,0))
  bpy.ops.object.text_add(location=(col*3-1.2,-row*3-1.35,.0));o=bpy.context.object;o.data.body=f'{chapter} / {role}';o.data.size=.21
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.07,.085,.11,1)
bpy.ops.object.camera_add(location=(15,-4.5,40));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=33;scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(12,-1,14));bpy.context.object.data.energy=9500;bpy.context.object.data.size=23
scene.render.resolution_x=2420;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.filepath=str(ROOT/'art/enemies/revision/distinct-silhouettes.png');bpy.ops.render.render(write_still=True)
