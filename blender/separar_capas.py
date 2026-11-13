"""Separa el interior fundido del JAC 6 en piezas independientes para el showroom.

Uso (headless, no modifica el archivo de entrada):
  blender -b --factory-startup JAC_6_PHEV.blend --python blender/separar_capas.py -- <salida.blend>

Coordenadas Blender del modelo: frente hacia -Y, arriba +Z, conductor (LHD) en +X.
Las piezas se reconocen por "islas" (partes sueltas) de Carroceria y la caja/volumen
donde cae cada isla completa: nunca se corta una isla por la mitad.
"""
import bpy, bmesh, sys
import numpy as np
from mathutils import Vector, Matrix

OUT = sys.argv[sys.argv.index('--') + 1]
EXTERIOR = {'Pintura', 'Parabrisas', 'Cristal', 'Cristal_faro', 'Cristal_techo',
            'Faro_luz', 'Piloto', 'Piloto_luz', 'Matricula'}

# --- nombres limpios -------------------------------------------------------
for o in bpy.data.objects:
    if o.name.endswith('.002'):
        o.name = o.name[:-4]
body = bpy.data.objects['Carroceria']


def islands(o):
    """Etiqueta de isla por cara + centroides de cara en espacio mundo."""
    me = o.data
    nv, nf = len(me.vertices), len(me.polygons)
    co = np.empty(nv * 3, np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    M = np.array(o.matrix_world, np.float32); co = co @ M[:3, :3].T + M[:3, 3]
    ls = np.empty(nf, np.int32); me.polygons.foreach_get('loop_start', ls)
    lt = np.empty(nf, np.int32); me.polygons.foreach_get('loop_total', lt)
    lv = np.empty(len(me.loops), np.int32); me.loops.foreach_get('vertex_index', lv)
    ed = np.empty(len(me.edges) * 2, np.int32); me.edges.foreach_get('vertices', ed); ed = ed.reshape(-1, 2)
    lab = np.arange(nv)
    while True:
        m = np.minimum(lab[ed[:, 0]], lab[ed[:, 1]])
        new = lab.copy(); np.minimum.at(new, ed[:, 0], m); np.minimum.at(new, ed[:, 1], m)
        for _ in range(6): new = new[new]
        if np.array_equal(new, lab): break
        lab = new
    cent = sum(co[lv[ls + np.minimum(k, lt - 1)]] for k in range(3)) / 3
    return lab[lv[ls]], cent


flab, cent = islands(body)
mi = np.empty(len(body.data.polygons), np.int32); body.data.polygons.foreach_get('material_index', mi)
mats = [s.material.name if s.material else '' for s in body.material_slots]
ext_idx = np.array([m in EXTERIOR for m in mats])
uniq, inv = np.unique(flab, return_inverse=True)
lo = np.full((len(uniq), 3), np.inf); hi = np.full((len(uniq), 3), -np.inf)
np.minimum.at(lo, inv, cent); np.maximum.at(hi, inv, cent)
ccent = np.zeros((len(uniq), 3)); np.add.at(ccent, inv, cent); ccent /= np.bincount(inv)[:, None]
has_ext = np.zeros(len(uniq), bool); np.logical_or.at(has_ext, inv, ext_idx[mi])
# material dominante por isla
dom = np.zeros(len(uniq), int)
counts = np.zeros((len(uniq), len(mats)), int); np.add.at(counts, (inv, mi), 1); dom = counts.argmax(1)
dom_name = np.array(mats)[dom]
size = np.bincount(inv)


def in_box(x0, x1, y0, y1, z0, z1):
    return ((lo[:, 0] >= x0) & (hi[:, 0] <= x1) & (lo[:, 1] >= y0) & (hi[:, 1] <= y1)
            & (lo[:, 2] >= z0) & (hi[:, 2] <= z1))


free = ~has_ext
# El emblema del volante y el cristal de la pantalla usan Cristal/Cristal_faro: en esas
# dos piezas solo se descarta pintura y parabrisas.
paint = np.zeros(len(uniq), bool)
np.logical_or.at(paint, inv, np.array([m in ('Pintura', 'Parabrisas') for m in mats])[mi])
glass_ok = ~paint
assign = {}

# Volante: disco inclinado. Centro y normal medidos sobre el aro (islas de Cuero_negro).
C = np.array([0.39, -0.51, 1.136]); N = np.array([0.0, 0.838, 0.545])
d = ccent - C; ax = d @ N; rad = np.linalg.norm(d - ax[:, None] * N, axis=1)
diag = np.linalg.norm(hi - lo, axis=1)
volante = glass_ok & (rad <= 0.215) & (ax >= -0.07) & (ax <= 0.09) & (diag < 0.45)
assign['Volante'] = volante; free &= ~volante; glass_ok &= ~volante

# Pantalla: panel doble (cluster + multimedia) sobre el tablero, plano y ~ -0.74.
pantalla = glass_ok & in_box(-0.22, 0.60, -0.82, -0.66, 1.09, 1.30)
assign['Pantalla'] = pantalla; free &= ~pantalla

# Asientos (caja completa de cada isla dentro del volumen del asiento).
# Fuera: alfombra, guarnecido de pilares/techo (Techo_interior) y, en los delanteros,
# lo que está delante y por encima del cojín (palancas de la columna).
no_seat = (dom_name == 'Tela_negra') | (dom_name == 'Techo_interior')
column = (lo[:, 1] < -0.45) & (hi[:, 2] > 0.9)
for name, box, extra in [
        ('Asiento_conductor', (0.135, 0.76, -0.70, 0.42, 0.34, 1.56), ~column),
        ('Asiento_copiloto', (-0.76, -0.115, -0.70, 0.42, 0.34, 1.56), ~column),
        ('Asientos_traseros', (-0.74, 0.74, 0.44, 1.50, 0.34, 1.40), np.abs(ccent[:, 0]) <= 0.70)]:
    s = free & in_box(*box) & ~no_seat & extra
    assign[name] = s; free &= ~s

# Tablero y consola central: lo que queda del bloque delantero de cabina, sin alfombra
# ni limpiaparabrisas (piezas finas por fuera del cristal, al pie del parabrisas).
wipers = ((ccent[:, 1] < -1.10) & (ccent[:, 2] > 1.13) & (ccent[:, 2] < 1.21)
          & (dom_name == 'Plastico_negro') & ((hi[:, 1] - lo[:, 1]) < 0.12))
# El suelo empieza en z ~0.37: las tiras del piso bajo los pedales se quedan en la carrocería.
tablero = (free & in_box(-0.74, 0.74, -1.25, 0.44, 0.30, 1.32) & ~wipers & (hi[:, 2] >= 0.37)
           & (dom_name != 'Tela_negra') & (dom_name != 'Techo_interior'))
assign['Tablero'] = tablero; free &= ~tablero


def split(src, face_mask, name, pivot=None):
    """Mueve las caras marcadas de src a un objeto nuevo con la misma transformación."""
    me = src.data.copy(); me.name = name
    bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not face_mask[f.index]], context='FACES')
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); ob.matrix_world = src.matrix_world.copy()
    for c in src.users_collection: c.objects.link(ob)
    if pivot is not None:  # mover el origen sin mover la geometría
        P = ob.matrix_world.inverted() @ Vector(pivot)
        me.transform(Matrix.Translation(-P)); ob.matrix_world = ob.matrix_world @ Matrix.Translation(P)
    print(f'{name}: {len(me.polygons)} caras')
    return ob


def remove(src, face_mask):
    bm = bmesh.new(); bm.from_mesh(src.data); bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if face_mask[f.index]], context='FACES')
    bm.to_mesh(src.data); bm.free()


taken = np.zeros(len(mi), bool)
for name, isl in assign.items():
    fm = isl[inv]
    if not fm.any():
        raise SystemExit(f'{name}: 0 caras; revisar volúmenes')
    pivot = C if name == 'Volante' else (lo[isl].min(0) + hi[isl].max(0)) / 2
    split(body, fm, name, pivot)
    taken |= fm
remove(body, taken)
print(f'Carroceria restante: {len(body.data.polygons)} caras')

# Cauchos: caras de Neumatico/Neumatico_flanco de cada rueda -> hijo de la rueda.
for side in ('DD', 'DI', 'TD', 'TI'):
    r = bpy.data.objects[f'Rueda_{side}']
    rm = [s.material.name if s.material else '' for s in r.material_slots]
    idx = np.empty(len(r.data.polygons), np.int32); r.data.polygons.foreach_get('material_index', idx)
    fm = np.isin(np.array(rm)[idx], ['Neumatico', 'Neumatico_flanco'])
    c = split(r, fm, f'Caucho_{side}')
    remove(r, fm)
    c.parent = r; c.matrix_parent_inverse = r.matrix_world.inverted()

bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
print('guardado', OUT)
