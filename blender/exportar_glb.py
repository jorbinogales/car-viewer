"""Exporta el JAC 6 por capas a GLB para la web (Draco + WebP), incluidos accesorios ocultos.

  blender -b --factory-startup JAC_6_PHEV_capas.blend --python blender/exportar_glb.py -- <salida.glb>
"""
import bpy, sys

out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.export_scene.gltf(
    filepath=out, export_format='GLB',
    use_visible=False, use_renderable=False, use_selection=False,  # los Acc_* están ocultos
    export_yup=True, export_apply=False,
    export_cameras=False, export_lights=False, export_animations=False,
    export_tangents=False, export_extras=True,
    export_image_format='WEBP', export_image_quality=88,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=16, export_draco_normal_quantization=12,
    export_draco_texcoord_quantization=14,
)
print('exportado', out)
