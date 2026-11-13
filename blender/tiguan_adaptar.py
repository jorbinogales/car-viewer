"""Adapta el VW Tiguan 2025 al esquema de piezas del Car Viewer (los mismos nodos que el JAC 6).

Uso (headless, no modifica la entrada):
  blender -b --factory-startup --python blender/tiguan_adaptar.py -- blender/nuevo/tiguan/tiguan_my25.glb Tiguan_capas.blend

El modelo ya viene en metros y con las piezas separadas y nombradas (EXT_DOOR_FL, INT_DOOR_FL,
EXT_TRUNK_LID, ALUMINUM_19_FL, BRAKE_FL, INT_STEERING_WHEEL...), con el origen de cada puerta
y del portón en su bisagra. Aquí solo se:
  - gira 180° (el original mira hacia -Z de glTF; el visor espera el frente en +Z y el
    conductor en +X, como el JAC 6),
  - quitan las animaciones (el visor abre las puertas con sus propios pivotes),
  - unen las mallas de cada pieza en un nodo con el nombre del JAC 6 y el origen en su bisagra
    o centro,
  - separan por islas completas los tres asientos (vienen en un grupo) y el tablero (viene
    dentro del interior general). Nunca se corta una isla.
Coordenadas Blender de salida: frente hacia -Y, arriba +Z, conductor (LHD) en +X, suelo en z = 0.
"""
import math
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

GLB, OUT = sys.argv[sys.argv.index('--') + 1:]
R = Matrix.Rotation(math.pi, 4, 'Z')
SIDE = {'FL': 'DI', 'FR': 'DD', 'RL': 'TI', 'RR': 'TD'}  # tras el giro, la izquierda (FL) queda en +X
TABLERO_MATS = ('Int#Material_Atlas', 'Int#Leather', 'Int#Trim', 'Int#Plastic', 'Int#Speaker', 'Int#Stitches',
                'Int#Ambilight_TiguanMY25_Cockpit', 'Int_Center#Ambilight', 'Int#Interior_Glow', 'Int#Fabric')
TECHO = {'Ext_Sun_Roof#Sun_Roof_0', 'Ext_Sun_Roof#Sun_Roof_1', 'Ext#Window_Top', 'Int#Windows_Tinted'}

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
bpy.ops.import_scene.gltf(filepath=GLB)
for o in bpy.data.objects:
    o.animation_data_clear()
# Los airbags vienen "plegados" para su animación de despliegue y asoman por el tablero y el
# techo (manchas blancas): en el coche real no se ven, así que se quitan.
for o in [o for o in bpy.data.objects if o.name.startswith('Int_Airbag_')]:
    bpy.data.objects.remove(o)
bpy.context.view_layer.update()
world = {o.name: (R @ o.matrix_world).copy() for o in bpy.data.objects}


def pos(name):
    return world[name].translation.copy()


pivots = {'Porton': pos('EXT_TRUNK_LID'), 'Volante': pos('INT_STEERING_WHEEL')}
for src, dst in SIDE.items():
    pivots[f'Puerta_{dst}'] = pos(f'EXT_DOOR_{src}')
    pivots[f'Rueda_{dst}'] = pivots[f'Caucho_{dst}'] = pivots[f'Pinza_{dst}'] = pos(f'ALUMINUM_19_{src}')


def ancestors(o):
    out = set()
    while o.parent:
        o = o.parent
        out.add(o.name)
    return out


def group_of(o):
    n, anc = o.name, ancestors(o)
    for src, dst in SIDE.items():
        if f'EXT_DOOR_{src}' in anc or f'INT_DOOR_{src}' in anc:
            return f'Puerta_{dst}'
        if f'ALUMINUM_19_{src}' in anc:
            return f'Caucho_{dst}' if '#Tire' in n else f'Rueda_{dst}'
        if f'BRAKE_{src}' in anc:
            return f'Pinza_{dst}'
    if anc & {'EXT_TRUNK_LID', 'INT_TRUNK_LID'}:
        return 'Porton'
    if 'INT_STEERING_WHEEL' in anc:
        return 'Volante'
    if n.startswith('Int#IP_Screen'):
        return 'Pantalla'
    if n in TECHO:
        return 'Techo_cristal'
    if 'BRAKE_REAR' in anc:
        return '_frenos_traseros'
    # INT_CUPHOLDER es el apoyabrazos con posavasos de la banca trasera.
    if anc & {'INT_SEATS', 'INT_CUPHOLDER'}:
        return '_asientos'
    if 'INT_BODY' in anc and n.startswith(TABLERO_MATS):
        return '_tablero_candidato'
    return 'Carroceria'


# --- hornear la transformación mundial (ya girada) y agrupar ---------------------------
groups = {}
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    if o.data.users > 1:
        o.data = o.data.copy()
    groups.setdefault(group_of(o), []).append(o)
    o.data.transform(world[o.name])
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    o.parent = None
    o.matrix_world = Matrix.Identity(4)
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)


def join(name, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = ob.data.name = name
    return ob


parts = {name: join(name, objs) for name, objs in groups.items()}


# --- separar por islas -----------------------------------------------------------------
def islands(o):
    """Por cara: etiqueta de isla (índice compacto) y centroide; por isla: caja y centro."""
    me = o.data
    nv, nf = len(me.vertices), len(me.polygons)
    co = np.empty(nv * 3, np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    ls = np.empty(nf, np.int32); me.polygons.foreach_get('loop_start', ls)
    lt = np.empty(nf, np.int32); me.polygons.foreach_get('loop_total', lt)
    lv = np.empty(len(me.loops), np.int32); me.loops.foreach_get('vertex_index', lv)
    ed = np.empty(len(me.edges) * 2, np.int32); me.edges.foreach_get('vertices', ed); ed = ed.reshape(-1, 2)
    lab = np.arange(nv)
    while True:
        m = np.minimum(lab[ed[:, 0]], lab[ed[:, 1]])
        new = lab.copy(); np.minimum.at(new, ed[:, 0], m); np.minimum.at(new, ed[:, 1], m)
        for _ in range(6):
            new = new[new]
        if np.array_equal(new, lab):
            break
        lab = new
    cent = sum(co[lv[ls + np.minimum(j, lt - 1)]] for j in range(3)) / 3
    _, inv = np.unique(lab[lv[ls]], return_inverse=True)
    k = inv.max() + 1
    lo = np.full((k, 3), np.inf); hi = np.full((k, 3), -np.inf)
    np.minimum.at(lo, inv, cent); np.maximum.at(hi, inv, cent)
    cc = np.zeros((k, 3)); np.add.at(cc, inv, cent); cc /= np.bincount(inv)[:, None]
    return inv, lo, hi, cc


def split(src, face_mask, name):
    """Objeto nuevo con las caras marcadas de src (todo en coordenadas mundo)."""
    m2 = src.data.copy(); m2.name = name
    bm = bmesh.new(); bm.from_mesh(m2); bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not face_mask[f.index]], context='FACES')
    bm.to_mesh(m2); bm.free()
    ob = bpy.data.objects.new(name, m2)
    for col in src.users_collection:
        col.objects.link(ob)
    return ob


def split_all(src, masks):
    """Reparte TODAS las caras de src entre las piezas de `masks` (nombre -> máscara por cara)."""
    out = {name: split(src, fm, name + '_tmp') for name, fm in masks.items() if fm.any()}
    bpy.data.objects.remove(src)
    return out


# Asientos: la fila delantera termina antes de y = 0.22; el lado lo da el centro de la isla.
src = parts.pop('_asientos')
inv, lo, hi, cc = islands(src)
front = hi[:, 1] <= 0.22
new = split_all(src, {'Asiento_conductor': (front & (cc[:, 0] > 0))[inv],
                      'Asiento_copiloto': (front & (cc[:, 0] <= 0))[inv],
                      'Asientos_traseros': (~front)[inv]})
parts.update({k: join(k, [v]) for k, v in new.items()})

# Frenos traseros: un grupo para los dos lados.
src = parts.pop('_frenos_traseros')
inv, lo, hi, cc = islands(src)
new = split_all(src, {'Pinza_TI': (cc[:, 0] > 0)[inv], 'Pinza_TD': (cc[:, 0] <= 0)[inv]})
parts.update({k: join(k, [v]) for k, v in new.items()})

# Tablero: islas completas del salpicadero (por delante de y = -0.25) o de la consola central;
# los guarnecidos de pilares y umbrales vuelven a la carrocería.
src = parts.pop('_tablero_candidato')
inv, lo, hi, cc = islands(src)


def inside(x0, x1, y0, y1, z0, z1):
    return (lo[:, 0] >= x0) & (hi[:, 0] <= x1) & (lo[:, 1] >= y0) & (hi[:, 1] <= y1) & (lo[:, 2] >= z0) & (hi[:, 2] <= z1)


box = inside(-0.80, 0.80, -1.15, -0.25, 0.25, 1.32) | inside(-0.30, 0.30, -0.60, 0.40, 0.25, 1.00)
new = split_all(src, {'_tab': box[inv], '_resto': (~box)[inv]})
parts['Tablero'] = join('Tablero', [new['_tab']])
parts['Carroceria'] = join('Carroceria', [parts['Carroceria'], new['_resto']])


# --- orígenes ------------------------------------------------------------------------------
def set_origin(ob, p):
    ob.data.transform(Matrix.Translation(-p))
    ob.matrix_world = Matrix.Translation(p)


for name, ob in parts.items():
    if name == 'Carroceria':
        continue
    p = pivots.get(name)
    if p is None:  # centro de su caja
        co = np.empty(len(ob.data.vertices) * 3, np.float32); ob.data.vertices.foreach_get('co', co)
        co = co.reshape(-1, 3); p = Vector(((co.min(0) + co.max(0)) / 2).tolist())
    set_origin(ob, p)
    print(f'{name}: {len(ob.data.polygons)} caras, origen {np.round(np.array(p), 3)}')
print(f"Carroceria: {len(parts['Carroceria'].data.polygons)} caras")

# Neumáticos como hijos de su rueda, con transformación identidad (igual que el JAC 6).
for s in SIDE.values():
    c, r = parts[f'Caucho_{s}'], parts[f'Rueda_{s}']
    c.parent = r
    c.matrix_parent_inverse = r.matrix_world.inverted()

bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
print('guardado', OUT)
