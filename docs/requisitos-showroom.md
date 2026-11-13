# Requisitos del showroom 360 (texto original del cliente, 2026-11-13)

Actúa como desarrollador senior especializado en aplicaciones web 3D, diseño de interfaces automotrices y Three.js.

Construye desde cero una aplicación web funcional para explorar y configurar mi vehículo 3D personalizado, con sus piezas independientes.

Referencias:
- Experiencia de exploración: https://nomad-camper-studio.vercel.app/
- Identidad y presentación automotriz: https://jacvenezuela.com/

Inspecciona las referencias si tienes acceso. Si alguna no carga, indícalo y continúa con los requisitos siguientes. No inventes detalles sobre las referencias.

Quiero una experiencia de showroom automotriz elegante, en blanco y negro, con el vehículo como protagonista. Entrega código funcional, no solo una propuesta visual.

## 1. Tecnología y alcance
Utiliza:
- React con TypeScript y Vite.
- Three.js mediante React Three Fiber.
- Drei para controles, carga de modelos y utilidades.
- Zustand para el estado del configurador.
- CSS adaptable con variables de diseño.
- Iconos de líneas simples y coherentes.

Comprueba la compatibilidad entre las versiones instaladas.
La primera versión debe funcionar sin backend. Modelos, piezas, materiales y opciones deben definirse mediante un archivo de configuración tipado.
Toda la interfaz estará en español.

## 2. Dirección visual
Diseña una interfaz monocromática:
- Fondo principal blanco o gris muy claro.
- Texto principal negro.
- Texto secundario gris.
- Bordes finos y discretos.
- Botones principales negros con texto blanco.
- Botones secundarios blancos con borde oscuro.
- Selección activa mediante contraste, borde e icono de confirmación.
- Sin acentos de colores, neón, degradados decorativos ni efectos de cristal.

Usa tipografía sans serif moderna, títulos claros y suficiente espacio en blanco.
La interfaz debe sentirse como un configurador de vehículos de una marca automotriz. Evita el aspecto de dashboard administrativo.
Usa el logotipo JAC únicamente si se encuentra disponible entre los archivos proporcionados. En caso contrario, utiliza un encabezado tipográfico provisional.
La paleta monocromática corresponde a la interfaz. Conserva los materiales y colores originales del vehículo, salvo que el usuario cambie una opción de pintura.

## 3. Distribución de pantalla
Escritorio:
- Encabezado compacto, de aproximadamente 64 px.
- Marca a la izquierda.
- Nombre del vehículo y versión.
- Acciones "Restablecer" y "Pantalla completa".
- Visor 3D ocupando la mayor parte del área disponible.
- Panel derecho de aproximadamente 340–380 px.
- Barra inferior discreta con vistas predefinidas.
- Ayuda inicial: "Arrastra para girar · Usa la rueda para acercarte".

El panel lateral tendrá tres secciones: Explorar, Personalizar, Piezas.

Móvil:
- Visor amplio en la parte superior.
- Panel inferior plegable con contenido desplazable.
- Controles táctiles cómodos.
- Evitar que el panel tape el vehículo.
- Separar correctamente los gestos de interacción 3D y el desplazamiento del panel.

El vehículo debe aparecer completo y bien encuadrado desde la primera carga, en vista de tres cuartos frontal.

## 4. Carga de mi modelo real
Admite dos formas de integración:
- Un GLB que contenga el vehículo con sus piezas como nodos independientes.
- Un GLB principal y archivos GLB adicionales para accesorios o piezas.

Centraliza sus rutas y metadatos en una configuración.
No construyas un vehículo genérico con cubos para sustituir mi modelo. Si los archivos faltan, muestra un estado claro indicando dónde incorporarlos.

Incluye:
- Estado de carga.
- Progreso real cuando esté disponible; indicador indeterminado cuando no pueda calcularse.
- Mensaje de error comprensible.
- Botón para reintentar.
- Tratamiento de modelos vacíos o archivos incompatibles.

Respeta geometría, UV, normales, texturas, jerarquía y proporciones.
No centres ni escales cada pieza de forma independiente: esto puede desarmar el vehículo. Aplica el ajuste global sobre un contenedor común.
Para archivos separados, respeta sus coordenadas compartidas o utiliza transformaciones y puntos de montaje definidos explícitamente.

## 5. Exploración 3D
Implementa:
- Rotación orbital de 360°.
- Zoom con límites calculados a partir del tamaño del vehículo.
- Desplazamiento limitado.
- Controles táctiles.
- Restablecer cámara.
- Pantalla completa cuando el navegador la soporte.
- Rotación automática opcional, detenida al interactuar.

Incluye vistas: Tres cuartos frontal, Frente, Parte trasera, Lateral izquierdo, Lateral derecho, Superior.
Cada cambio de vista debe interpolar suavemente la posición de cámara y su objetivo.
Calcula el encuadre considerando las dimensiones del modelo, la relación de aspecto y el espacio ocupado por la interfaz.
Evita atravesar el suelo o introducir accidentalmente la cámara en la carrocería durante el modo exterior.
La vista interior solo estará disponible si el modelo contiene interior y existen posiciones de cámara configuradas.

## 6. Selección e inspección de piezas
Permite seleccionar piezas desde la lista del panel y con un clic o toque sobre el modelo.
Distingue un clic de un arrastre para que girar el vehículo no seleccione piezas accidentalmente.

Al seleccionar una pieza:
- Resáltala con un contorno sutil.
- Muestra nombre y descripción.
- Permite enfocar la cámara.
- Permite ocultarla o volver a mostrarla.
- Permite aislarla temporalmente.
- Ofrece "Mostrar todo" para recuperar el conjunto.

No cambies permanentemente los materiales para representar la selección.
Relaciona los meshes con identificadores estables y grupos semánticos. Una puerta puede estar formada por varios meshes y debe seleccionarse como una sola pieza.
No dependas de índices frágiles como children[3].
Si el modelo no tiene nombres útiles, incorpora una herramienta de desarrollo para inspeccionar la jerarquía y crear un mapeo explícito. No muestres nombres técnicos en la interfaz comercial.
Si el archivo contiene una única malla sin separación, explica que la selección independiente requiere preparar el modelo. No simules que sus piezas ya están separadas.

## 7. Personalización
Ofrece únicamente opciones respaldadas por los recursos disponibles: pintura de carrocería, variantes de rines, accesorios, visibilidad de componentes opcionales.
Cambiar pintura debe afectar solo los materiales configurados como pintura. Conserva cristales, neumáticos, ópticas, logotipos, plásticos y metales.
Clona materiales compartidos cuando sea necesario para evitar cambios involuntarios.
Las variantes de una misma categoría serán mutuamente excluyentes. Conserva correctamente su escala, orientación y montaje.
No inventes precios, versiones comerciales, especificaciones ni compatibilidades. Si falta un dato, omítelo o identifícalo como pendiente en la configuración.

## 8. Animaciones y despiece
Habilita apertura de puertas, capó o maletero únicamente cuando existan: piezas independientes; pivotes y ejes correctos, o clips de animación apropiados; límites de apertura definidos.
No hagas girar una puerta alrededor del centro de su geometría.
Si no existe preparación suficiente, deja la función fuera de la interfaz y documenta lo necesario para activarla.

Incluye vista de despiece solo para los grupos configurados:
- Control de intensidad entre 0 y 100 %.
- Direcciones y distancias por grupo.
- Transiciones suaves.
- Restauración exacta de las transformaciones originales.
- Conservación de las relaciones entre piezas y subpiezas.
No acumules desplazamientos en cada actualización.

## 9. Iluminación y materiales
Crea un estudio virtual con: fondo claro y limpio; suelo discreto; sombras suaves de contacto; iluminación ambiental y reflejos amplios que permitan leer el volumen; entorno de iluminación local o con alternativa disponible si falla su carga.
La carrocería debe conservar sus aristas y detalles. Ajusta iluminación, exposición y materiales para evitar superficies quemadas o reflejos que oculten las formas.
Diferencia visualmente pintura, goma, plástico, vidrio y metal.
No apliques suavizado de geometría, subdivisión ni modificaciones automáticas para "corregir" el modelo. Si la malla está deformada, identifica la limitación: la iluminación no sustituye una reparación geométrica.
Evita bloom excesivo y posprocesado costoso sin una mejora visible.

## 10. Configuración y estado
Diseña un esquema tipado que permita definir: identificador y nombre del vehículo; ruta del modelo; orientación y escala global; grupos de piezas y rutas de nodos; materiales de pintura; variantes y accesorios; transformaciones y puntos de montaje; pivotes y límites de apertura; vistas de cámara; descripciones y puntos informativos; vectores de despiece.
Guarda en localStorage únicamente preferencias y configuración serializable, nunca objetos Three.js.
Versiona el estado guardado y valida sus identificadores para que una configuración antigua no rompa una nueva versión del modelo.
Incluye "Restablecer configuración".

## 11. Arquitectura
Separa al menos: estructura general de la aplicación; visor y escena; carga y composición del vehículo; controlador de cámara; selección de piezas; panel de personalización; lista de piezas; controles de vistas; estados de carga y error; estado global; configuración y tipos del vehículo.
Mantén independientes la lógica de negocio, la interfaz y los objetos 3D.
Documenta dónde colocar los archivos y cómo registrar una nueva pieza sin reescribir el visor.

## 12. Rendimiento y accesibilidad
- Evita cargar varias veces el mismo recurso.
- Mantén referencias estables.
- Evita actualizaciones de React en cada frame.
- Renderiza bajo demanda cuando la escena esté en reposo, manteniendo activas las transiciones y animaciones necesarias.
- Ajusta resolución y sombras a las capacidades del dispositivo.
- Configura los decodificadores necesarios si los modelos usan compresión.
- Gestiona correctamente recursos y limpieza sin destruir objetos compartidos.
- Muestra una alternativa comprensible cuando no exista soporte gráfico.
- Usa botones accesibles, foco visible y etiquetas.
- Permite seleccionar piezas y vistas mediante controles de interfaz, además del canvas.
- Respeta la preferencia de movimiento reducido.

## 13. Criterios de aceptación
Verifica que:
- El modelo real carga sin perder materiales ni piezas.
- Se encuadra correctamente en escritorio y móvil.
- Girar, acercar y cambiar vistas funciona.
- Seleccionar una pieza sincroniza visor y panel.
- Ocultar, aislar y restaurar piezas funciona.
- La pintura solo cambia las superficies previstas.
- Las variantes conservan su montaje.
- Las funciones sin recursos preparados no aparecen como disponibles.
- Restablecer recupera cámara, visibilidad y configuración.
- Los errores de recursos no dejan una pantalla vacía.
- El proyecto compila y no produce errores durante el flujo principal.

Realiza comprobaciones de los flujos principales y pruebas específicas del mapeo de piezas, las variantes y la restauración de transformaciones.

## 14. Entrega
Entrega: aplicación implementada; archivos organizados; configuración de ejemplo claramente identificada; instrucciones para ejecutar y compilar; instrucciones para incorporar mi GLB y mis piezas; lista concreta de recursos faltantes y funciones que dependen de ellos; resumen de las comprobaciones realizadas.

Empieza revisando los archivos existentes. Después construye primero la carga del modelo, la cámara y la selección de piezas; continúa con personalización, animaciones preparadas y acabado visual.
Toma decisiones razonables y avanza sin detenerte por detalles menores. Pregunta únicamente cuando falte información que impida integrar correctamente mis recursos.
El resultado debe ser un showroom web monocromático, elegante y funcional, donde pueda explorar mi vehículo real y sus componentes.
