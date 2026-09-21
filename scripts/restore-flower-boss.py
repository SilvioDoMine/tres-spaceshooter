"""Restore the authored flower, preserving its petals and animated hardpoints."""
import bpy, pathlib, importlib.util, sys
sys.dont_write_bytecode=True
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('fleet',ROOT/'scripts/build-enemy-families.py'); f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art/enemies/frota-03/chapter5Boss_catedral.blend'))
for o in list(bpy.data.objects):
    if o.type in ('CAMERA','LIGHT'): bpy.data.objects.remove(o,do_unlink=True)
f.P=bpy.data.objects['chapter5Boss']
f.M=[f.material('Flower bearing titanium',(.25,.32,.4))]
# Low bearing races support the moving gun assemblies without changing petals.
for group,radius,height in [('radial_rotor',2.44,.13),('beam_rotor',.69,.97)]:
    parent=bpy.data.objects[group]
    f.ring('Continuous gun bearing',radius,height,.038,0,parent,n=64)
    for socket in f.CAT['chapter5Boss']['sockets']:
        if socket.get('group')!=group or not socket['role'].startswith('muzzle'):continue
        p=socket['position'];d=socket['direction'];r=(p[0]**2+p[2]**2)**.5
        f.tube('Gun bearing saddle',(d[0]*radius,height,d[2]*radius),(d[0]*radius,p[1]-.04,d[2]*radius),.035,0,parent,sides=8)
# Source artist geometry is kept, including petals, ribs, hangars and the reactor.
# Batch within each animation pivot, never across a rotating/static boundary.
f.save('chapter5Boss',ROOT/'public/models/enemies/chapter5Boss_catedral.glb')
f.render('chapter5Boss')

