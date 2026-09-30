# Roadmap canónico — Too Many Types 2 Showdown

**Única fuente de verdad del backlog de implementación.** Aprobado el 2026-09-30.
Las tareas se siguen en este archivo, con IDs estables TMT-01…TMT-12. No crear
planes alternativos, nuevos chats ni issues sin solicitud. Actualizar aquí estado,
prerrequisitos, decisiones y enlaces a evidencia; una propuesta histórica no autoriza
saltar dependencias. Las instrucciones vigentes del usuario prevalecen.

Esto sustituye las propuestas de WORK_ITEMS.md y el antiguo «next slice» de
DEVELOPMENT.md, **no** las políticas de arquitectura, seguridad, licencias, pruebas
ni la evidencia histórica. Mantener tres repositorios independientes y hermanos.
Los callbacks de combate se escriben a mano en el servidor; los hechos compartidos
se generan desde datos verificados para ambos forks. COORD-1 está terminado y
fusionado en [PR #1](https://github.com/matiHirCab/tmt2-data/pull/1); no forma parte
de estos doce tickets.

## Alcance y forma de seguimiento

Primer formato sugerido: singles privado, no clasificado, con equipos prefijados.
**Es una propuesta competitiva**, no una regla demostrada del ROM. Nivel y tamaño
de equipo se deciden en TMT-02; no inferir 3v3 de una actividad de postgame.
Fuera del MVP: catálogo completo, ladder aleatoria, torneos y rediseño visual.
Publicar una beta o desplegarla requiere autorización separada.

Estados: **pendiente**, **en progreso**, **parcial/bloqueado**, **implementado local
(pendiente CI remoto)**, **terminado**. «Terminado» exige toda la DoD y evidencia,
no sólo código. Los resultados parciales no desbloquean automáticamente sucesores.
No convertir una hipótesis, descripción, CRC o nombre de archivo en un hecho ROM.

| Etapa | Ticket | Prerrequisitos | Estado actual |
| --- | --- | --- | --- |
| 1 | [TMT-01](#tmt-01--registrar-fuentes-y-versión) | Ninguno | Terminado: input registrado; mecánicas pendientes en TMT-02 |
| 1 | [TMT-02](#tmt-02--reglas-y-casos-de-referencia) | TMT-01 | Pendiente |
| 1 | [TMT-03](#tmt-03--ci-reproducible) | Independiente | Implementado local; pendiente CI remoto |
| 2 | [TMT-04](#tmt-04--semilla-verificada-y-esquema) | TMT-01, TMT-02 | Pendiente |
| 2 | [TMT-05](#tmt-05--mod-formato-oculto-y-dex-cliente-integrados) | TMT-04 | Pendiente |
| 2 | [TMT-06](#tmt-06--mecánicas-semilla-no-evs-y-legalidad) | TMT-05 | Pendiente |
| 2 | [TMT-07](#tmt-07--primer-combate-privado-de-dos-jugadores) | TMT-03, TMT-06 | Pendiente |
| 3 | [TMT-08](#tmt-08--megas-y-cambios-de-tipo-verificados) | TMT-06 | Pendiente |
| 3 | [TMT-09](#tmt-09--ampliar-catálogo-mvp) | TMT-06; TMT-08 cuando aplique | Pendiente |
| 3 | [TMT-10](#tmt-10--teambuilder-y-equipos-realmente-legales) | TMT-09 | Pendiente |
| 4 | [TMT-11](#tmt-11--regresión-de-fidelidad-y-aislamiento) | TMT-07, TMT-08, TMT-10 | Pendiente |
| 4 | [TMT-12](#tmt-12--beta-reproducible) | TMT-11 + gate de derechos/proveniencia | Pendiente |

## Etapa 1 — Fundamentos verificables

### TMT-01 — Registrar fuentes y versión

**Prerrequisitos:** ninguno. **Estado:** terminado (registro de fuentes/entrada).
Registrar fuentes oficiales, versión, permisos, hashes y base. Inspeccionar BPS
cuando esté disponible, sin descargar/aplicar ROMs ni confundir un parche binario
con una base de datos de especies o mecánicas.

**DoD:** identidad SHA-256/tamaño del BPS recibido, cabecera/tráiler y CRC del parche
verificados, metadatos de origen/base registrados con sus límites; inventario
separado de hechos verificados, pendientes e hipótesis; ningún binario no aprobado
en Git. El CRC de salida esperado no demuestra que se haya producido/verificado
un ROM de salida. El BPS tampoco resuelve por sí solo todas las reglas de TMT-02.

**Evidencia:** [registro de fuentes](../provenance/SOURCES.md),
[registro estructurado](../provenance/sources.json),
[verificación de etapa 1](STAGE_1_VALIDATION.md).
**Entrada recibida:** BPS v1.5.2, dos variantes v1.4.0 y readme adjuntos en este
mismo chat el 2026-09-30. SHA-256, estructura y CRC de los tres parches verificados
sin aplicar ROMs; ver [inspección](../provenance/PATCH_INSPECTION.md). SRC-05 fija el
input v1.5.2 por sus bytes. Autenticidad de release, derechos y mecánicas quedan
explícitamente desconocidos; sus límites no se resuelven por el nombre o CRC.

### TMT-02 — Reglas y casos de referencia

**Prerrequisitos:** TMT-01. **Estado:** pendiente; no elegir generación todavía.
Definir casos mínimos de stats, no EVs, tipos ordenados/repetidos, STAB,
efectividad/inmunidades, efectos y formas. Elegir base Showdown por evidencia de
reglas y compatibilidad, **no** por ser GBA/Emerald. Separar reglas ROM de decisiones
competitivas (singles, nivel, tamaño de equipo, cláusulas y equipos prefijados).

**DoD:** matriz regla → fuente/oráculo → caso esperado, generación justificada y
decisiones competitivas explícitas; faltantes que impiden la semilla identificados.
No marcar completo con conjeturas sobre STAB duplicado, un cuarto tipo o pasivas.
**Evidencia:** pendiente; decisiones abiertas en [SOURCES.md](../provenance/SOURCES.md).

### TMT-03 — CI reproducible

**Prerrequisitos:** independiente de BPS/TMT-01/TMT-02. **Estado:** implementado local; pendiente primera ejecución remota.
Fijar revisiones compatibles de los forks, Node/npm y acciones; instalar por
lockfile; ejecutar tests/typechecks/lint y coordinación. Separar explícitamente
pruebas de red no deterministas de las comprobaciones ordinarias sin declararlas
aprobadas. No pulls upstream silenciosos, secretos ni permisos de escritura.

**DoD:** workflow revisable, pins verificados, instalación limpia y comandos locales
reproducibles; pruebas de fallos/limpieza/manifiesto; exclusiones exactas documentadas;
primera ejecución remota del commit autorizadamente publicado inspeccionada y sin
fallos genuinos ocultos. Extender con datos/mecánicas cuando existan, no ahora.
**Evidencia:** [CI](CI.md), [pins](../ci/pins.json),
[workflow](../.github/workflows/ci.yml), [validación](STAGE_1_VALIDATION.md).
**Pendiente externo:** no publicar ni ejecutar Actions remoto en esta autorización.

## Etapa 2 — Primer combate de semilla

### TMT-04 — Semilla verificada y esquema

**Prerrequisitos:** TMT-01 y TMT-02. **Estado:** pendiente.
**DoD:** 6–10 especies para dos equipos prefijados y todos sus movimientos,
habilidades e ítems; stats y dependencias con evidencia; tipos como secuencias
ordenadas que preservan duplicados. Esquema y validaciones rechazan referencias
rotas o desconocidos presentados como hechos; fixtures de prueba etiquetados aparte.
**Evidencia:** pendiente; no existe catálogo de producción importado.

### TMT-05 — Mod, formato oculto y Dex cliente integrados

**Prerrequisitos:** TMT-04. **Estado:** pendiente.
**DoD:** formato oculto/mod y cliente consumen el mismo catálogo/versión; generación
local determinista con inputs fijados; `Dex.forFormat`, tablas, búsqueda y selección
de formato usan el mod correcto. Pruebas detectan fallback al Dex base. Cambiar una
URL de upstream no basta; no pipeline dependiente sólo de datos Smogon.
**Evidencia:** pendiente; no ejecutar la antigua propuesta INTEGRATION-1 por separado.

### TMT-06 — Mecánicas semilla, no EVs y legalidad

**Prerrequisitos:** TMT-05. **Estado:** pendiente.
**DoD:** semilla jugable con pruebas de daño, inmunidades, STAB y efectos requeridos;
no EVs aplicado/verificado; servidor rechaza elecciones no soportadas. Preservar
arrays permanentes de tipos; no reemplazar el motor de daño ni usar `addedType`
transitorio como tercer tipo permanente. Callbacks escritos a mano, nunca de prosa.
**Evidencia:** pendiente.

### TMT-07 — Primer combate privado de dos jugadores

**Prerrequisitos:** TMT-03 y TMT-06. **Estado:** pendiente.
**DoD:** dos navegadores independientes eligen premades, se desafían y finalizan
un combate con resultados consistentes; replay reproducible en cliente compatible.
Registrar versiones, pasos y resultados. HTTP/WS READY no cumple esta DoD.
**Evidencia:** pendiente; checks de infraestructura previos no son combate TMT2.

## Etapa 3 — Ampliación verificada

### TMT-08 — Megas y cambios de tipo verificados

**Prerrequisitos:** TMT-06. **Estado:** pendiente.
**DoD:** al menos una mega verificada; pruebas de cambios, resets, formas y tipos
temporales. Oráculo explícito para duplicados y cuarto tipo; excluir comportamientos
no verificados del formato. Holy/Bird/Bird no autoriza inferir su fórmula de STAB.
**Evidencia:** pendiente; observación documental en registro, semántica pendiente.

### TMT-09 — Ampliar catálogo MVP

**Prerrequisitos:** TMT-06; TMT-08 cuando se incluyan sus comportamientos.
**Estado:** pendiente.
**DoD:** 10–20 especies/formas, 15–30 movimientos y habilidades/ítems/learnsets
dependientes verificados; cada adición con referencias y pruebas de comportamiento.
No completar huecos copiando defaults de Showdown sin evidencia.
**Evidencia:** pendiente.

### TMT-10 — Teambuilder y equipos realmente legales

**Prerrequisitos:** TMT-09. **Estado:** pendiente.
**DoD:** búsqueda por cualquiera de los tres tipos, tooltips de stats/ítems/
habilidades/movimientos correctos, import/export probado, sin manipulación de EVs,
equipos legales aceptados y errores de servidor claros para los ilegales.
**Evidencia:** pendiente; un selector visible no equivale a equipos legales.

## Etapa 4 — Fidelidad y beta

### TMT-11 — Regresión de fidelidad y aislamiento

**Prerrequisitos:** TMT-07, TMT-08 y TMT-10. **Estado:** pendiente.
**DoD:** casos oráculo, combates/replays reproducibles y flujos de navegador en CI
desde instalación limpia; formatos Showdown ajenos intactos. Fallos, exclusiones y
límites se reportan explícitamente, sin convertir baseline fallido en aprobado.
**Evidencia:** pendiente.

### TMT-12 — Beta reproducible

**Prerrequisitos:** TMT-11 y aprobación de derechos/proveniencia de datos/assets.
**Estado:** pendiente.
**DoD:** fijar tres commits + dataset + assets; docs de instalación, límites y
rollback; instalación nueva completa un combate. Resolver licencia/redistribución
antes de incluir material no aprobado. Despliegue público fuera de esta DoD y con
autorización separada.
**Evidencia:** pendiente; todavía no existe beta TMT2 ni permiso de publicación nueva.
