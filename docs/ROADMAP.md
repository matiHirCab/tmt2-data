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

Primer formato aprobado 2026-09-30: singles privado, no clasificado, dos equipos
prefijados de 3, nivel50, IV31 y EV0. **Decisión competitiva del usuario**,
no regla demostrada del ROM ni inferencia del postgame.
Fuera del MVP: catálogo completo, ladder aleatoria, torneos y rediseño visual.
Publicar una beta o desplegarla requiere autorización separada.

Estados: **pendiente**, **en progreso**, **parcial/bloqueado**, **implementado local
(pendiente CI remoto)**, **terminado**. «Terminado» exige toda la DoD y evidencia,
no sólo código. Los resultados parciales no desbloquean automáticamente sucesores.
No convertir una hipótesis, descripción, CRC o nombre de archivo en un hecho ROM.

| Etapa | Ticket | Prerrequisitos | Estado actual |
| --- | --- | --- | --- |
| 1 | [TMT-01](#tmt-01--registrar-fuentes-y-versión) | Ninguno | Terminado: input registrado; fidelidad ROM no demostrada |
| 1 | [TMT-02](#tmt-02--reglas-y-casos-de-referencia) | TMT-01 | Terminado: adaptación y formato aprobados |
| 1 | [TMT-03](#tmt-03--ci-reproducible) | Independiente | Terminado: primera CI remota verificada |
| 2 | [TMT-04](#tmt-04--semilla-verificada-y-esquema) | TMT-01, TMT-02 | Completado: seed acotado de adaptación, esquema y validación |
| 2 | [TMT-05](#tmt-05--mod-formato-oculto-y-dex-cliente-integrados) | TMT-04 | Terminado: tres PRs fusionados, CI remota verificada |
| 2 | [TMT-06](#tmt-06--mecánicas-semilla-no-evs-y-legalidad) | TMT-05 | Terminado: PRs fusionados y CI remota verificada |
| 2 | [TMT-07](#tmt-07--primer-combate-privado-de-dos-jugadores) | TMT-03, TMT-06 | Parcial: recorrido nativo automatizado y QA visual/replay con originales verificados; revisión del usuario pendiente |
| 3 | [TMT-08](#tmt-08--megas-y-cambios-de-tipo-verificados) | TMT-06 | Hecho en adaptación aprobada: Mega Pidgeot; CI local completa |
| 3 | [TMT-09](#tmt-09--ampliar-catálogo-mvp) | TMT-06; TMT-08 cuando aplique | Hecho: lote Bird/Crab, 10 especies/formas y 15 movimientos |
| 3 | [TMT-10](#tmt-10--teambuilder-y-equipos-realmente-legales) | TMT-09 | Completado: editor nativo y legalidad |
| 4 | [TMT-11](#tmt-11--regresión-de-fidelidad-y-aislamiento) | TMT-07, TMT-08, TMT-10 | Parcial: regresiones deterministas; navegador CI y revisión visual TMT-07 pendientes |
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

**Prerrequisitos:** TMT-01. **Estado:** terminado bajo adaptación aprobada.
**Decisión de alcance del usuario, 2026-09-30:** formato recomendado aceptado con
«El formato sirve»; usar Showdown explícitamente donde falte evidencia, registrar
las diferencias pendientes y no prometer réplica exacta aceptado con «Si!».
El DoD original abajo se conserva: fuente/caso esperado puede ser regla TMT2
verificada o política de adaptación aprobada respaldada por código fijado y
regresiones, distinguidas. No se exige oráculo mGBA para cerrar este contrato.
Gen9 elegido como padre de ingeniería, no como generación ROM. Las seis filas,
esquema y runtime parity pertenecen a TMT-04…06; sus gates siguen intactos.
Definir casos mínimos de stats, no EVs, tipos ordenados/repetidos, STAB,
efectividad/inmunidades, efectos y formas. Elegir base Showdown por evidencia de
reglas y compatibilidad, **no** por ser GBA/Emerald. Separar reglas ROM de decisiones
competitivas (singles, nivel, tamaño de equipo, cláusulas y equipos prefijados).

**DoD:** matriz regla → fuente/oráculo → caso esperado, generación justificada y
decisiones competitivas explícitas; faltantes que impiden la semilla identificados.
No marcar completo con conjeturas sobre STAB duplicado, un cuarto tipo o pasivas.
**Evidencia:** [RULES_REFERENCE.md](RULES_REFERENCE.md): matriz de generaciones,
REF-01…09, seis candidatos condicionales, controles heredados reproducibles y
contrato mínimo. Casos de mecánicas excluidas no bloquean sets que no las usan,
pero no se declaran resueltos. Definiciones de
pasivas/datos y referencia legítima solicitadas en el mismo chat; no repetir BPS.
Revisión por criterio y expected de la adaptación aprobada en esa evidencia.
No se afirma fidelidad ROM ni se inicia etapa2 por cerrar este ticket.

### TMT-03 — CI reproducible

**Prerrequisitos:** independiente de BPS/TMT-01/TMT-02. **Estado:** terminado: primera ejecución remota verificada en PR #2.
Fijar revisiones compatibles de los forks, Node/npm y acciones; instalar por
lockfile; ejecutar tests/typechecks/lint y coordinación. Separar explícitamente
pruebas de red no deterministas de las comprobaciones ordinarias sin declararlas
aprobadas. No pulls upstream silenciosos, secretos ni permisos de escritura.

**DoD:** workflow revisable, pins verificados, instalación limpia y comandos locales
reproducibles; pruebas de fallos/limpieza/manifiesto; exclusiones exactas documentadas;
primera ejecución remota del commit autorizadamente publicado inspeccionada y sin
fallos genuinos ocultos. Extender con datos/mecánicas cuando existan, no ahora.
**Evidencia:** [CI](CI.md), [pins](../ci/pins.json),
[workflow](../.github/workflows/ci.yml), [validación](STAGE_1_VALIDATION.md#publicación-autorizada-y-ci-remota),
[CI remota aprobada](https://github.com/matiHirCab/tmt2-data/actions/runs/36749458158).
**Pendiente externo:** no publicar ni ejecutar Actions remoto en esta autorización.

## Etapa 2 — Primer combate de semilla

### TMT-04 — Semilla verificada y esquema

**Prerrequisitos:** TMT-01 y TMT-02. **Estado:** completado bajo adaptación aprobada (2026-09-30).
**Alcance aplicado 2026-09-30:** la adaptación aprobada en TMT-02 permite stats,
moves/abilities/items y learnsets ordinarios del servidor fijado, con procedencia
por campo; tipos de especies y overrides custom requieren fuente del creador.
Los tipos se corroboraron en celdas oficiales; pasivas no documentadas usan
política explícita sin callback adicional, como aplicación del fallback Gen9
aprobado, sin afirmar ausencia de pasivos en ROM ni fidelidad exacta.
**DoD:** 6–10 especies para dos equipos prefijados y todos sus movimientos,
habilidades e ítems; stats y dependencias con evidencia; tipos como secuencias
ordenadas que preservan duplicados. Esquema y validaciones rechazan referencias
rotas o desconocidos presentados como hechos; fixtures de prueba etiquetados aparte.
**Evidencia:** `schemas/seed.schema.json`, `tools/data/validate.mjs`,
`normalized/seed.json` (seed v0.1.0 acotado), `provenance/seed-types.json`,
`provenance/seed-chart.json`, `tests/seed.test.mjs` y
[contrato/validación](RULES_REFERENCE.md#tmt-04--esquema-y-semilla-acotada).
El seed seleccionado supera su contrato; fixtures no pueden sustituirlo.
Al cierre de TMT-04 aún no había integración; TMT-05 registra ahora el mod oculto.
No hay catálogo completo ni certificación de mecánicas jugables.

### TMT-05 — Mod, formato oculto y Dex cliente integrados

**Prerrequisitos:** TMT-04. **Estado:** terminado; publicación y merges autorizados.
CI remota [36784022668](https://github.com/matiHirCab/tmt2-data/actions/runs/36784022668)
aprobada. Masters verificados: servidor `8892f27375c0e42c39f09392dbbfe6c56ed7b944`,
cliente `051b1478298cadfcb4e7080805ab84f4a9dfd3f8`, datos
`3f61332acf18ee7b0461f78d41f960491b4552bc`. Los commits fijados fueron preservados
por los merges; sus árboles coinciden, sin squash/rebase ni necesidad de reescritura.
**DoD:** formato oculto/mod y cliente consumen el mismo catálogo/versión; generación
local determinista con inputs fijados; `Dex.forFormat`, tablas, búsqueda y selección
de formato usan el mod correcto. Pruebas detectan fallback al Dex base. Cambiar una
URL de upstream no basta; no pipeline dependiente sólo de datos Smogon.
**Evidencia:** generador/guards `tools/integration/`, `tests/integration.test.mjs`,
commits de ambos forks fijados en `ci/pins.json` y
[contrato/checks de integración](RULES_REFERENCE.md#tmt-05--integracion-local-aislada).
Mismo catálogo/version/hash, checks de drift/base fallback, tablas/búsqueda/Dex,
parser battle/replay, browser local y CI-core. TMT-06/07 permanecen pendientes;
construcción del formato no certifica daño/no-EVs ni un combate terminado.
La antigua propuesta INTEGRATION-1 no se ejecuta por separado.

### TMT-06 — Mecánicas semilla, no EVs y legalidad

**Prerrequisitos:** TMT-05. **Estado:** terminado; CI remota y tres merges verificados.
**DoD:** semilla jugable con pruebas de daño, inmunidades, STAB y efectos requeridos;
no EVs aplicado/verificado; servidor rechaza elecciones no soportadas. Preservar
arrays permanentes de tipos; no reemplazar el motor de daño ni usar `addedType`
transitorio como tercer tipo permanente. Callbacks escritos a mano, nunca de prosa.
**Evidencia:** [contrato y checks TMT-06](RULES_REFERENCE.md#tmt-06--premades-y-runtime-acotado).
Política aplicada: uno de los dos premades completos aprobados; se permite reordenar
miembros y movimientos, no nuevas combinaciones. Gen9 adaptado, sin prometer
fidelidad ROM. La prueba local del simulador no cumple el recorrido de TMT-07.

### TMT-07 — Primer combate privado de dos jugadores

**Prerrequisitos:** TMT-03 y TMT-06. **Estado:** parcial hasta revisión visual del
usuario. El recorrido funcional nativo de dos jugadores se automatizó antes con
cards provisionales. Los16recursos originales están ahora validados e integrados;
dos perfiles independientes verificaron la interfaz y el replay local con ellos,
sin errores de recursos ni fallback remoto. Esta última prueba no repitió un
desafío live, pues no se reactivó la excepción guest. Ver el
[QA con originales](RULES_REFERENCE.md#tmt-07--qa-nativo-con-sprites-originales-2026-10-02).
**DoD:** dos navegadores independientes eligen premades, se desafían y finalizan
un combate con resultados consistentes; replay reproducible en cliente compatible.
Registrar versiones, pasos y resultados. HTTP/WS READY no cumple esta DoD.
**Evidencia:** [corrección nativa TMT-07](RULES_REFERENCE.md#tmt-07--corrección-nativa-verificada-2026-10-01). Dos sesiones browser automatizadas, selección alpha/beta, desafío/aceptación, win consistente y replay local. No playtesting humano ni fidelidad ROM.

## Etapa 3 — Ampliación verificada

### TMT-08 — Megas y cambios de tipo verificados

**Prerrequisitos:** TMT-06. **Estado:** hecho bajo la adaptación aprobada;
CI local completa (2026-10-02). Mega Pidgeot Holy/Bird/Bird y siete defensas Holy
se respaldan en documentación primaria; stats/No Guard/Pidgeotite/timing/STAB
se heredan explícitamente del pin Showdown, no son una réplica ROM demostrada.
**DoD:** al menos una mega verificada; pruebas de cambios, resets, formas y tipos
temporales. Oráculo explícito para duplicados y cuarto tipo; excluir comportamientos
no verificados del formato. Holy/Bird/Bird no autoriza inferir su fórmula de STAB.
**Interpretación de alcance 2026-10-02:** se aplica la adaptación autorizada en TMT-02
(2026-09-30). El oráculo cuarto slot/reemplazo es regresión sintética del motor;
no se habilitan movimientos de cambio de tipo ni se atribuye su comportamiento a ROM.
**Evidencia:** [Mega Pidgeot, fuentes, pruebas y límites](RULES_REFERENCE.md#tmt-08--mega-pidgeot-acotado-y-gate-de-holy-2026-10-02).

### TMT-09 — Ampliar catálogo MVP

**Prerrequisitos:** TMT-06; TMT-08 cuando se incluyan sus comportamientos.
**Estado:** hecho bajo la adaptación aprobada (2026-10-02); nueve bases más
Mega Pidgeot, quince movimientos y premades alpha/beta/gamma. CI local completa
aprobada. Pidgey/Pidgeotto/Krabby conservan la clase transcripción del creador
aportada por el usuario; no se inventa corroboración independiente de esas celdas.
Sprites nuevos y QA visual del dueño siguen pendientes por separado.
**DoD:** 10–20 especies/formas, 15–30 movimientos y habilidades/ítems/learnsets
dependientes verificados; cada adición con referencias y pruebas de comportamiento.
No completar huecos copiando defaults de Showdown sin evidencia.
**Alcance:** conserva la adaptación aprobada en TMT-02: tipos/chart del creador,
campos y callbacks ordinarios heredados explícitamente del pin Showdown con
referencias y pruebas. No se atribuyen esos campos a la ROM.
**Evidencia:** [lote mínimo y límites de fuente](RULES_REFERENCE.md#tmt-09--lote-minimo-birdcrab-2026-10-02).

### TMT-10 — Teambuilder y equipos realmente legales

**Prerrequisitos:** TMT-09. **Estado:** completado (2026-10-03) bajo la adaptación y el contrato de premades aprobados. QA nativo y CI-core final aprobados; revisión visual del dueño/arte original pendiente no se confunde con fidelidad ROM.
**DoD:** búsqueda por cualquiera de los tres tipos, tooltips de stats/ítems/
habilidades/movimientos correctos, import/export probado, sin manipulación de EVs,
equipos legales aceptados y errores de servidor claros para los ilegales.
**Evidencia:** [contrato, cambios y pruebas TMT-10](RULES_REFERENCE.md#tmt-10--editor-nativo-y-equipos-legales-2026-10-03). 20 comprobaciones visuales aprobadas: editor, reload, popups reales y búsquedas; ver RULES_REFERENCE para límites del harness/arte. Un selector visible no equivale a equipos legales.
**Preparación concreta (2026-10-03, sin implementación):** después de revisar y
fusionar TMT-09, verificar los tres masters/pins y abrir ramas nuevas.
1. Extender los controles nativos existentes: búsqueda por cada slot de tipo,
   incluyendo Bird/Bird/Bird sin deduplicar los datos; formas sólo como información,
   nunca como starting form ilegal.
2. Mostrar stats nivel50/IV31/EV0/Hardy e ítem/habilidad/movimientos desde el mismo
   catálogo, ocultando edición EV e indicando la adaptación y arte ausente.
3. Probar import/export y aceptación de los tres premades completos por el servidor;
   mostrar sus errores para mezclas, EVs/IVs/level alterados, referencias ausentes y
   formas iniciales inválidas. Conservar el contrato locked-premade aprobado:
   combinaciones libres requieren una decisión explícita antes de ampliar el gate.
4. Añadir regresiones de búsqueda/tooltips/import/export/errores y aislamiento;
   ejecutar CI-core y recorrido del teambuilder nativo con reload. Si se repite
   gameplay con nombres unsigned, solicitar autorización temporal específica antes
   de activar una nueva excepción de seguridad.
No catálogo nuevo, megas adicionales, framework/rediseño ni implementación de
TMT-10 durante la publicación de TMT-09. La revisión visual del dueño y los sprites
ausentes quedan explícitos; publicar esta preparación no los convierte en aprobados.


## Etapa 4 — Fidelidad y beta

### TMT-11 — Regresión de fidelidad y aislamiento

**Prerrequisitos:** TMT-07, TMT-08 y TMT-10. **Estado:** parcial (2026-10-03).
Cuatro combates/replays deterministas y controles de aislamiento incorporados al
core; runner nativo/CI preparado con sandbox obligatorio. La prueba local recorre
22 controles pero falla por 404 de recursos locales del cliente existente.
Navegador en CI y revisión visual del dueño de TMT-07 siguen pendientes. Esta preparación independiente no completa los prerrequisitos.
**DoD:** casos oráculo, combates/replays reproducibles y flujos de navegador en CI
desde instalación limpia; formatos Showdown ajenos intactos. Fallos, exclusiones y
límites se reportan explícitamente, sin convertir baseline fallido en aprobado.
**Evidencia:** [regresiones acotadas y gates pendientes](RULES_REFERENCE.md#tmt-11--regresiones-acotadas-y-gates-pendientes-2026-10-03).

### TMT-12 — Beta reproducible

**Prerrequisitos:** TMT-11 y aprobación de derechos/proveniencia de datos/assets.
**Estado:** pendiente.
**DoD:** fijar tres commits + dataset + assets; docs de instalación, límites y
rollback; instalación nueva completa un combate. Resolver licencia/redistribución
antes de incluir material no aprobado. Despliegue público fuera de esta DoD y con
autorización separada.
**Evidencia:** pendiente; todavía no existe beta TMT2 ni permiso de publicación nueva.
