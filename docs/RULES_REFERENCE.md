# TMT-02 — Reglas, base y casos de referencia

Evidencia de [TMT-02 en el backlog único](ROADMAP.md#tmt-02--reglas-y-casos-de-referencia),
no un segundo plan. Estado: **terminado bajo el contrato de adaptación aprobado por el usuario**.
Revisión 2026-09-30. Entrada fijada: SRC-05 v1.5.2 por SHA-256 en
[registro de fuentes](../provenance/sources.json). Integridad BPS no demuestra reglas.

## Alcance aprobado — 2026-09-30

El usuario aceptó el formato recomendado con «El formato sirve» y aceptó con
«Si!» usar Showdown donde falte evidencia, registrando diferencias para comprobar
más adelante, sin prometer réplica exacta. Esta decisión cambia explícitamente el
criterio de evidencia de TMT-02: las reglas documentadas TMT2 usan sus fuentes;
las indocumentadas usan **política de adaptación + código Showdown fijado + expected
heredados**, no expected ROM inventados. La aprobación consta en `userApprovals`
del registro. No cambia los gates de datos/proveniencia ni autoriza etapa2/publicación.
No hace falta mGBA, otro BPS, extracción de roster o runtime parity para cerrar este ticket.

## Matriz de evidencia

| Regla/dato | Evidencia disponible | Qué queda sin demostrar |
| --- | --- | --- |
| No EVs; especies de hasta tres tipos | Creador, SRC-01, anuncio #1 | Cómo se generan stats y se tratan datos existentes; fórmula, IVs/naturalezas |
| Mega Pidgeot Holy/Bird/Bird | Creador, SRC-02, anuncio v1.5.0 #105: repetición revalidada directamente | STAB y defensas duplicadas; orden de efectos; stats/ability de la forma |
| División físico/especial, con excepción Pure | SRC-01 #6 y SRC-02 #105 describen correcciones a categorías por tipo fuera del efecto Pure | Categoría de cada move; alcance/duración/reglas exactas del efecto |
| Protosynthesis/Quark Drive y Magic Guard en sans | Creador, SRC-01 #6/#9: correcciones de efectos | Fórmulas, flags, prioridad y elegibilidad exactos en v1.5.2 |
| Megas, piedras y formas | SRC-02 #105 anuncia formas y piedras | Timing, límite por equipo, qué ocurre al perder objeto/cambiar/reingresar |
| Tabla de efectividad de tipos | SRC-03 vista pública de tabla | Snapshot vinculado a v1.5.2; fórmulas, inmunidades excepcionales y pasivas |
| Pasivas especiales asociadas a tipos | Investigación previa señaló su existencia; no hay definición concreta verificable en las vistas actuales | Nombre → trigger → magnitud → orden → acumulación → supresión. No importar callbacks desde el nombre de un tipo |
| STAB/daño/cambio de tipo/IVs | Sin oráculo del juego ni fuente semántica fijada | Todos los resultados de las especificaciones siguientes |

Fuentes primarias: [hilo oficial](https://www.pokecommunity.com/threads/pok%C3%A9mon-too-many-types-2.539542/),
[página 6, #105 y #108](https://www.pokecommunity.com/threads/pok%C3%A9mon-too-many-types-2.539542/page-6),
[hoja enlazada por el creador](https://docs.google.com/spreadsheets/d/1lclbDiHdUnETmFQRm0v_capEqSJaVBG2OsLuOJ6L9Kk/edit?usp=sharing).
Son declaraciones/documentación, **no pruebas ejecutadas del ROM**. La hoja expuso
sólo la tabla; htmlview no estuvo accesible. El navegador provisionado falló con
`net::ERR_TUNNEL_CONNECTION_FAILED` en la URL pública de la hoja; no se alteró
proxy ni se eludió acceso. Páginas 2/3 del foro respondieron 403;
no se eludió acceso. Hace falta documentación adicional o resultados legítimos.

## Comportamiento heredado y base provisional

Fork revisado: servidor `2f5b273925862ac242b419086c1e7a8868b51da1` (pins actuales).
El mod hereda datos/scripts, no sólo una etiqueta de generación. Las diferencias
siguientes se observaron en su Dex compilado; el callback de estados usa un harness
sin habilidades, no un combate completo. `Future`/`Past` son flags de catálogo;
existir en el Dex **no implica legalidad**. La matriz no es evidencia ROM; respalda la base de la adaptación aprobada.

| Base | Ghost→Steel | Waterfall/Bite | Burn por turno sobre 160 HP | Speed 100 con parálisis | Rapid Spin potencia | Protosynthesis | Mega Pidgeot |
| --- | ---: | --- | ---: | ---: | ---: | --- | --- |
| Gen 3 | 0.5 | Special/Special | 20 | 25 | 20 | Future | Future |
| Gen 6 | 1 | Physical/Physical | 20 | 25 | 20 | Future | actual |
| Gen 7 | 1 | Physical/Physical | 10 | 50 | 20 | Future | actual |
| Gen 8 | 1 | Physical/Physical | 10 | 50 | 50 | Future | Past |
| Gen 9 | 1 | Physical/Physical | 10 | 50 | 50 | actual | Past |

- Gen 3 añade reescritura de categorías por tipo y fases de daño específicas:
  `data/mods/gen3/scripts.ts`. Los anuncios de división y megas requieren deltas
  grandes; GBA/Emerald no basta para elegirla.
- Gen 6 ya ofrece split y megas, pero estados, Gale Wings (sin requisito de HP
  completo) y timing difieren de bases posteriores; faltan efectos modernos.
- Gen 7 ofrece megas y estados modernos. `sim/battle.ts` recalcula la acción al
  megaevolucionar en la rama gen==7; Gen 6 no usa esa rama. El test upstream
  `test/sim/misc/megaevolution.js` cubre cambios de speed/prioridad en bases modernas.
  Eso no determina el timing TMT2.
- Gen 8 cambia moves como Rapid Spin y marca megas Past. Gen 9 incorpora
  Protosynthesis/Quark Drive como actuales; retiene megas en el catálogo con
  legalidad específica. Tera/Dynamax/Z no están autorizados por esta evidencia.

**Decisión de ingeniería: Gen 9 como padre inicial**, porque la
hoja del creador documenta Ghost→Steel ×1 (Gen3 heredada usa ×0.5), los anuncios
requieren split y mencionan efectos modernos, y es el Dex raíz del fork
(`data/scripts.ts`). Es minimizar reconstrucción, no afirmar fidelidad Gen 9.
La decisión selecciona el motor heredado, no certifica sus valores como ROM.
`showdownBaseGeneration` es 9; la fidelidad sigue sin demostrar. Cambiar de padre
requiere evidencia de que overrides acotados no bastan; no se fija un gen ROM.
Para la primera semilla, cotejar stats,
STAB/daño, categorías y valores de los
moves elegidos, chart y efectos inherentes de sus tipos/abilities. Gen6–9 no se
distinguen sólo por Ghost→Steel o split; Gen9 se elige por compatibilidad y menor reconstrucción. Burn, parálisis, Rapid Spin y mega timing sólo son gates si se usan.
Excluir esos contenidos evita hacer depender esta selección de todas sus reglas.
Ninguna base elimina la necesidad de catálogo TMT2, tipos nuevos, pasivas y noEV.

Reglas heredadas aceptadas para la adaptación (contraste ROM futuro, opcional):

- `sim/pokemon.ts` conserva `types` como array; `runEffectiveness` recorre cada
  entrada, incluidas repetidas. Con interacciones ordinarias el exponente se suma.
  Inmunidad se trata aparte; no probarla sólo con `getEffectiveness`.
- `sim/battle-actions.ts` usa pertenencia (`hasType/includes`) para STAB ordinario
  1.5, no cuenta repeticiones. Clampa efectividad a -6…6 y aplica redondeos.
- `setType` reemplaza el array y borra `addedType`; `addType` mantiene un único
  tipo temporal adicional; `getTypes` concatena ese tipo. Un array permanente de
  tres tipos puede tener un cuarto temporal en este motor; el juego debe confirmarlo.
- `Battle.statModify` suma IV y floor(EV/4), aplica nivel y naturaleza; `Pokemon`
  usa IV31/EV0 por omisión. Eso no implementa una prohibición legal de EVs.
- `runMegaEvo` cambia forma y limita una mega por lado; las formas/objetos y
  flags legales vienen de la base elegida. No trasladar ese límite al ROM sin prueba.

Reproducción desde el workspace hermano (Node/npm/pins exactos):

```sh
npm run workspace:build
npm run source:showdown-reference
npm run source:showdown-reference -- --damage
cd ../Pokemon-Too-Many-Types-2
node node_modules/mocha/bin/mocha.js --no-config test/main.js test/sim/misc/megaevolution.js --reporter dot --timeout 2000 --exit
```

Resultado local: probe de las cinco bases satisfactorio; **9 tests de megas pasan**.
El probe exige los pins/árboles limpios y un build previo; no consulta upstream.
Un primer harness de diagnóstico omitía `chainModify` y falló; se corrigió antes de
registrar la matriz. Logs locales ignorados: `.local/verification/tmt-02/`.

## Especificaciones de contraste ROM futuro — pendientes, no gates de TMT-02

Ejecutar por quien tenga una copia legítima v1.5.2; aquí no se aplican ni ejecutan
ROMs. Cada caso debe registrar hash del parche, versión mostrada, build/config de
mGBA, identificador/hash de save local, equipos reales, nivel/IV/naturaleza/stats,
tipos ordenados, moves/objetos/abilities, estado/campo, HP antes/después, acciones y
log/video. No publicar ROM, save ni assets. Registrar cómo se controla RNG; si no
hay control, suficientes repeticiones para comparar rangos, nunca una sola razón
aproximada de daño. Guardar pasos para restaurar idéntico estado; orden estable.

Formato de resultado esperado: `caseId`, `inputIdentity`, `setup`, `steps`,
`rngControl`, `observations`, `expected` (null mientras no se mida), `evidence`,
`verifiedBy`, `limitations`. No fabricar un expected ROM desde el simulador.

| Caso | Setup/pasos discriminantes | Resultado que hay que fijar |
| --- | --- | --- |
| REF-01 Defensa duplicada | Verificar filas de chart; comparar defensor con T/T/U frente a T/U con stats iguales o ajustar por stats medidos. Atacante sin STAB/pasivas, move de tipo A. Medir debilidad, resistencia, neutro e inmunidad. Elegir pares reales accesibles; no editar tipos por suposición | Distinguir producto por entrada (r(A,T)^2*r(A,U)) de deduplicación; caps, rounding e inmunidad. Fórmulas son hipótesis discriminantes, no expected |
| REF-02 STAB duplicado | Mega Pidgeot Holy/Bird/Bird como candidato documental; confirmar stats/ability y efectos primero. Move Bird y control noSTAB de potencia/categoría equivalentes, objetivo neutral; repetir para tipo único y duplicado | STAB único vs acumulado/otra regla; modificador exacto, redondeo y pasivas activadas por move/species. No inferir 1.5 o 2.25 desde tres tipos |
| REF-03 Cuarto tipo | Identificar move TMT2 que añada tipo con descripción verificable. Usarlo en especie de tres tipos; probar añadir tipo existente, nuevo y segundo añadido; atacar por cada tipo; switch/reentrada/fin | Si añade, falla, reemplaza slot o deduplica; STAB/defensa, duración y reset; orden preservado |
| REF-04 Reemplazo tipo | Move real de reemplazo, triple tipo, luego add-type y reemplazo en ambos órdenes; repetir tras switch, Roost/forma sólo si disponibles | Cuántos slots reemplaza, si borra añadido, retorno a tipos base y restricciones; excluir casos no disponibles |
| REF-05 Mega timing/eligibilidad | Piedra correcta/incorrecta/sin piedra, especie/forma elegible, segundo intento por mismo lado. Elegir oponente con Speed entre valores base/mega y prioridad igual; repetir turno de mega, turno siguiente y reentrada | Orden por speed base/mega, ability/pasivas antes de mover, límite por lado, permanencia y reset. Elegibilidad/documentación de cada forma obligatoria |
| REF-06 Stats/noEV | Leer seis stats en niveles al menos 2 conocidos y naturalezas neutra/+/-; IVs conocidos si herramienta legítima los expone. Comparar antes/después de combates y fuentes de EV conocidas | Fórmula/rounding, efecto IV/naturaleza, excepciones HP/formas y ausencia de EV; si IV es desconocido, no identificar fórmula de manera única |
| REF-07 Split | Move físico de tipo que Gen3 haría especial y viceversa, contrastar usuarios con Atk/SpA diferentes, sin pasivas; repetir bajo/tras efecto Pure sólo si disponible | Categoría por move vs por tipo; duración/reset del efecto y si tooltip coincide con daño |
| REF-08 Prioridad/estados | Move de prioridad conocida contra move ordinario con speed invertida; repetir speed changes, empate, parálisis, burn y mega. Evitar habilidades desconocidas | Prioridad base, recálculo speed, desempate/RNG, reducción speed y chip burn; aislar efectos antes de combinarlos |
| REF-09 Pasivas | Primero fijar texto oficial de cada pasiva. Pares mono/duplicado/triple, pasar a/desde tipo; move propio/ajeno, contacto, residual; habilidad/objeto superpuesto y supresión si legales | Trigger, magnitud, acumulación por tipo repetido, orden con STAB/ability/item, duration/reset. Sin definición, no diseñar resultado desde nombres como Fast o Fluffy |

Si se miden, convertir cada resultado verificado en prueba de servidor/Dex y caso
cliente/replay con la misma versión. Son protocolos opcionales de fidelidad,
no tests ejecutados ni requisito para la adaptación aprobada. Casos mega/4ºtipo también alimentan TMT-08 sin
implementar esa etapa ahora.

## Semilla mínima recomendada y decisiones competitivas

### Contrato inicial acotado

No exige resolver todo TMT2. Los requisitos de datos de esta tabla
se ejecutan en TMT-04 para los sets aceptados; TMT-02 fija reglas y expectativas.
No se han implementado legalidad ni mecánicas de etapa 2.

| Regla | Estado / condición de aceptación |
| --- | --- |
| EV0; rechazar EVs no cero | NoEV documentado por creador y formato aprobado. Expected legalidad: EV0 aceptado, cualquier EV≠0 rechazado; implementación TMT-06 |
| Tipos como array ordenado, sin deduplicar | Repetición documentada; conservar datos. No aprobar especies repetidas hasta REF-01/02 |
| Chart por pareja de tipos | Cinco observaciones SRC-03 registradas abajo; verificar sólo las parejas usadas, con versión/proveniencia |
| STAB y daño ordinario | Adaptación aprobada: STAB ×1.5 por pertenencia, sin acumular por repetición; producto defensivo por entrada, inmunidad aparte; expected en controles reproducibles |
| Stats/categoría/moves | Fórmula Gen9 heredada con EV0 e IV31 explícitos. Categorías por move y callbacks/flags ordinarios del Dex fijado son adaptación; stats base y datos TMT2 personalizados requieren fuente en TMT-04, nunca sustituirlos silenciosamente por Mew/Dex base |
| Efectos | Sólo abilities y pasivas inherentes verificadas. Ningún nombre garantiza ausencia de efectos. Usar inicialmente moves de un golpe sin secundarios/cambio de stats/tipos sólo si su definición lo confirma |
| Legalidad inicial | Lista de sets comprobados, sin objetos si es legal, sin megas/Tera/Dynamax/Z, clima ni cambios de tipo. Excluir especie si no puede evitarse un efecto desconocido |

Observaciones de la [hoja oficial SRC-03](https://docs.google.com/spreadsheets/d/1lclbDiHdUnETmFQRm0v_capEqSJaVBG2OsLuOJ6L9Kk/edit?usp=sharing),
2026-09-30: filas atacantes/columnas defensoras Ghost→Steel ×1 (10/L),
Fire→Grass ×2 (13/P), Fire→Water ×0.5 (13/O), Normal→Ghost ×0 (3/K),
Electric→Ground ×0 (16/H). Son documentación mutable, sin binding a v1.5.2 ni
oráculo ROM; no importación de catálogo. Las coordenadas incluyen las columnas
auxiliares A–C del documento. Ver `chartObservations` en el registro.

**Candidatos para buscar filas, no roster aprobado:**

| Grupo provisional | Nombres | Evidencia de existencia / límite |
| --- | --- | --- |
| A | Rattata, Eevee, Froakie | SRC-01 #6: fallback, nota Attract/evolución y encuentros respectivamente |
| B | Koffing, Floragato, Pidgeot base | SRC-01 #6: cry y encuentros para los dos primeros. Pidgeot base es inferencia desde Mega Pidgeot SRC-02 #105: confirmar fila o reemplazar |

Todos tienen tipos/stats/ability/moves/learnsets pendientes. No asignar tipos
ordinarios ni abilities de Showdown a estos nombres. Buscar **una ability y uno o
dos moves simples por especie**, no sus learnsets completos. Si una fila introduce
Pure, pasiva desconocida, tipos repetidos u otra mecánica difícil, reemplazarla por
una fila completa más simple; la lista no obliga a implementar esos efectos.
La agrupación no es balance validado. Dos equipos de tres están aprobados como política competitiva.
Mega Pidgeot permanece candidato de oráculo futuro, excluido de esta semilla.

### Referencia mínima para contrastar fidelidad después (opcional)

Para un contraste futuro bastan **dos combatientes de referencia**, no seis filas completas.
Se necesita una ficha de cada uno: tipos ordenados, stats base y visibles, nivel,
IV/naturaleza conocidos, ability/pasivas y definición de dos ataques disponibles
(uno STAB y uno control noSTAB). Capturas legibles o fuente del creador vinculada
a versión, más observaciones, bastan; no compartir ROM/save ni reenviar BPS.
Las seis filas, dependencias y sets jugables se verifican posteriormente en TMT-04.

Con esas dos fichas, seleccionar **dos combatientes reales** y un estado restaurable
en una copia legítima v1.5.2/mGBA: stats visibles, nivel, naturaleza, tipos exactos,
ability, sin objeto/campo/estado ni efecto sin verificar. Registrar un ataque STAB
y un control noSTAB de categoría/potencia conocidas contra el mismo defensor,
HP antes/después, críticas y RNG/repeticiones. No exigir cambiar tipos arbitrariamente
ni comparar razones crudas cuando potencias/stats difieran. Calcular las predicciones
competidoras con inputs medidos; conservar rangos hasta identificar rounding/RNG.
Añadir un defensor de dos/tres tipos distintos si las parejas elegidas permiten
separar producto defensivo de otra regla; documentar también una inmunidad accesible.
Esto ejecuta los subconjuntos ordinarios de REF-01/02/07; REF-06 necesita stats base
verificados y IV/naturaleza conocidos (dos niveles solos con IV desconocido no bastan).
Si no hay par sin pasivas, documentar su efecto antes de usarlo como control.

Entrega mínima del experimento (sin binarios):

1. `referencia.txt`: SHA del BPS ya registrado, versión visible, mGBA/build,
   hashes locales del estado restaurado, dos fichas con fuente de stats base y
   valores IV conocidos. Capturas de stats/naturaleza/tipos/ability y descripción
   de los dos moves; no hace falta documentar seis especies.
2. `stats.csv`: especie, nivel, naturaleza, seis IVs, seis stats visibles, antes
   y después de subir un nivel sin evolución. Contrastar la fórmula de stats
   heredada y cada naturaleza; no identificarla sólo ajustando IVs desconocidos.
3. `danio.csv`: ensayo, move, HPantes, HPdespués, crítica, estado/campo, orden.
   Restaurar el mismo estado para cada ataque; registrar primero 20 repeticiones
   sin crítica por move si no hay RNG controlado. Veinte muestras no garantizan
   cubrir el rango: si las hipótesis siguen compatibles, el resultado es inconcluso.
4. Una captura/log de inmunidad y el caso multitype elegido; anotar todas las
   pasivas/abilities participantes. Una fuente oficial del código/fórmula vinculada
   a este build puede sustituir las mediciones correspondientes.

Sólo estos registros/capturas son necesarios aquí, no el ROM, el save ni otro BPS.
El resultado debe discriminar stats, STAB ordinario y defensa multitype; registrar
como desconocido cualquier caso no discriminado, nunca completar por analogía.

REF-03/04/05, duplicados de REF-01/02 y las partes de estados/Pure de REF-07/08 se
mantienen como casos pendientes para contenidos excluidos, **no bloqueos globales
para seis sets que no los usen**. REF-09 sólo bloquea pasivas de esos seis sets.
La representación de duplicados se preserva aun cuando esas especies se excluyan.

| Política | Decisión aprobada | Límite |
| --- | --- | --- |
| Formato | Singles privado, sin ranking, dos premades | Política del producto, no regla ROM |
| Nivel/tamaño | Nivel50, 3 por equipo | No inferido del postgame; seis especies se verifican en TMT-04 |
| IV/EV/naturaleza | IV31 explícito, EV0; naturaleza explícita por set | Fórmula heredada. No afirmar que IV31 sea universal en el juego |
| Legalidad | Lista de sets comprobados, sin cláusulas de OU automáticas | Implementación y datos en TMT-04/06; rechazar elecciones no soportadas |
| Transformaciones | Sin Tera/Dynamax/Z, mega ni cambios de tipo en primera semilla | Contenido excluido; protocolos de contraste permanecen pendientes |

### Expected de la adaptación y regresiones

Fuente ejecutable: fork servidor fijado, `sim/battle.ts` (`statModify`, `randomizer`),
`sim/battle-actions.ts` (STAB/daño), `sim/pokemon.ts` (arrays/efectividad/inmunidad),
`data/mods/gen9`/Dex raíz. Los paths pertenecen al SHA servidor citado arriba.
Autoridad de usarlo donde falta documentación: aprobación del usuario, no ROM.

- Stats ordinarios sin EV: HP = floor((2B+IV)×L/100)+L+10;
  otros = floor((floor((2B+IV)×L/100)+5)×naturaleza), multiplicadores 1/1.1/0.9.
  Casos normales pequeños del probe; excepciones de especie/overflow no autorizan
  contenido TMT2 desconocido. Fixtures: base100/IV31/L50→HP175/stat120;
  naturaleza positiva132/negativa108; IV0→HP160/stat105; L100→HP341/stat236.
- STAB ordinario ×1.5 si el tipo del move pertenece al array; Fire/Fire no lo
  duplica. Defensa recorre cada entrada, preservando orden y duplicados; inmunidad
  se comprueba antes del daño, exponente acotado -6…6 por el motor heredado.
  Diez casos ejecutados abajo incluyen ×2, ×4, ×8, ×0.5, ×0.25 e inmunidad.
- Categoría por move; prioridad, RNG, redondeo, switch y callbacks **ordinarios**
  Gen9 se heredan. Probe compara Waterfall/Bite y callbacks de estados por base;
  RNG fijo [1,2,3,4] y no crítica hacen reproducibles los casos de daño.
  Moves/abilities/pasivas TMT2 no documentados no se inventan ni autorizan por nombre.
- Legalidad esperada: IV31/EV0/nivel50/3 miembros y sets permitidos; EV≠0,
  especie/move/ability/objeto fuera de lista o transformación excluida→rechazo claro.
  Son requisitos de implementación TMT-06, no tests del validador ya implementado.
- Representación permite duplicados documentados. Su semántica por entrada es
  adaptación explícita; primera semilla sigue excluyendo formas repetidas y efectos
  desconocidos para limitar alcance. Añadir contenido exige datos y pruebas propios.

No se exige entregar el catálogo de seis especies en TMT-02: esos valores, fuentes,
referencias y esquema son exactamente TMT-04. El probe usa controles sintéticos y
nunca los genera como producción. Pasivas custom desconocidas, Pure, megas, cuarto
tipo, cambios de tipo y demás contenido fuera del contrato permanecen excluidos.

## Inspección estática del parche y límites de fidelidad

Se recorrieron descriptores del BPS sin aplicar ni reconstruir un ROM. SRC-05
produce rangos de SourceRead=308, TargetRead=15685717, SourceCopy=9489478 y
TargetCopy=8378929 bytes (suma 33554432). Las copias pueden remitir a literales
o depender de la base: la fracción de instrucciones de copia no mide por sí sola
cuántos bytes serían recuperables. TargetRead contiene literales con offsets
calculables, pero 53.25% de los bytes de salida son descriptores de copia. Para
atribuir una constante a una tabla/move/callback hace falta mapa de símbolos,
layout documentado o fuente equivalente vinculada al build. Metadata BPS vacía.
No se extrajeron tablas ni se dedujeron mecánicas de cadenas/bytes sin etiqueta.
Se pueden establecer identidad, tamaños, CRC y estructura; no está justificado
un extractor de stats/moves a partir de esos datos actuales.

### Revisión del DoD bajo el alcance aprobado

El DoD canónico no se borra: su interpretación de evidencia ahora incluye la
adaptación autorizada el 2026-09-30. No se representa el consentimiento como
observación ROM. Registro reproducible de hechos, políticas y expected arriba.

| Criterio canónico | Estado | Evidencia |
| --- | --- | --- |
| Matriz regla → fuente/oráculo → caso esperado | Cumplido para el contrato inicial | Hechos oficiales SRC-01/02/03; mecánicas indocumentadas como adaptación autorizada; 18 expected ejecutados sobre código fijado y reglas de legalidad especificadas |
| Generación justificada | Cumplido | Gen9: chart moderno/split, efectos modernos mencionados y Dex raíz del fork; no inferencia de generación ROM |
| Decisiones competitivas explícitas | Cumplido | Aprobación de singles privado, premades3v3/nivel50/IV31/EV0 |
| Faltantes que impiden semilla identificados | Cumplido | TMT-04 necesita seis filas y sus dependencias verificadas; tipos/passives custom, procedencia/licencias pendientes. Catálogo no exigido en este ticket |
| Sin conjeturas de duplicados/cuarto tipo/pasivas | Cumplido | Duplicados preservados; comportamiento heredado etiquetado adaptación. Contenido especial excluido; REF-01…09 son contraste futuro, no hechos establecidos |

**TMT-02 terminado como especificación de adaptación**, no juego implementado,
catálogo verificado ni réplica fiel. Las preguntas previas sobre mGBA/política se
superseden por estas dos aprobaciones; no se requiere reenviar BPS ni ejecutar
mGBA. TMT-04 y posteriores siguen pendientes y no se iniciaron en este cambio.
TMT-03 conserva CI remota verificada en STAGE_1_VALIDATION.md; permisos de
publicación y derechos/proveniencia mantienen sus gates.

## Verificación de esta revisión

- `npm test`: 22 pasan; pruebas propias, no oráculos ROM.
- `npm run typecheck`, `node --check tools/provenance/showdown-reference.mjs`,
  `git diff --check`: pasan.
- `npm run source:showdown-reference -- --damage`: 18 asserts (diez de daño y ocho de stats) sobre el motor
  Gen9 fijado. Mew sintético, nivel50/Hardy/IV31/EV0, No Ability, RNG [1,2,3,4],
  sin crítica. `setType` mantiene orden/repetición; inmunidad se verifica antes de
  `getDamage`. No ejecuta turno/move completo ni secundarios, y no usa catálogo TMT2.
  Ember: neutral16, STAB24 (también Fire/Fire y Water/Fire/Fire), debilidad32,
  duplicada64, triple128, resistencia8, duplicada4; Tackle inmune devuelve false.
  Stats con base100/EV0: nivel50/IV31 HP175/neutral120/+132/−108; IV0
  HP160/neutral105; nivel100/IV31 HP341/neutral236. Son expected **heredados**,
  no resultados del juego. Dos ejecuciones idénticas.
- Probe sin flag: cinco bases; argumento inválido: código1 sin JSON de éxito.
- Builds previos disponibles; no se modificaron forks ni pins. Suites completas,
  DNS y UI no repetidas por esta revisión de probe/documentación; evidencia baseline
  en STAGE_1_VALIDATION.md. Ningún test ROM ni nuevas checks remotas ejecutadas.
- Manifiesto local ignorado se regenera/coteja dos veces tras el commit final.

## TMT-04 — Esquema y semilla acotada

Rama `feat/tmt04-seed-data` desde PR3 merged
`ff09cca24dd6211f30cb235d62468913805f2aba`. El primer commit dejó explícitamente
el seed incompleto; las filas recibidas y corroboradas el 2026-09-30 completan
este contrato. No se afirma fidelidad ROM ni integración jugable.

**Aplicación del alcance aprobado, 2026-09-30:** datos ordinarios y comportamiento
no documentado heredan Gen9 del servidor fijado. Para tipos custom se registra
`none-adaptation`: no callback adicional de tipo en esta adaptación inicial;
esto no demuestra que el ROM carezca de pasivos. Sustituye la exclusión conservadora
anterior de Pidgeot/tipos repetidos para este seed, sin cambiar las incógnitas ROM.
Moves mantienen sus tipos Gen9: Gust es Flying, no Bird; no se inventan aliases.

`provenance/seed-types.json` conserva la transcripción del usuario
`Sentinel_51eeebf3c58c8191af721b1ca6a7eceb` (20:12:49 UTC) y observaciones visuales
primarias del investigador del chat padre (20:16 UTC), con URL/celdas exactas:
Rattata C11:E11, Eevee C125:E125, Froakie C8:E8, Floragato C3:E3,
Pidgeot base C24:E24 y Nosepass C302:E302. No se atribuye esa consulta al importador.
Mega Pidgeot es otra fila, excluida. No se importa todo el catálogo ni se normalizan
aliases ambiguos. Las observaciones actuales de hoja no están ligadas a v1.5.2.

Dos premades, todos Hardy, nivel50/IV31/EV0 y sin objeto (ID `none`):

| Equipo | Especie / tipos oficiales ordenados | Ability heredada | Cuatro moves heredados |
| --- | --- | --- | --- |
| alpha | Rattata / Rat | Run Away | Tackle, Quick Attack, Bite, Protect |
| alpha | Eevee / Boring, Cat | Run Away | Tackle, Quick Attack, Bite, Protect |
| alpha | Froakie / Water, Frog | Torrent | Pound, Water Gun, Quick Attack, Protect |
| beta | Nosepass / Rock | Sturdy | Tackle, Rock Throw, Thunder Wave, Protect |
| beta | Floragato / Grass, Magic, Cat | Overgrow | Scratch, Magical Leaf, Bite, Protect |
| beta | Pidgeot / Bird, Bird, Bird | Keen Eye | Tackle, Gust, Quick Attack, Protect |

Nosepass reemplaza Koffing, ausente de la transcripción. Son sets de efectos
ordinarios conocidos: prioridad Quick Attack, Bite, Protect, Torrent/Overgrow,
Sturdy y Thunder Wave remiten a callbacks del servidor fijado. Stats base,
metadatos y cuatro entradas del learnset por especie heredan ese Dex; se verifica
cada ability y presencia de cada move, incluyendo entradas históricas permitidas
por adaptación. No se afirma legalidad OU Gen9 ni igualdad con learnsets ROM.

`provenance/seed-chart.json` registra 63 parejas numéricas y sus celdas primarias:
los siete tipos de ataques seleccionados (incluido Electric de Thunder Wave)
contra los nueve tipos defensivos únicos. No hay default neutral para custom.
La matriz ordinaria restante hereda Gen9, salvo cinco overrides ya registrados;
parejas observadas tienen precedencia. Rock→Bird=2; producto por tres slots=8 es
expectativa de adaptación, no una medición ROM. Nuevos ataques sin cobertura fallan.

`schemas/seed.schema.json` Draft07 y `tools/data/validate.mjs` comprueban shape,
IDs/referencias, stats, reglas/sets, evidencia por campo, hashes de fuentes,
correspondencia de filas/chart, cobertura y separación de fixtures. Hash canónico
ordena objetos y preserva arrays; integridad del snapshot no autentica por sí sola
una fuente. El fixture separado usa tipos ordinarios base-Dex y nunca valida como
producción. Megas, cambios/cuarto tipo, callbacks custom, resto del catálogo y
fidelidad ROM quedan excluidos; runtime/generación para ambos forks es TMT-05/06.

```sh
npm run workspace:build
npm run seed:prepare -- --output /tmp/seed-new.json
npm run seed:prepare -- --fixture --output /tmp/fixture-new.json
npm test
npm run typecheck
npm run seed:validate
npm run workspace:data:validate
npm run ci:core
```

El preparador lee únicamente el servidor compilado fijado; no fetch/pull ni ROM.
Valida antes de escribir un archivo nuevo con `wx`: rechaza overwrite/symlink.
Se revisa el resultado antes de reemplazar el snapshot comprometido.

**Verificación local:** 34 tests propios pasan; typecheck y validación de ambos
comandos pasan. Preparación repetida es idéntica y overwrite falla sin modificar
el archivo. `npm run ci:core` sale0: builds server/client, lint/typechecks, servidor
2365 passed/74 pending, cliente21 passed/3 skipped por assets, y smoke HTTP/WS,
rechazo de operaciones concurrentes, SIGTERM 143, eliminación de lock y puertos
libres. Dos tests DNS y upstream slow no se ejecutan en core; no se afirma que
pasaron. Aviso PHP ausente en noticias opcionales y assets cliente faltantes
son límites baseline documentados, no se ocultan ni se descargan datos upstream.
No verificación visual nueva: no se modifica UI ni se certifica batalla TMT2.
Manifest escrito dos veces/check confirma reproducibilidad tras el commit final.
Manifest debe indicar `bounded-seed-validated`, seedValidated=true, pero mantiene
productionValidated=false/fullCatalogValidated=false: no certifica catálogo/juego.
No hay CI remota nueva, publicación ni trabajo TMT-05/06.

**Checklist TMT-04:** seis especies, dos sets completos 3v3, dependencias con
procedencia, tipos ordenados/duplicados, esquema/validador, fixture separado y
hashes reproducibles cumplidos bajo adaptación aprobada; fidelidad ROM no probada.

## TMT-05 — Integracion local aislada

Implementación local 2026-09-30 bajo la adaptación ya aprobada. No amplía el
catálogo ni certifica TMT-06/TMT-07. La semilla, fuentes y equipos TMT-04 no cambian.

`tools/integration/catalog.mjs` valida la semilla y produce el mismo JSON en
`server/data/mods/gen9tmt2seed/catalog.json` y `client/tmt2/catalog.json`.
Versión0.1.0, hash del dataset
`9a3b47cd2b6dc682f6750827487ffed634fa51cf61b6e3431939c1fd60fa94c0`;
el hash derivado adicional cubre seed+tablas. Arrays preservan orden/repetición:
Pidgeot tiene tres slots Bird, nunca `addedType`. No se generan callbacks.
El pin original de hechos se conserva en `provenance/inheritance-pins.json`;
consumer commits en `ci/pins.json` no entran en el hash del catálogo, evitando
un ciclo de SHA propio. Cambios a inputs heredados requieren revisión/versionado.

Servidor: mod aislado `gen9tmt2seed`, formato `[Gen 9] TMT2 Seed` oculto/no rated,
cláusula heredada que desactiva Terastallization, construcción de Battle y guardas de pertenencia de especies/abilities/moves/items.
Dex expone sólo seis especies, once moves, cinco abilities, `none` y los 24 tipos;
366 parejas del chart coinciden con la semilla. Gen9OU conserva Pidgeot Normal/Flying.
Callbacks ordinarios siguen heredados. `|tmt2data|version|datasetHash|catalogHash`
identifica el contrato; estos tres campos se validan en el parser cliente/replay.

Cliente: `Dex.forFormat`/`Dex.mod`, tier/gen de batalla/replay, búsquedas y las rutas
del teambuilder usan explícitamente el mod. Sin catálogo/mod se rechaza la operación;
no fallback silencioso al upstream. Búsqueda de tipos incluye el tercer slot y
renderiza duplicados. El pipeline de indexes exige checkout local y SHA exacto,
rechaza fuentes servidor sucias y comprueba el mod antes de producir su tabla; mantiene tablas ordinarias separadas.
No clone/pull ni artículos opcionales de otro checkout. Cache verifica hashes de
inputs y outputs; `--fresh` fuerza generación. El runtime local verifica ambos
hashes y rechaza symlinks de outputs; el generador compartido además protege
archivos ajenos por marca de ownership. Locks nunca se roban.

### Revisiones compatibles y comprobación

| Repo | Rama local | HEAD consumidor |
| --- | --- | --- |
| server | `feat/tmt05-hidden-mod` | `79614d93b69a05cac53c3ed6681be4f2a1395635` |
| client | `feat/tmt05-client-dex` | `aa0a1fc9958b5c24e5f542313ab061762266a5cb` |
| data | `feat/tmt05-local-integration` | commit final del cambio; manifest registra HEAD real |

```sh
npm run integration:generate
npm run integration:check
npm run workspace:build
npm run integration:assets
npm run integration:test
npm test
npm run typecheck
npm run ci:core
npm run workspace:manifest:write
npm run workspace:manifest:check
```

Verificación visual local: `/tmt2-seed.html` muestra seis especies, nombres/tipos
correctos y Bird/Bird/Bird; filtro Cat devuelve Eevee/Floragato; recarga conserva
identidad. Cliente normal muestra etiquetas Format/Team y resuelve el Dex correcto.
Esto no prueba combate completo; snapshot inicial aún mostraba Connecting.
Faltan recursos gráficos/audio y algunos scripts auxiliares; doctor los reporta.
PHP ausente produce un aviso de noticias opcionales. No se descargan para ocultarlo.

**Límites:** pertenencia al catálogo no es legalidad final. Enforcement EV0/IV31,
engine internal moves (p. ej. Struggle), daño/inmunidades/STAB/efectos y prueba de
combate completo permanecen TMT-06/07. Pasivos custom, megas, cuarto tipo y resto del
catálogo siguen excluidos; no afirmación de fidelidad ROM. DNS/slow permanecen
separados/excluidos según CI; no se presentan como aprobados. CI remota de estas
ramas no se ejecuta hasta autorización de publicación. Orden de eventual revisión
y rollback seguro: [DEVELOPMENT.md](DEVELOPMENT.md#integration-pins-and-eventual-review-order).

**Resultado final local:** `npm run ci:core` exit 0 con 37 tests propios (sin skips),
server2368 passed/74 pending y client51 passed/1 skip heredado. Builds, lint
sin warnings, typechecks de los tres repos, seed gate e integración pasan.
Smoke HTTP/WS pasa; operaciones concurrentes rechazadas, SIGTERM 143, lock eliminado
y puertos liberados. Dos DNS y slow no ejecutados, CI remota no ejecutada.
Regeneración compartida dos veces mantiene catálogos idénticos y forks limpios;
`--fresh` preserva los 16 hashes de índices. Preparación del seed con los nuevos
consumer pins sigue idéntica al snapshot TMT-04. La vista final se verificó de
nuevo en Chromium: seis filas, tres Bird, Cat=Eevee/Floragato, reload y cero errores
JS; captura temporal fuera del repositorio (no asset distribuido).

Primer core detectó uso prohibido de `assert.ok` en el nuevo test server:
corregido a `assert()` y pasa con el harness real. Un intento focalizado con
`--require test/main.js` falló antes de ejecutar tests (`before is not defined`);
se reemplazó por la suite configurada. El core intermedio agotó startup90s al
invalidarse cache durante revisión; el presupuesto acotado ahora incluye cold
indexes240s, y core final/lifecycle pasan. No se ocultaron tests fallidos.

**Checklist TMT-05:** generación byte-identical; misma versión/dataset/tabla en
ambos consumidores; seis especies y todas las dependencias/chart coincidentes;
formato oculto construido; routing Dex/battle/replay/search/teambuilder probado;
tercer tipo/duplicados visibles; errores por ausencia/fallback/drift/outputs
inseguros; gen9 ordinario aislado; CI-core y browser local aprobados. Implementado
local, pendiente autorización de publicación y CI remota. No trabajo TMT-06/07.

Revisión final de aislamiento: Terastallization, excluida por TMT-02, se desactiva
mediante `Terastal Clause` existente. Test focalizado con la configuración real
pasa3/3 y verifica la regla registrada. No añade callbacks ni mecánicas nuevas.

CI de publicación detectó dos defectos de checkout limpio: historia servidor
shallow insuficiente para el guard de procedencia y carpeta pública data ausente.
Se conserva el guard y se descarga historia en CI; el builder crea data/text sólo
después de rechazar symlinks. Fixture aislado sin data produjo los mismos 16 hashes,
y symlink de índice se rechazó conservando archivo personal. Client51/1skip y
propios37/typecheck pasan; resultado remoto final se registra en los checks PR5.

## TMT-06 — premades y runtime acotado

2026-09-30, continuación autorizada después de los tres merges TMT-05. Aplica la
adaptación aprobada TMT-02, no añade afirmaciones de fidelidad ROM. Contrato mínimo:
uno de los equipos alpha o beta **completo**, en cualquiera de los dos lados;
orden de miembros/moves libre. No se permiten mezclas, duplicados ni sustituir
moves/ability/item/nature. Nivel50, Hardy, IV31, EV0, sin ítems/transformaciones.
Nombre/género/shiny y otros campos cosméticos ordinarios no cambian este contrato.
EV/IV omitidos en el formato packed se rellenan sólo con 0/31. Valores diferentes,
no finitos, strings, stats extras, `adjustLevel`, niveles que el padre normalmente
clamp-earía y overrides `@@@` se rechazan **antes** de normalización. Una defensa
`onBegin` también rechaza bypass de TeamValidator en el simulador. El importador de
Showdown puede normalizar texto antes del gate; ningún valor resultante aceptado
puede influir en stats mediante EVs ni eludir el contrato.

Servidor: `config/tmt2-formats.ts`, `data/mods/gen9tmt2seed/rules.ts` y
`test/sim/tmt2-runtime.js`. Se reutilizan motor/arrays permanentes y callbacks Gen9
fijados; no cambios en core ni `addedType`. Mod aislado mantiene los nueve moves
ofensivos, Protect y Thunder Wave, las cinco abilities y política sin held items.
Tipos custom siguen sin callback adicional **por adaptación**, no como hecho ROM.
No Tera, Dynamax, Z, megas, formas alternas ni cambios de tipo seleccionables.

Corrección funcional descubierta: el pruning TMT-05 también quitaba Struggle,
necesario al agotar PP. Se conserva su callback heredado sólo como intrinsic del
motor; sigue rechazado como elección y no aparece en learnsets/search. Metadata
cliente se genera separadamente en `table.engineMoves` desde
`provenance/engine-moves.json`, fijado al mismo source original; el check cruzado
compara cada campo con padre/mod. No fallback silencioso a tablas upstream. El
seed v0.1.0 y su hash siguen iguales; el catalogHash cambia explícitamente e impide
usar un cliente viejo compatible sólo por versión. Callbacks no se generan.

Cliente: helpers `TMT2.premade/exportPremade/stats`, vista readonly
`/tmt2-seed.html` con dos imports completos y stats reales. No EV editor ni
teambuilder general TMT-10. Check coordinado importa ambos textos con Teams.import,
los valida y compara todos sus stats con seis Pokémon reales del simulador.
Los errores server siguen siendo autoridad ante modificación del cliente.

| Caso real del mod | Expected de adaptación y regresión |
| --- | --- |
| Stats de seis especies | Fórmula Gen9 a level50/IV31/EV0/Hardy; HP suma60, otros5; export/cliente = simulador |
| Daño de todos los 9 moves ofensivos | 17 combinaciones species/move fijadas con roll máximo y sin crítico; categorías/flags/callbacks heredados |
| Chart ordenado/repetido | Rock Throw contra Pidgeot suma3 etapas (8x), Water Gun contra Eevee suma2 (4x); Water/Frog inmune a Water en cálculo y turno real |
| STAB | Membership 1.5x una vez; control sintético Rock vs Rock/Rock/Rock idéntico, quitar Rock reduce daño; no STAB Bird para Gust/Flying |
| Turno | Quick Attack antes de Pidgeot más rápido; Protect bloquea daño; Bite con roll secundario controlado causa flinch y cancela move lento |
| Thunder Wave / switches | Parálisis real persiste; Bird/Bird/Bird permanece al salir/entrar, sin addedType |
| Torrent / Overgrow | Sus tipos ordinarios ganan daño a HP≤1/3, sin pasiva custom |
| Sturdy / Keen Eye | Lethal hit a HP completo deja1; mismo hit sin HP completo KO; precisión no baja y move ignora evasión |
| Run Away / item | Sin callback PvP según código fijado; getItem vacío, sin bonus |
| Agotar PP | Struggle funciona/recoil, importarlo sigue ilegal |
| Combate local | Match determinista del simulador con autochoices termina en win sin error; no dos navegadores ni certificación replay TMT-07 |

Los 17 controles de daño (target = primer rival no inmune, HP completo, roll máximo,
sin crítico; fixtures de **adaptación**, no mediciones ROM) son:
Rattata y Eevee tackle5/quickattack5/bite14 contra Nosepass;
Froakie pound5/watergun44/quickattack5 contra Nosepass;
Nosepass tackle22/rockthrow84 contra Rattata;
Floragato scratch34/magicalleaf60/bite50 contra Rattata;
Pidgeot tackle34/gust60/quickattack34 contra Rattata. Los setups sintéticos de
STAB, lethal HP y rolls están rotulados en tests y no permiten imports ilegales.

Checks focalizados: `node node_modules/mocha/bin/mocha.js --grep 'TMT-0[56]'
--forbid-only --reporter dot` = **41 passed** (38 TMT-06 +3 integración previa).
Server build/tsc/lint pasan sin warnings de lint. Client `npm test` =52 passed/1
skip heredado; data `npm test` =37 passed/0skip y typecheck aprobado.
`npm run integration:test` aprueba imports, stats, provenance del intrinsic y
catálogo aislado. Browser Chromium/agent-browser: seis filas, stats de Rattata
105/76/55/45/55/92, dos imports readonly, tres Bird, filtro Cat=Eevee/Floragato,
reload restituye seis filas, sin errores JS. Captura temporal `/tmp/tmt06-premades.png`,
no asset distribuido. UI no usa graphics ausentes. Aviso opcional de noticias PHP
continúa sin ocultarlo. CI-core final y manifest limpio se registran al terminar.

Ramas locales: server `feat/tmt06-seed-runtime`, client
`feat/tmt06-premade-contract`, data `feat/tmt06-runtime-verification`.
Pins exactos consumidores en `ci/pins.json`; original facts pin no cambia.
Publicación requiere autorización nueva: server y client antes de datos para que
los pins existan; revisar/mergear server→client→data preservando commits o repin
explícito tras squash/rebase. No push/PR/deploy hecho en esta etapa.

**Resultado final TMT-06:** `npm run ci:core` exit 0: propios37/0skip,
server2406 passed/74 pending, client52 passed/1skip; builds/typechecks/lint,
seed gate y checks cruzados aprobados. Smoke HTTP/WS, rechazo concurrente,
SIGTERM 143, lock eliminado y puertos liberados. Las dos pruebas DNS y las slow
no se ejecutan ni se presentan como aprobadas. Faltan recursos opcionales
`data/graphics.js`, `data/commands.js`, `js/server/chat-formatter.js`; no se
ocultan ni descargan assets para simular completeness. Generación byte-idéntica
y manifest final limpio se verifican después del commit. Sin CI remota en este
alcance, sin recorrido TMT-07, ROM-fidelity, catálogo ampliado ni publicación.

**Checklist DoD local:** legalidad de premades y negativos; EV0/stat agreement;
nueve moves de daño y dos status; immunity/STAB/repetidos/switches; cinco abilities
heredadas y ausencia de held item; PP exhaustion; match de simulador terminado;
core/base-format isolation, generación/protocol hash y browser. No falta un input
para este contrato de adaptación. La próxima tarea autorizable es TMT-07; no se
ha iniciado. Server `b195c4176fd2647c92943ad56cc59e679f431b07`, client
`e9597d09c557b5003801861d356f76f5bde9a082` son los pins revisados locales.

## TMT-07 — checkpoint de autenticacion local

2026-10-01. Continuación autorizada después de serverPR2/clientPR2/dataPR6.
Merges comprobados por API y fetch, sin squash/rebase:
server `4c21861353d77acf48b29e4b5c08a8b009d83fd3`,
client `8ad840a70e2c96c4382305cb4de105c1cc57e976`,
data `619dc5c970f961d5840ad3761456aad752dde29a`.
Los commits TMT-06 son ancestros y los árboles consumidores son idénticos al código
probado. `ci/pins.json` pasa ahora a esos masters revisados; original facts pin y
seed/catálogos no cambian. TMT-06 CI remota
[36788694795](https://github.com/matiHirCab/tmt2-data/actions/runs/36788694795)
aprobó own37, server2410/70pending, client52/1skip; se fusionaron los tres PRs.

**Bloqueo concreto, no aceptación TMT-07:** el config local tiene
`noguestsecurity=false`. `server/users.ts:User.validateToken` exige assertion
firmada para cambiar a un nombre no-Guest; `server/chat-commands/core.ts:challenge`
rechaza `!user.named`. Un Guest automático no puede desafiar. No se configuró
login externo, no se transmitieron tokens/passwords, no se cambiaron auth/security
ni permisos, ni se eludió ese guard. El modo `noguestsecurity` ya existe en Showdown
(`config/config-example.js`, documentación exclusivamente dev); habilitarlo sería
una excepción que requiere aclaración del usuario dado su límite explícito de
no ampliar seguridad. No se presenta esa excepción como ya autorizada.

`npm run workspace:dev` construyó los forks/índices locales fijados y arrancó
127.0.0.1:8000 (server) y127.0.0.1:8080 (client). Dos sesiones Chromium
`agent-browser --session tmt07-a` / `tmt07-b`, páginas `/tmt2-seed.html`, abrieron
WebSockets reales hacia `/showdown/websocket`. Respuestas `updateuser`:
Guest1 y Guest2, named0. La primera envió `/challenge guest2, gen9tmt2seed` y
recibió exactamente `|popup|You must choose a username before you challenge someone.`
No errores JS en ninguna sesión; la vista previa readonly muestra el seed.
Esto fue un **probe browser del protocolo**, no UX de desafío implementada ni
combate. Captura temporal `/tmp/tmt07-guest-blocker.png` con anotación del error
agregada sólo al DOM del probe; no asset/código de producto ni prueba de batalla.
Ambas sesiones cerradas y servicios detenidos mediante SIGTERM, sin borrar locks
manualmente. Quedan los avisos de assets opcionales/PHP ya documentados.

Acción mínima propuesta, aún **no aplicada**: permitir `noguestsecurity=true`
sólo en memoria del launcher local ya ligado a127.0.0.1, exclusivamente para
nombres no registrados/sin autoridad en esta prueba. No `--no-security`, no
`nothrottle`/`noipchecks`, ningún cambio de config persistente, binding o permisos.
Requiere una respuesta explícita antes de continuar challenge/battle/replay.
La alternativa con assertions externas contradice el requisito de no transmitir
tokens y no se intenta. No solicitud de ROM/BPS/mGBA.

Ramas nuevas preservadas: server `feat/tmt07-private-journey`, client
`feat/tmt07-private-client`, data `feat/tmt07-browser-evidence`. No código servidor
ni cliente modificado. TMT-07 permanece parcial/bloqueado: premade selection UX,
challenge cancel/retry/accept, combate completo, rejoin/replay y evidencia final
siguen sin satisfacer; no se inicia catálogo/megas/TMT-10 ni se publica nada.

Verificación del checkpoint: `node tools/ci/pins.mjs verify` aprobado;
`npm run integration:check` aprobado sin cambios de catálogos; `npm test` own37
passed/0skip y `npm run typecheck` aprobados. Shutdown exit143, lock ausente y
bind de prueba a ambos puertos aprobado. Full CI-core TMT-07, partida y replay
no ejecutados: falta la decisión anterior, no se declaran aprobados por CI TMT-06.

## TMT-07 — recorrido privado completado

**Evidencia histórica de protocolo, supersedida para acceptance de UI:** este
recorrido usaba una página plana/BattleSceneStub. La revisión del usuario reabrió
el ticket; ver la corrección nativa al final. No acredita UX Showdown nativa.

2026-10-01: el usuario respondió «si» a habilitar temporalmente `noguestsecurity`
sólo en memoria y con127.0.0.1, sin verificar firmas de nombres locales y retirarlo
al terminar. Esa aprobación resuelve el checkpoint anterior; no autoriza otros
controles ni producción. Launcher opt-in `TMT2_LOCAL_GUESTS=1 npm run workspace:dev`
construye inputs fijados y fuerza/verifica loopback antes de activar sólo ese flag.
No cambia archivos config, autoridad, `nothrottle`, `noipchecks`, SSL público ni
interfaces públicas. Sin flag, guestsecurity queda como estaba. Dos tests del
launcher comprueban opt-in, binding y conservación de los otros controles.

Cliente mínimo aislado `/tmt2-private.html`, enlazado desde `/tmt2-seed.html`:
selección alpha/beta, guest name local, challenge privado con `/inviteonlynext`,
cancel/accept, preview, botones move/switch y resultado. Usa WebSocket real de
Showdown, `/utm` y autoridad de TeamValidator; ninguna llamada a login/replay
hosting. Sólo admite endpoint loopback sin credenciales. Recuerda nombre/premade/
room en sessionStorage para reconnect/rejoin; replay se carga explícitamente offline.
No es teambuilder general ni cliente gráfico completo.

**Evidencia browser, no simulador directo ni humano:** dos sesiones Chromium
independientes `tmt07-alpha`/`tmt07-beta`, nombres locales TmtAlpha/TmtBeta.
Server8000/client8080, ambos127.0.0.1. Premades escogidos con select y verificados en
request real: Rattata/Eevee/Froakie frente a Nosepass/Floragato/Pidgeot, tres por lado.
Challenge enviado con botón, recibido/aceptado en segunda sesión y preview mediante
botón. Automatización seleccionó botones move/switch de requests reales cada200ms,
priorizando basePower; no inyección de equipos al simulador ni falsificación de win.
Alpha recargó durante turno1 y rejoined la misma room/request. El combate final
`battle-gen9tmt2seed-3` (sufijo de acceso privado omitido aquí) terminó en12turnos:
ambos mostraron `Result: TmtBeta`, sin errores de elección. Log incluye aviso real
«This battle is invite-only!», tier y `tmt2data` de la identidad canonical v0.1.0.

Replay JSON descargado desde beta, cargado como archivo en alpha y recargado:
`Replay result: TmtBeta`, las seis especies y Bird/Bird/Bird. Usa el parser/Dex
real del cliente con BattleSceneStub, sin graphics ni recursos externos (0 recursos
fuera de origin). `test/fixtures/tmt2-browser-replay.json` conserva el log registrado
por alpha; elimina el room capability/sufijo y añade clasificación de evidencia,
no fixture ROM ni battle synthetic. Prueba automática lo reproduce con Battle real,
mod aislado y tipos/result. Replay exige tier, dataset/version/catalogHash y win;
rechaza drift/incompleto/auth/private request payloads, sin fallback a Dex oficial.
Live drift cierra conexión y retira elecciones. El artefacto no es autosuficiente
para gráficos: requiere el cliente local de estos pins y su catálogo generado;
no depende de hosting ni descarga oficial para su validación.

Errores/flows comprobados: EV252 import manipulado fue rechazado por servidor
`rattata: EVS must all be 0`; cancelación quitó challenge y deshabilitó Accept;
retry inmediato fue bloqueado por cooldown heredado10s, conservado. Retry tras
esperar creó una partida nueva. Primer probe reveló doble envío de rqid y falta de
animation globals al reproducir flinch; corregidos mediante latch por request y
skip de animación cuando SceneStub no anima. Tests ejercen ambos. Se corrigió el
reset de selección de equipo al reload. Una repetición accidental alpha/alpha no
se usa para certificar los dos premades; se repitió con beta y requests comprobados.
Hash de replay alterado fue rechazado con `dataset mismatch`; reload restauró el
replay válido. No se esconden esos intentos fallidos como acceptance.

Capturas temporales fuera de Git: `/tmp/tmt07-private-battle.png`,
`/tmp/tmt07-alpha-result.png`, `/tmp/tmt07-beta-result.png`, `/tmp/tmt07-replay.png`.
Artefacto descargado `/tmp/tmt07-actual-replay.json`; contiene sólo log de perspectiva
battle, no requests/auth/tokens. Se mantuvieron los límites de assets opcionales y
PHP/news. Se cerraron ambas sesiones y el launcher: exit143, lock ausente, ports8000/
8080 reutilizables, config persistente `noguestsecurity=false`. La excepción vive
sólo en ese proceso; no hay servidor con unsigned names al terminar.

Pins de esta revisión: server merge `4c21861353d77acf48b29e4b5c08a8b009d83fd3`
(código sin cambios TMT-07), client `34303b39fb6c423788f158058f0f5bea74d137ed`.
Ramas `feat/tmt07-private-journey` (server sin commit nuevo),
`feat/tmt07-private-client`, `feat/tmt07-browser-evidence`. Publicación eventual:
cliente primero, luego datos con pin fetchable; servidor ya fusionado. Si squash/
rebase altera consumerSHA, repin explícito y repetir core antes de merge datos.
No push/PR/merge/deploy ni etapas08+ hechos en este alcance.


Verificación final: repetición con controlador final y guard live de compatibilidad:
alpha/beta, ambos `compatible=true`, ganador TmtBeta, 11 turnos, sin error de
choices. Descarga, carga y reload del replay en cliente final: seis especies,
Bird/Bird/Bird, socket null y cero recursos externos. La inspección independiente
de consola descubrió `Config is not defined` en battle-log; bootstrap local
corregido antes del parser y cubierto por el mismo test. Perfil limpio posterior:
`errors=[]` y `console.messages=[]`, replay y reload aprobados. No se declara
limpia la consola de intentos previos. Capturas finales full-page:
`/tmp/tmt07-alpha-final.png`, `/tmp/tmt07-beta-final.png`,
`/tmp/tmt07-replay-final.png`; replay descargado `/tmp/tmt07-final-replay.json`.

`npm run ci:core` aprobado: datos39/0skip, server2406passing/74pending,
client56passing/1skip, typechecks/lints/builds, validación seed, integración,
manifest reproducible y lifecycle. La política existente excluye exactamente dos
casos DNS externos y suite upstream slow; no se declaran pasados ni hay cambio de
red/seguridad para ocultarlos. Assets opcionales/PHP-news siguen incompletos fuera
de esta página mínima. Tras pin/bootstrap final se repite core sobre commits
limpios y se comprueba manifest/check y generación sin drift. No fidelidad ROM,
playtest humano, TMT08+, gráficos completos ni CI remoto/publicación aquí.

## TMT-07 — corrección nativa verificada (2026-10-01)

Esta evidencia **supersede la aceptación prematura de la página plana**. La página
tmt2-private era un atajo de protocolo, no una necesidad arquitectónica. El cliente
nuevo ya tenía layout/controles; faltaban scripts locales BattleScene/animaciones
de moves y formatter. El cliente viejo dependía de config remoto. Se eligió el
nuevo para reutilizar sus selectores, desafíos, HP, log, tooltips y replay, sin
nuevo framework. La página plana queda explícitamente developer-only.

Bootstrap native loopback y datos locales fallan sin fallback remoto. Alpha/beta
se añaden sin borrar equipos guardados y el formato oculto aparece sólo en el
selector Challenge local (no ladder). /inviteonlynext usa el flujo normal.
Reconexión espera nombre confirmado; replay importado no intenta /join ni hosting.
El guard live/replay rechaza drift de dataset. Download replay JSON y Home's
file picker usan el parser y **BattleScene real**; public upload deshabilitado,
Copy/Visit sólo apunta a la sesión local. Otro perfil necesita el JSON compatible.

Assets: build-indexes invoca build-native-tmt2 con server limpio/SHA exacto.
Formatter MIT se compila del server/chat-formatter.ts pinneado; SVG text cards
locales deterministas muestran “sprite unavailable”; manifest registra fuente y
hashes. No upstream pull, ROM, BPS ni arte externo. Petición oficial de sprites
recibió403 y no se eludió. **Arte, trainers y audio originales siguen ausentes**:
cards no son sprites Pokémon, audio se omite sólo en este entry. Layout/animaciones
nativas funcionan; no se afirma acabado visual ni fidelidad ROM.

Prueba browser automatizada: dos perfiles independientes NativeFinalA/NativeFinalB
en testclient-new.html?~~127.0.0.1:8000. Choose name → Find a user → Look up →
Challenge → formato TMT2 Seed → alpha; beta eligió beta/Accept. Choose lead mediante
botones nativos; alpha recargó/rejoined durante turno1 bajo su nombre. Automatización
posterior clicó los botones reales /move y /switch, usando mayor basePower y el
choice-builder normal; no comandos battle falsificados ni win inyectado. Room
battle-gen9tmt2seed-24 (capability omitido) terminó turno11: ambos |win|NativeFinalB.
Ambos BattleScene, modgen9tmt2seed, arrays Bird/Bird/Bird y cero recursos fuera de
origin; errors=[] en los dos perfiles limpios finales.

Download desde alpha → tercer perfil independiente → Load local replay JSON →
reload: ganador NativeFinalB, BattleScene, mismo Dex/tipos, cero recursos externos.
Hash manipulado mostró “dataset mismatch” en popup nativo y no creó replay válido.
El último ajuste quitó un enlace psim.us heredado: se descubrió y corrigió un
error de montaje ChatTextEntry, luego reload/ended=true, sin excepción, errors=[],
publicLinks=0. La regresión anterior no cuenta como aceptación.

Cancel/retry desde controles nativos probado en el primer recorrido: cancel quita
desafío, retry espera cooldown10s. Equipo manipulado EV252 en memoria rechazado
por servidor “rattata: EVS must all be0” antes del combate; restaurado alpha. Primer
combate nativo también terminó NativeBeta/11turnos y su log saneado está en
test/fixtures/tmt2-native-browser-replay.json. Esa fixture es evidencia de browser,
no ROM/humano; su test unitario usa SceneStub, separado del recorrido nativo real.

Capturas finales: /tmp/tmt07-native-final-alpha.png,
 /tmp/tmt07-native-final-beta.png, /tmp/tmt07-native-final-replay.png.
Replay descargado: /tmp/tmt07-native-final-replay.json. Capturas no se comiten.
La carga por helper oficial de Biblioteca falló: tools/list request failed: network;
no archivo publicado ni intento de eludir acceso.

Seguridad: aprobación expresa nueva “autorizo”, únicamente noguestsecurity=true en
memoria. ss confirmó listeners127.0.0.1:8000/8080. Sin cambios auth/IP/throttle,
sin credenciales. Todos los perfiles propios cerrados; launcher PID58617 SIGTERM,
exit143, lock ausente, listeners ausentes, config persistente noguestsecurity=false.
No servidor unsigned activo al terminar.

Pins: server4c21861353d77acf48b29e4b5c08a8b009d83fd3 sin cambios nuevos;
client34ffc4952eaa2ff659450be812219aece00457c0. Publicación eventual cliente primero, datos después con
ese SHA fetchable. Servidor ya fusionado. Revisión visual del usuario pendiente;
no push/PR/merge/deploy, playtest humano ni etapas08+.


Verificación adicional sin servidor de batalla ni excepción guest: sólo static
127.0.0.1:8080. Replay cargó y recargó hasta win NativeFinalB con BattleScene real,
sin recursos externos. Se sustituyó el fondo Gen9 ausente por fx/bg-city.png ya
trackeado en el cliente; no asset descargado. Ese fondo destapó race de extracción
de paleta antes de PS: corregido con paleta local explícita, test de inicialización
sin PS, nuevo perfil limpio errors=[]. Captura final replay muestra estado Offline
porque no había servidor de batalla: es prueba de replay local autónomo, no un
fallo de aceptación live. Static y browser propios cerrados después; puertos libres.

Checks: npm test cliente final =61passing/1skip (5 regresiones nativas nuevas);
incluye build, ambos typechecks y lint --max-warnings0. CI-core preliminar completo
=datos39/0skip, server2406passing/74pending, client60passing/1skip, integración,
manifest reproducible, lifecycle. Se repite core con el último pin/background test.
Se mantienen dos exclusiones DNS y upstream slow, no acreditadas como pasadas.
Aviso heredado de PHP ausente/news durante build no afecta native battle/replay.

## TMT-07 — assets oficiales: evaluación local autorizada, transferencia bloqueada

2026-10-01: el usuario autoriza lectura/descarga mínima de recursos estáticos
públicos oficiales para evaluación local. No requiere nueva aprobación sólo para
descargarlos. No se autoriza distribución/publicación bajo derechos no verificados.
Las tarjetas siguen siendo un fallback provisional, no el resultado gráfico final.

Fuente primaria verificada: https://play.pokemonshowdown.com/sprites/ani/ y
/ani-back/ (Rattata y Floragato observados en índice), /sprites/trainers/ y
/sprites/categories/. Créditos: https://pokemonshowdown.com/credits, que identifica
proyectos/autores de sprites; no se encontró una concesión general de redistribución
de esos bytes por la licencia AGPL del código. No se aceptaron acuerdos nuevos.
Scope mínimo: ani/ani-back de rattata, eevee, froakie, nosepass, floragato, pidgeot;
avatares1/170, hojas Pokemon/Pokeball y arte de tipos estándar/categorías disponible.
Tipos TMT2 sin arte aprobado conservan etiquetas; audio no bloquea esta corrección.

Prueba real de acceso: HEAD a
https://play.pokemonshowdown.com/sprites/ani/rattata.gif falló curl exit56:
“CONNECT tunnel failed, response403”; proxy HTTP403 Forbidden, serverenvoy,
antes de llegar al origin. El lector web sí abre los índices, pero abrir ese GIF
devuelve “URL ... is not accessible via this tool”. No se eludieron restricciones
ni cambiaron controles de red. No bytes adquiridos, no SHA256 inventados, no asset
ejecutado/redistribuido. Siguiente paso concreto: transferir los archivos oficiales
mínimos mediante un canal soportado con acceso al origin; recién entonces pinnear
hashes, preservar originales, integrar dimensiones contra Dex pinneado y verificar
replay local sin noguestsecurity. No hay nuevo replay visual con sprites originales.
Repos de gameplay intactos, servidor/excepción apagados; gráfico final bloqueado.

## TMT-07 — auditoría de cierre (2026-10-02)

Master de datos verificado tras PR7: `854f128dfc3ba75f2c8af48c4bb9206865861448`.
Se integró ese master mediante merge local conservando el trabajo TMT07 y ambos
bloques de DEVELOPMENT; no se publicó esta rama. Servidor master/pin
`4c21861353d77acf48b29e4b5c08a8b009d83fd3`; cliente master
`8ad840a70e2c96c4382305cb4de105c1cc57e976`, rama nativa/pin
`34ffc4952eaa2ff659450be812219aece00457c0`. Ningún cambio nuevo en esos forks.

**Acreditado:** el recorrido nativo descrito arriba, no la página plana: selección
alpha/beta, challenge/accept, combate terminado, cancel/retry, rechazo EV252,
reload/rejoin y replay compatible con rechazo de drift. La fixture persistente
`test/fixtures/tmt2-native-browser-replay.json` conserva 156 líneas, turno11,
`|win|NativeBeta`, catalogHash/datasetHash y Bird/Bird/Bird. Su reproducción unitaria
se volvió a verificar; usa SceneStub y no constituye una prueba browser nueva.
Las capturas y el replay final de `/tmp` citados arriba ya no están disponibles en
este executor; la fixture en Git sí. Hay que volver a capturar evidencia visual.
No ZIP de sprites visible entre los adjuntos de esta tarea; búsqueda acotada de
Library tampoco encontró uno. Eso no prueba ausencia en otros chats ni providers.

**Assets para esa semilla:** las tres primeras filas son el mínimo para reemplazar
sprites/trainers/tarjetas de equipo (16archivos). Las dos últimas restauran iconos
estándar como mejora visual opcional; sus etiquetas legibles actuales no inventan
datos ni bloquean mecánicas. No se añade ese pulido como nuevo gate del ticket.

| Archivos originales | Uso y ruta oficial |
| --- | --- |
| `rattata.gif`, `eevee.gif`, `froakie.gif`, `nosepass.gif`, `floragato.gif`, `pidgeot.gif`, cada uno front/back (12) | `https://play.pokemonshowdown.com/sprites/ani/` y `/sprites/ani-back/`; el downloader de PR7 sólo cubre este grupo |
| `rosa.png`, `lyra.png` (2) | `https://play.pokemonshowdown.com/sprites/trainers/`; la fixture usa avatares265/102, mapeados en battle-dex-data.ts. Para otra prueba live se seleccionan esos dos mediante el control/comando nativo existente, sin ampliar catálogo ni seguridad |
| `pokemonicons-sheet.png`, `pokemonicons-pokeball-sheet.png` (2) | `https://play.pokemonshowdown.com/sprites/`; selección/preview y estados de equipo (normal, status, fainted, vacío) |
| Opcional: `Physical.png`, `Special.png`, `Status.png` (3) | `https://play.pokemonshowdown.com/sprites/categories/`; categorías de los11movimientos seleccionados |
| Opcional: `Normal.png`, `Dark.png`, `Water.png`, `Rock.png`, `Electric.png`, `Grass.png`, `Flying.png` (7) | `https://play.pokemonshowdown.com/sprites/types/`; exactamente los tipos estándar de especies/movimientos usados, sin arte inventado para tipos custom |

La propuesta previa de avatares1/170 corresponde a `lucas.png`/`hilda.png`, no
`1.png`/`170.png`; no eran los avatares reales de la fixture. No hacen falta para
reproducirla. Los índices oficiales corroboran los nombres; los bytes/hash/dimensiones
siguen pendientes, no verificados por leer índices. Fondo `fx/bg-city.png`, estilos,
fonts/logo, scripts de animación, formatter y efectos de movimientos ya están
locales. Audio permanece opcional; itemicons no es requisito con policy no-held-item.
No se necesita un catálogo completo de sprites ni `data/graphics.js` remoto si se
genera metadata acotada desde los originales validados.

**Implementación pendiente:** validar/pinnear origen/hash de los archivos recibidos
sin ejecutarlos ni publicarlos; conectar front/back y dimensiones reales en
getSpriteData (hoy siempre devuelve SVG96x96), avatares en resolveAvatar (hoy un
trainer genérico) e iconos/estados en getPokemonIcon. Categorías/tipos estándar
pueden seguir como etiquetas legibles o usar los iconos opcionales recibidos.
El generador todavía produce tarjetas: copiar GIFs por sí solo no cambia esas
rutas. Tipos custom conservan etiquetas exactas; ningún placeholder se cuenta como
gráfico final. Añadir regresiones de facing/dimensiones/hash/archivo faltante,
estados de Pokéball y ausencia de recursos externos, preservando formatos normales.

**Aceptación restante:** replay local con originales, avance/reload, tooltips,
HP/movimientos/log y cero recursos externos/errores; capturas nuevas para revisión
del usuario; checks finales de build/lint/typecheck/CI-core, generación y manifiesto
en los commits finales. El replay estático no requiere servidor ni excepción guest.
Repetir live con dos invitados sí requiere nueva autorización expresa únicamente
para noguestsecurity=true en memoria tras comprobar bind127.0.0.1 y retirar
proceso/listeners/opt-in al terminar. No se activó en esta auditoría; config
persistente false y puertos 8000/8080 libres. Exclusiones DNS/slow siguen vigentes.

Checks actuales: datos `npm test`47/0fail/0skip; `npm run typecheck`,
`npm run integration:check` y `npm run integration:test` aprobados. Cliente
`node --test test/tmt2-native.test.js`5/0fail/0skip. No se repitió batalla browser,
QA con sprites originales ni CI-core completo en esta auditoría documental.
Publicación eventual requiere revisión visual y autorización nueva: cliente
primero, datos después con pin cliente fetchable y CI remoto verificado. Servidor
ya está en master; sin nuevo PR servidor salvo cambio concreto necesario.
Derechos de evaluación local no autorizan redistribución de artwork ni despliegue.

### Evidencia recuperada y preparación independiente (2026-10-02)

Al reanudar el executor, las capturas y el replay final sí estaban conservados en
`.local/evidence/tmt07-native/`. Esto corrige la observación anterior sobre `/tmp`:
no son capturas nuevas ni sprites originales recibidos. El replay recuperado tiene
148 líneas, cero `|error|`, turno11 y `|win|NativeFinalB`; SHA256 del original
`09fdd6bc86ca40615d4b1894384ac61a43caf501c00077f3f46f90369b148605`.
Se conserva ahora como `test/fixtures/tmt2-native-final-replay.json` con procedencia,
separado del primer recorrido NativeAlpha/NativeBeta. Una regresión reproduce ambos
registros, tipos repetidos y rechazo de identidad alterada con SceneStub, no browser
nuevo. El primer registro mantiene su error de reingreso, pero su clave privada de
room fue sustituida por un nombre neutral; no se oculta el intento fallido.

El log recuperado `ci-core.log` acredita el core final de datos739ee968/server4c218613/
cliente34ffc495: datos39aprobadas/0omitidas, servidor2406aprobadas/74pendientes,
cliente61aprobadas/1omitida, builds/lint/typechecks, manifiesto y lifecycle aprobados.
SHA256 del log: `fde5a3b4e159dd5110276e09ec371bad490ff899901fac4362b8bc9c5758517a`.
Es evidencia histórica: no describe los commits nuevos ni valida artwork ausente.

PR8 del downloader sigue abierto en borrador, no fusionado, head
`615894b8921579bbf59f10b4e903482d2ced2fdb`; master datos continúa854f128df.
No ZIP/GIF/PNG originales nuevo visible en adjuntos ni búsquedas recientes; no se
repitió la descarga proxy-bloqueada ni se activó servidor guest. Entrada concreta
pendiente: `sprites.zip` de `npm run sprites:download -- --with-ui` en esa rama,
con16originales y manifest; sólo un ZIP completo, no una carpeta/report de fallo.
Rosa/Lyra corresponden al primer recorrido. El registro final usa avatares1/170,
renderizados entonces como cards genéricas; su regresión prueba protocolo, no
identidad visual de trainers. No se añaden Lucas/Hilda al paquete requerido:
la siguiente prueba visual debe seleccionar explícitamente los avatares aprobados
Rosa/Lyra. Tipos/categorías decorativos y audio siguen opcionales.

Cliente actualizado únicamente en fixtures/regresión, commit
`423bb07784f84aa6fc4173a7ec179fc1f688bcc3`: npm test62aprobadas/1omitida,
incluidos build, ambos typechecks y lint;6regresiones nativas aprobadas. Pin local
coordinado actualizado. Pendiente: importar originales verificados, rutas/facing/
dimensiones/iconos, QA browser/replay con esos originales y capturas nuevas,
CI-core de los cambios gráficos finales y revisión/publicación autorizadas.
Ninguna de esas aceptaciones se cierra con las cards recuperadas.

### Sprites recibidos; transferencia pendiente (2026-10-02)

El usuario entregó `sprites.zip`, `manifest.json` y `report.json`. Esto supersede
la observación anterior de adjunto ausente. Se pudo leer el manifiesto y el informe
completos en Library: declaran éxito16/16, exactamente los12GIF front/back de las
seis especies y los4PNG solicitados (Rosa, Lyra y ambas hojas de iconos), sin
rutas adicionales ni duplicadas. Todas las rutas y URLs declaradas corresponden
al origen oficial; los campos de tamaño y SHA256 tienen formato válido.
El ZIP declara816661bytes y SHA256
`533b8f4315c3c144d8397dc881600d92a5258ecd3c430025e420a1c85754d4ab`.
**Son metadatos leídos, no hashes/dimensiones/contenidos verificados contra bytes.**

La transferencia autorizada de los tres adjuntos falló sin instalar archivos en
el executor. Refrescar la transferencia del ZIP con sus identificadores completos
produjo el mismo fallo; no se eludió el acceso ni se modificó la red. El bloqueo
concreto es recibir localmente el ZIP para validar entradas, tamaños, hashes y
contenido de imágenes antes de importarlo. No hay evidencia de ZIP corrupto ni
necesidad de una carpeta sin comprimir o de repetir la descarga de sprites.
Reanudar con la materialización autorizada del adjunto `sprites.zip`, conservando
su identidad Library; luego comprobar su hash declarado y los16archivos, conectar
las rutas nativas y realizar el QA gráfico/replay pendiente. Las copias pequeñas
de ZIP usadas por pruebas unitarias anteriores son fixtures sintéticas, no este
paquete, y no pueden sustituirlo.

En esta reanudación no se cambió código del cliente/servidor, no se ejecutó una
batalla browser nueva ni se activó la excepción guest. Puertos8000/8080 libres y
`noguestsecurity=false` persistente. TMT-07 sigue parcial; derechos de
redistribución de artwork siguen sin verificar y no se publica el paquete.
Checks de este cambio documental: `git diff --check`, `npm test`47aprobadas/
0fallos/0omitidas y `npm run typecheck` aprobados. No se repitió CI-core completo
ni se validaron ZIP/imágenes/replay gráfico; el bloqueo de transferencia permanece.

### Sprites originales integrados (2026-10-02)

El nuevo adjunto directo `sprites.zip` resolvió el bloqueo de transferencia.
Se verificaron sus816661bytes y SHA256
`533b8f4315c3c144d8397dc881600d92a5258ecd3c430025e420a1c85754d4ab`.
El ZIP contiene exactamente17entradas permitidas: los16recursos de la tabla
anterior y `manifest.json`, sin rutas repetidas, traversal, symlinks ni entradas
cifradas. Tamaños/hashes de todos los archivos coinciden. Pillow12.3.0 decodificó
todos los cuadros GIF y píxeles PNG; dimensiones y conteos de cuadros coinciden
con el manifiesto. Su SHA256 es
`205c2188cc5428ed241c15fa8403c6b291d0a6ea8acf00f6a4fbc27ef83c7ca5`.
Los URLs oficiales son procedencia declarada por el manifiesto recibido, no una
nueva descarga HTTP propia ni prueba de artwork del ROM/derechos de redistribución.

Cliente `feat/tmt07-private-client`, commit
`bd7667d6593d7f335998c882e0f0fc24f3369e0d`: importador Node del ZIP pinneado,
validación no destructiva de inputs/symlinks/hashes, metadata visual ligada a
datasetHash y generación local sin red. `getSpriteData` usa GIF front/back y sus
dimensiones reales; `resolveAvatar` usa Rosa/Lyra; `getPokemonIcon` conserva los
recortes de hoja y estados Pokéball. Las otras entradas normales mantienen su
comportamiento. Se conservan cards rotuladas para previews sin paquete/avatares
fuera del par soportado; un paquete presente dañado falla, no activa fallback.
Los originales/cache/outputs están ignorados, sin artwork binario en Git. Ver
[setup reproducible](DEVELOPMENT.md#private-local-seed-battle-tmt-07) y
[pin de artwork](../../Pokemon-Too-Many-Types-2-client/tmt2/native-artwork.json).
Servidor permanece4c21861353d77acf48b29e4b5c08a8b009d83fd3, sin cambios nuevos;
el pin de CI cliente se actualizó a bd7667d6. Publicación futura: cliente primero,
datos después con ese commit fetchable. No se publica/fusiona/despliega ahora.

Checks: importación real exit 0; hashes de todos los outputs verificados;
generación repetida byte-idéntica (manifest SHA256
`2cafa8187b32156d06400fd481e2191d4e554ffc8cae41fd83d72f50f21c8675`).
Input explícito ausente rechazado sin cambiar outputs públicos. Tests cliente:
67aprobados/1omitido, incluidos7nativos y4del importador. La suite también pasó
en modo developer-placeholders con los originales temporalmente apartados y
restaurados después. `npm test` incluye build, ambos typechecks y lint.
`npm run ci:core` pasó datos47, servidor2406/74pendientes, cliente67/1omitido,
paridad/aislamiento, manifiesto reproducible y lifecycle HTTP/WS con SIGTERM 143,
lock retirado/puertos reutilizables. Dos tests DNS y upstream slow siguen excluidos
explícitamente del core; no se ejecutó el diagnóstico DNS en esta reanudación.
Log local `.local/evidence/tmt07-native/ci-core-original-artwork.log`, SHA256
`5b891ace3987b288c7fa7c3aa6212346c8db109f07522ea7757d0f79d51e5bea`.
Este core usó cliente bd7667d6 limpio y datos b186d036 con los cambios documentales/
pin actuales todavía sin commit; no se presenta como CI remota ni certificación ROM.

**Pendiente en ese checkpoint (supersedido por el QA siguiente):** no había captura browser nueva con los originales. Chromium abortó
con el sandbox SUID mal configurado y tampoco pudo usar el de namespaces. No se
cambió su configuración global ni se lanzó con `--no-sandbox`; se solicitó
autorización concreta para una instancia efímera local con ese flag, aún pendiente.
La prueba visual/replay y revisión del usuario siguen abiertas, por eso TMT-07
sigue parcial. La excepción guest del servidor no se reactivó: config persistente
false; el smoke sólo probó guests sin nombres firmados. No se afirma una nueva
batalla browser ni fidelidad ROM a partir de estas pruebas de generación/simulador.

## TMT-07 — QA nativo con sprites originales (2026-10-02)

Esta prueba **supersede el bloqueo visual/Chromium del checkpoint anterior**. El
cliente `feat/tmt07-private-client` en `37aeb63927ee625dd48ddb2744e23d29558777ee`
importó el ZIP validado arriba y generó los16recursos ligados al `datasetHash`:
12GIF front/back, Rosa/Lyra y dos hojas de iconos. La generación repetida produjo
el mismo SHA256 de manifest,
`2cafa8187b32156d06400fd481e2191d4e554ffc8cae41fd83d72f50f21c8675`.
El cliente corrige además el tooltip de velocidad a **Spe121** para Pidgeot a
nivel50, IV31, EV0 y naturaleza Hardy: el rango genérico previo incluía EVs
ilegales en este formato. Bird/Bird/Bird sigue visible y ordenado. El resto de
formatos conserva su presentación ordinaria. El pin del cliente quedó actualizado
en `ci/pins.json`; servidor sigue en `4c21861353d77acf48b29e4b5c08a8b009d83fd3`.

Dos perfiles Chromium independientes abrieron el cliente nuevo en
`127.0.0.1:8080/testclient-new.html?~~127.0.0.1:8000`. El selector/teambuilder
nativo mostró alpha y beta, sus seis iconos y el formato oculto. Ambos importaron
el replay browser registrado `test/fixtures/tmt2-native-browser-replay.json` y
mostraron perspectivas opuestas en `BattleScene` real: layout, HP, log, animación,
GIF front/back y avatares Rosa/Lyra decodificados en browser (16/16). Reload
conservó el replay compatible y terminó en turno11 con `NativeBeta` ganador;
`Dex.modid=gen9tmt2seed`. No hubo imágenes rotas, etiquetas `undefined`, errores
JS ni solicitudes fuera del origen local. Un replay con `datasetHash` manipulado
mostró “TMT2 server/client dataset mismatch” y no abrió sala de batalla.

Capturas locales ignoradas en `.local/evidence/tmt07-native/`:
`originals-alpha-final.png` (SHA256 `e3dff83a5e2201277b07106a2ffa67aa5da307928db1e51ddcff3ed7dec3dafc`),
`originals-beta-final.png` (`c08193084c7883223986abbe2df1135850c617158960c04592b6cff859ee09e4`),
`originals-premades.png` (`bc3220c746918ad8c654d1fea17c6406d0f7d18c15f40e73258f7e08aa1ad761`),
`originals-drift-rejected.png` (`d4eda86e5a2e75b36d2a5bdc032333e3473a529dcc3638383e393ff7f9e466f0`).
No se comitearon ni distribuyeron sprites/capturas. Guardarlas en Library con
el helper oficial falló antes de transferir archivos (`tools/list request failed:
network`); las rutas locales son la evidencia disponible.

Chromium requirió `--no-sandbox` en perfiles efímeros por el sandbox SUID/userns
inoperante en este contenedor; el usuario autorizó expresamente **sólo** esa
excepción local. No se activó `noguestsecurity` ni se repitió un desafío live;
el desafío, cancel/retry, reconexión, rechazo de equipo ilegal, batalla completa
y replay nativos previos constan arriba. Esta sesión agrega QA gráfico/replay con
originales, no playtest humano ni otra prueba de reglas ROM. Browser/perfiles y
servicios de prueba cerrados, puertos 8000/8080 y lock libres; configuración
persistente `noguestsecurity=false`.

`npm run ci:core` final aprobó datos47/0fallos, servidor2406aprobados/74pendientes
y cliente68aprobados/1omitido, además de paridad, builds, types, lint, manifiesto
reproducible y lifecycle HTTP/WS. Log local
`.local/evidence/tmt07-native/ci-core-native-visual-final.log` SHA256
`4f2f075cdecc0b12d6af3eaf755f097f7a3fa015fbb5073a7187329f02cd8466`.
Los dos tests DNS y upstream slow quedaron excluidos explícitamente de core;
`ci:network` no se ejecutó. Revisión visual del usuario aún pendiente antes de
publicación. TMT-08 y derechos de redistribución del arte siguen fuera de alcance.

## TMT-08 — Mega Pidgeot acotado y gate de Holy (2026-10-02)

Bases fusionadas: cliente 1737a360 y datos f48267f6; servidor 4c218613. El viejo
pin cliente 37aeb639 sigue alcanzable, con árbol igual al merge; no faltaba código.
La revisión visual TMT-07 sigue pendiente, independiente de esas fusiones.

Kobazco, [release v1.5.0, post 105](https://www.pokecommunity.com/threads/pok%C3%A9mon-too-many-types-2.539542/page-6),
confirma Mega Pidgeot Holy/Bird/Bird y disponibilidad de sus piedras. El registro
`provenance/mega-pidgeot.json` separa esos hechos de los campos heredados del
pin 2f5b2739: HP83 / Atk80 / Def80 / SpA135 / SpD80 / Spe121, No Guard y Pidgeotite.
Activación moderna antes de moves, un uso por lado y permanencia dentro del
combate son adaptación Showdown aprobada; no están medidos en ROM.

### Evidencia primaria que resuelve el gate

La consulta provisional Holy 1× queda supersedida, sin presumir aprobación: se
pudo abrir el enlace **Documentation** de la publicación oficial. Las observaciones
primarias recibidas del investigador de la conversación fueron corroboradas en
esa vista read-only el 2026-10-02. [Hoja del creador](https://docs.google.com/spreadsheets/d/1lclbDiHdUnETmFQRm0v_capEqSJaVBG2OsLuOJ6L9Kk/edit?usp=sharing),
columna Holy **BE2**, filas atacantes/columnas defensoras:

| Ataque | Celda | Contra Holy | Contra Holy/Bird/Bird en adaptación |
| --- | --- | --- | --- |
| Normal | BE3 | 1× | 1× |
| Dark | BE20 | 2× | 2× |
| Water | BE14 | 0.5× | 0.5× |
| Rock | BE8 | 2× | 8× |
| Electric | BE16 | 1× | 4× |
| Grass | BE15 | 1× | 0.25× |
| Flying | BE5 | 1× | 1× |

La última columna combina esos hechos con Bird de `seed-chart.json` y la
multiplicación por slot heredada del motor. No es una medición ROM. La hoja no
publica revisión numerada: no se atribuyen esos valores a bytes BPS v1.5.2.
`provenance/mega-pidgeot.json` fija celdas, fecha, limitaciones y campos heredados.
Fuentes falsas, hashes alterados y cambios en valores Holy fallan la validación.

### Contrato implementado y límites

Seed **0.2.0** mantiene las seis especies, sets y movimientos de 0.1.0; agrega sólo la forma
runtime Pidgeot-Mega, Holy, No Guard y Pidgeotite en beta Pidgeot. Formas iniciales
siguen prohibidas. No se pueden reasignar la piedra, habilidad o movimientos,
mezclar premades ni cambiar nivel50/IV31/EV0/Hardy. Las formas conservan HP y
learnset de base; el servidor crea el learnset propio de la mega desde el catálogo,
pues no existe un learnset upstream separado. Motor central y formatos normales
permanecen aislados. Callbacks No Guard/Pidgeotite son heredados, no generados.

Seis casos reales del mod prueban elección mega antes del move; HP158 / SpA155 / Spe141,
No Guard y un uso por lado; switches preservan mega y limpian tipos temporales;
combate nuevo restaura Bird/Bird/Bird; defensas por slot de los siete ataques;
STAB una sola vez por pertenencia; inputs ilegales y aislamiento Gen9.
El oráculo `addType/setType` prueba cuarto slot, reemplazo y reset **sintéticos**.
Soak/Trick-or-Treat y otras megas siguen excluidos del formato legal. No se utiliza
`addedType` para ninguno de los tres tipos permanentes. La fórmula ROM y pasivas
custom no están verificadas: se mantiene la adaptación aprobada el 2026-09-30.

`tools/integration/mega-replay.mjs --output NEW.json` reproduce una batalla completa
por el simulador real, semilla [1,2,3,4], beta contra alpha, elección Gust+mega,
resto elecciones default, victoria **MegaBeta**, turno 20. Sólo se exporta canal
espectador y se omiten timestamps de pared para determinismo; no se alteran eventos.
El fixture del cliente conserva método y hashes; CI lo regenera y compara exactamente.
El parser nativo resuelve Holy/Bird/Bird en turno 2 y el resultado final. No es una
batalla de dos navegadores ni playtest humano. Replays históricos 0.1.0 se conservan
intactos y son rechazados por 0.2.0: requieren su cliente/catalog original, sin fallback.

El ZIP entregado (SHA256 `533b8f4315c3c144d8397dc881600d92a5258ecd3c430025e420a1c85754d4ab`)
coincide con el ya importado y no incluye Mega Pidgeot. La forma usa card explícita
“sprite unavailable”; los seis GIF base/trainer/iconos conservan pins. No se baja
artwork, no se disfraza el GIF base como mega y no se comete el ZIP a Git.

### Verificación y coordinación

- `node --test tests/mega-data.test.mjs tests/seed.test.mjs`: 16 pasados.
- Servidor Mocha `--no-config test/main.js test/sim/tmt2-{integration,runtime,mega}.js --exit`: 47 pasados.
- Cliente `npm test`: 70 pasados, 1 omitido heredado; build/types/lint incluidos.
- `node tools/integration/verify.mjs`: paridad, aislamiento, stats y replay reproducible.
- Extracción a dos archivos nuevos y comparación:datos byte-idénticos; generación
  server/client también idéntica. Fixtures sintéticos siguen separados de producción.
- `npm run ci:core`: exit 0 con datos 56/0, servidor 2412/0 + 74 pendientes heredados,
  cliente 70/0 + 1 omitido heredado; build/typecheck/lint, extracción offline de
  índices, paridad y reproducción exacta del fixture, manifiesto y lifecycle pasan.
  Log local `.local/evidence/tmt08/core-active-final.log`, SHA256
  `66a6fa5b1e5b0daef71d94cdbddd70a4713c9f79d7e36ca4db3939efabb5b076`.
  Código probado: datos `c50a32a22a5bab069f70bdc315e02083c9f579b8`; el commit
  posterior sólo registra resultados/estado y se vuelve a verificar su manifiesto.
- DNS en vivo no corre en core; `ci:network` no ejecutado. El diagnóstico previo
  `IPtools should resolve unknown IPs correctly` timeout 2000ms permanece
  documentado, no se atribuye a la mega. Dos casos DNS y upstream `(slow)` se
  excluyen por la política existente; pendientes/omitidos no son aprobados.
- El hook opcional de noticias del build cliente advierte `php: not found`,
  sin fallar build/types/lint/tests. No se instala PHP ni se modifican esos hooks.
- Lifecycle: HTTP/WS, rechazo de ejecución concurrente, SIGTERM 143, lock retirado
  y puertos 8000/8080 liberados. `noguestsecurity=false` persistente; no excepción.

Checklist TMT-08: mega documentada y habilitada; elección/stats/ability/stone
heredados explícitamente; switches/reset/formas probados; tipos repetidos y cuarto
slot con oráculo de adaptación; contenido no verificado excluido. Completo en ese
contrato, sin afirmar fidelidad ROM ni cerrar la revisión visual TMT-07.

Compatibilidad en `ci/pins.json`: servidor `6fae9fe32a19db5e8b00f1f90b4637149a5aad82`,
cliente `813a3909579e1dc3e89ab3618c892a2d40d2d554`. Publicación eventual servidor→cliente→datos
requiere autorización nueva. No excepción guest ni browser nuevo ni trabajo TMT-09.
Rollback:detener servicios, volver conjuntamente a los tres masters previos a TMT-08,
instalar lockfiles y regenerar 0.1.0; conservar el ZIP fuera de Git. No mezclar hashes.
La revisión visual pendiente TMT-07 no queda cerrada por estas pruebas de adaptación.

## TMT-09 — Lote mínimo Bird/Crab (2026-10-02)

Entorno verificado operativo después de la desconexión. Ramas nuevas desde los
masters fusionados TMT-08: datos b4dccffe, servidor c7ec3c55, cliente 9c3bd50e.
Sus árboles son idénticos a los aprobados; no se sobrescribieron cambios locales.
Esos son los puntos de partida; los pins CI finales apuntan a las ramas coordinadas de este ticket;
el pin de hechos heredados sigue siendo 2f5b2739. No se aplican ROMs ni se baja arte.

Lote implementado: Pidgey Bird, Pidgeotto Bird/Bird y Krabby Crab. Las tres filas
están en la transcripción del creador entregada por Matías el 2026-09-30,
mensaje Sentinel_51eeebf3c58c8191af721b1ca6a7eceb: `21 Pidgey Bird`,
`22 Pidgeotto Bird Bird`, `280 Krabby Crab`. No se inventan coordenadas de celdas:
estas filas no fueron corroboradas de nuevo en el tab Species por este ejecutor.
La URL del tab no es legible con web aquí; la hoja pública enlazada por el creador
sí permite leer el chart. Esa distinción se conserva en procedencia por fila.

El chart primario [Documentation del creador](https://docs.google.com/spreadsheets/d/1lclbDiHdUnETmFQRm0v_capEqSJaVBG2OsLuOJ6L9Kk/edit?usp=sharing),
columna rotulada CRAB, filas atacantes Normal3/Dark20/Water14/Rock8/Electric16/
Grass15/Flying5:1×/1×/0.5×/1×/1×/0.5×/2×. Observado 2026-10-02 mediante el
link Documentation del [release oficial](https://www.pokecommunity.com/threads/pok%C3%A9mon-too-many-types-2.539542/).
Sin revisión ROM numerada. Bird reutiliza los cruces ya registrados; no necesita
inventar un nuevo chart ni un tipo ofensivo Crab.

Sets gamma (todo nivel50/IV31/EV0/Hardy, sin ítem):
- Pidgey, Keen Eye: Gust / Wing Attack / Quick Attack / Protect.
- Pidgeotto, Keen Eye: Tackle / Wing Attack / Quick Attack / Protect.
- Krabby, Shell Armor: Vise Grip / Water Pulse / Leer / Protect.

El pin Gen9 contiene las habilidades y los cuatro movimientos nuevos
`wingattack`, `visegrip`, `waterpulse`, `leer`; todos los learnsets seleccionados
existen allí (algunos son entradas históricas permitidas por la adaptación).
Stats, split físico/especial, secundarios, prioridad y Shell Armor se heredan
explícitamente, no son hechos ROM. No se añade un ítem inventado.

Resultado: nueve especies base más Mega Pidgeot = diez especies/formas,
quince movimientos. Alpha y beta no cambian. Un tercer premade fijo **gamma** usa
las tres adiciones y el selector nativo existente; no habilita combinaciones libres
ni constituye TMT-10. El schema sólo amplía el límite de premades de 2 a 3.
Pruebas enfocadas aprobadas: metadatos/procedencia, learnsets, damage de cada adición,
Wing Attack físico, Leer (-1Def), confusión Water Pulse, bloqueo de críticos Shell
Armor, defensas Crab y doble Bird, legalidad gamma y aislamiento; conservación
TMT-08 y replay/hash deterministas. La CI coordinada final se registra debajo.

El ZIP local conserva sólo las seis especies originales. Los nuevos sprites y la
mega quedan explícitamente como cards, sin fallback remoto ni alterar los GIF pins.
QA visual del dueño y sprite Mega Pidgeot siguen abiertos por separado.
No publicación, TMT-10, issues ni despliegue bajo esta autorización.

### Verificación y entrega TMT-09

Dataset v0.3.0, SHA-256
`848de03952b707a48efa8e5c708ff1d32116912f38b0e0496882482acbb20a76`.
La preparación read-only desde los pins reproduce byte por byte
`normalized/seed.json`; ambos catálogos son generados desde ese archivo.
Los 70 cruces documentados incluyen los 63 anteriores y siete Crab.
Los demás cruces siguen la política de adaptación explícita existente.

- Datos: `npm test` — 59 aprobadas; `npm run typecheck` aprobado.
- Servidor: Mocha enfocado con `--no-config test/main.js test/sim/tmt2-integration.js test/sim/tmt2-runtime.js test/sim/tmt2-mega.js test/sim/tmt2-catalog.js --reporter dot --exit` — 55 aprobadas.
- Cliente: `node build` y `node --test test/tmt2-integration.test.js test/tmt2-native.test.js test/tmt2-private.test.js` — 23 aprobadas.
- `node tools/integration/verify.mjs` — identidad, exportación de los tres premades, aislamiento y replay reproducible aprobados. El replay 0.2.0 queda intacto; sólo el registro 0.3.0 es compatible con el catálogo actual. Sus eventos de combate coinciden después de excluir únicamente la línea de identidad del dataset.
- Los controles iniciales nuevos de Water Pulse y las aserciones source/version se corrigieron tras fallos de prueba; no se cambió RNG ni reglas de producción para hacerlas pasar.

ZIP recién adjunto validado con `build-tools/import-tmt2-artwork` en un directorio nuevo temporal: 16 assets coinciden con el pin revisado; SHA-256 ZIP
`533b8f4315c3c144d8397dc881600d92a5258ecd3c430025e420a1c85754d4ab`.
No se reemplazaron recursos ni se incorporaron binarios al historial.
Las tarjetas ausentes se derivan del pin de arte, no de archivos desaparecidos:
si falta un GIF original requerido, el cliente sigue fallando explícitamente.

Publicación eventual: servidor → cliente → datos, usando exactamente `ci/pins.json`.
Estos commits sólo son locales; no hay autorización para publicar TMT-09.
Rollback: conservar estas ramas y volver a los masters fusionados de inicio,
regenerar/build con sus pins; nunca resetear trabajo local ni mezclar el replay 0.3.0
con un catálogo anterior. No hubo cambios de configuración de seguridad ni servidor
guest nuevo. No se repitió la batalla de dos navegadores ni QA visual del dueño;
los nuevos sprites y la revisión visual siguen pendientes, no bloquean las pruebas
de comportamiento de catálogo ni equivalen a TMT-10.

`npm run ci:core` final — **exit 0** sobre el código coordinado en datos
7dba6c0, servidor fa680b70fe9753b1ba7ed37bc5cc1329f309f590 y cliente
0912c7b0a5797de35914a3027eb61882011e129b. Sólo el cierre de documentación
se añade después de esa ejecución. Datos 59 pass; servidor 2420 pass / 74 pending;
cliente 72 pass / 1 skip. Builds, tipos, lint, aislamiento, replay, snapshot
reproducible y lifecycle HTTP/WS/SIGTERM/lock/puertos aprobados.
Registro local ignorado: `.local/evidence/tmt09/ci-core-final.log`.

No ejecutado: `ci:network` (dos casos DNS vivos separados) y casos upstream
`(slow)` según política existente. Cuatro casos SQL opcionales permanecen
pending porque `better-sqlite3` no está instalado localmente; el resto de pending
y el skip del cliente conservan el baseline. El hook opcional de noticias sin PHP
y la advertencia npm sobre NODE_OPTIONS se reportan, no impiden exit 0.
La primera CI falló por una línea de iconos de 122 caracteres (límite120):
se corrigió sin cambiar comportamiento, se creó un commit ordinario y se actualizó
el pin. No se suprimieron warnings ni tests.

#### Aclaración del baseline pendiente antes de publicación

No hubo aumento local de pendientes de TMT-08 a TMT-09. El registro local final
TMT-08 `.local/evidence/tmt08/core-active-final.log` contiene 2412 pass / 74 pending;
el postmerge GitHub [37029721428](https://github.com/matiHirCab/tmt2-data/actions/runs/37029721428)
registró 2416 pass / 70 pending. Son entornos distintos. TMT-09 local registra
2420 pass / los mismos 74 pending, no cuatro nuevas exclusiones del catálogo.

Comparación exacta por nombres completos: `git ls-tree` del servidor fusionado
c7ec3c558663c153116a4ad6d535be56e3f6b517 seleccionó todos los archivos de pruebas
anteriores; `git diff --name-only ... -- test` demuestra que el único archivo
añadido/modificado es `test/sim/tmt2-catalog.js`. Inventarios Mocha `--dry-run
--reporter json` con la misma política core, uno con esa lista baseline y otro
con la lista actual, resultaron en 2486 vs 2494 casos y **listas idénticas de 74
pending**. Esto sólo inventaría los tests: las aprobaciones de ejecución provienen
de CI-core, no del dry-run. Comparación local reproducida:
`.local/evidence/tmt09/pending-comparison.json` y `test-inventory.json`.

Cuatro casos opcionales del grupo `SQLite worker wrapper` en `test/lib/sql.js`,
sin cambios de código, usan `common.hasModule('better-sqlite3') ? describe :
describe.skip`; aquí el módulo no se resuelve:
- should require you to prepare a statement before running
- should support both statement strings and corresponding statement classes
- should support both inline and object params
- should retrieve one line from Database.get

TMT-09 añade ocho casos activos y aprobados: identidad/stats/learnsets,
legalidad gamma y mutaciones, damage/split de las adiciones, defensas doble Bird
y Crab, Leer, secundario Water Pulse, Shell Armor y combate gamma completo con
aislamiento. Ninguna cobertura TMT-09 depende de SQLite. Los cuatro movimientos
nuevos son Wing Attack (`wingattack`), Vise Grip (`visegrip`), Water Pulse
(`waterpulse`) y Leer (`leer`): campos/callbacks/learnsets heredados del pin
Showdown 2f5b273925862ac242b419086c1e7a8868b51da1, `data/moves.ts#ID`,
no hechos de movimientos ROM. Conteo: nueve bases Rattata/Eevee/Froakie/Nosepass/
Floragato/Pidgeot/Pidgey/Pidgeotto/Krabby más **Mega Pidgeot** = diez especies/formas.


### TMT-10 — Editor nativo y equipos legales (2026-10-03)

Se verificaron las fusiones TMT-09: server `3e3089c41de054e37603e688748a7c14501a592b`,
client `39f8b4c7ddb027c22ae2fd780f8ab6806e090bbd`, data
`1936bdf838f5362af9d3f04c1a361891e7ff8318`. Sus árboles son idénticos a las ramas
revisadas y los pins anteriores siguen accesibles; no hubo una reparación de
historia. CI postmerge [37120511608](https://github.com/matiHirCab/tmt2-data/actions/runs/37120511608)
aprobó 59 tests data, 2424 server / 70 pending y 72 client / 1 skip.

**Cambio funcional acotado:** el TeamEditor existente ofrece alpha/beta/gamma,
import/export local y errores orientativos que coinciden con el gate del servidor.
Se mantienen los tres premades completos: no autoriza combinaciones libres.
Los formularios nativos de stats/detalles muestran level50/IV31/EV0/Hardy y no
permiten editar EVs, IVs, nivel, naturaleza o Tera; los stats reflejan esos valores
aunque el texto importado sea ilegal. Importar conserva los errores para corregirlos,
sin convertir silenciosamente EV252 en EV0. Validate conserva el comando `/utm`
y `/vtm` nativo: el servidor decide la aceptación. Los IDs de salas locales del
editor resuelven a room=null en `server/users.ts`, permitiendo estos comandos
globales; esto no cambia autenticación ni la política de salas.

DexSearch encuentra Grass/Magic/Cat en cualquiera de los tres slots y Bird/Crab.
Conserva Bird/Bird/Bird en el catálogo y excluye Mega Pidgeot como especie inicial,
pero no del Dex de batalla/replay. Recursos de samples/Smogon/pokepaste y publicación
de equipos no se usan para TMT2; los formatos ordinarios conservan su comportamiento.

La revisión de metadatos 0.3.1 añade únicamente shortDesc de movimientos, habilidades
y Pidgeotite desde `Dex.text` del pin Showdown
`2f5b273925862ac242b419086c1e7a8868b51da1`, con fieldSources y hash heredado.
No-item tiene descripción policy. Schema valida texto no vacío (máximo 1000 caracteres).
Hash seed `6c03764a0518d08bd6a5a92262d40f322308e291e47e9377be70fed91627118b`;
no añade especies, movimientos, hechos ROM ni callbacks. Las fixtures históricas
0.2.0/0.3.0 quedan intactas; la nueva fixture 0.3.1 reproduce los mismos eventos
de batalla TMT-08, cambiando únicamente identidad de dataset.

**Cobertura:** cuatro tests nuevos del editor ejecutan TeamEditorState real y
renderizan StatForm/DetailsForm con Preact: stats fijos, import/export, campos no
editables, búsqueda, aislamiento y descripciones del Dex. Cuatro tests server
ejercitan textos/packed teams legales y negativos. La verificación coordinada
compara 24 entradas válidas/ilegales con el gate autoritativo sin mutar los datos,
además de stats reales y replay. Estas pruebas no son capturas de navegador.

**Primer checkpoint visual (supersedido por el QA autorizado siguiente):** Chromium sandboxed aborta antes de cargar una página:
`setuid_sandbox_host.cc:166`, helper SUID sin propietario/permisos requeridos.
No se cambiaron permisos ni seguridad. La autorización puntual para un navegador
efímero sin sandbox, restringido a loopback, fue solicitada y sigue pendiente;
no se reutiliza ninguna excepción TMT-07. El recorrido visual, reload y popup
autoritativo en el editor no se declaran aprobados. TMT-10 permanece en curso.

El nuevo sprites.zip adjunto es idéntico al previamente registrado: SHA256
`533b8f4315c3c144d8397dc881600d92a5258ecd3c430025e420a1c85754d4ab`,
17 entradas / 16 assets más manifest. Inspección de nombres/tamaños sin ejecutar
contenido; no se añadió el ZIP ni arte binario a Git. No cubre los originales
ausentes de gamma/Mega ni resuelve derechos de redistribución.

**Verificación local final:** `npm run ci:core` aprobó data60 / 0 fail, server2424 /
74 pending, client76 / 1 skip / 0 fail, builds, ambos typechecks del cliente,
lint server/client, dataset y parity/replay. Su lifecycle HTTP/WS, rechazo de
operación concurrente, SIGTERM143, eliminación del lock y puertos liberados pasó.
Log `.local/evidence/tmt10/ci-core-final.log`. La primera ejecución falló por
indentación del nuevo test server; se corrigió exclusivamente con eslint --fix
y se volvió a ejecutar core completo, sin cambiar reglas de lint o excluir tests.
Dos `seed:prepare --output NEW.json` reproducen byte a byte normalized/seed.json;
`integration:check`, regeneración y nuevo check no cambian archivos consumidores.
`npm run ci:network` no ejecutado; dos casos DNS y upstream slow siguen separados.
Los 74 pendientes locales incluyen los cuatro SQLite opcionales ya documentados;
no son cuatro fallos TMT-10. El hook PHP opcional del build continúa ausente.

#### QA nativo autorizado de TMT-10 — 2026-10-03

Este registro **supersede el bloqueo visual anterior**. El usuario autorizó el
proceso temporal Chromium sin sandbox, únicamente contra la aplicación local.
Se usó agent-browser 0.38.2, Chromium del sistema, perfil efímero y allowlist
127.0.0.1/localhost; servidor8000 y cliente8080 ligados a127.0.0.1. Guest sin
nombre basta para `/vtm`; no se activó noguestsecurity ni otra excepción de
autenticación/IP/throttle. No cuentas, credenciales o publicación de replays.

El guard de dominios de agent-browser reemplaza WebSocket sin sus constantes
OPEN/CLOSED/etc: el worker nativo recibía datos pero dejaba los envíos en cola.
La prueba reprodujo OPEN=undefined en página/worker y queryresponse exitoso por
WebSocket directo. El harness restauró sólo esas constantes estándar en el
contexto de prueba y worker local, conservando guard/allowlist; ninguna corrección
de transporte o seguridad se introdujo en la aplicación. Esto debe reproducirse
al usar esa versión del harness; no confundirlo con un fallo del servidor.

**20 comprobaciones visuales aprobadas**, con controles reales del editor nativo:
- Alpha, beta y gamma: selección, exportación de texto, reimportación y popup
  autoritativo de aceptación; sets completos de tres especies.
- Paneles de stats/detalles sin inputs de EV/IV/naturaleza/nivel/Tera.
- Importación Level100/EV252 conservada, errores orientativos iguales al popup
  real de rechazo; reload conserva datos inválidos y su rechazo. Reparación con
  premade, validación repetida y reload de equipo válido aprobados.
- Búsqueda nativa Grass/Magic/Cat, Bird y Crab: resultados esperados en cualquiera
  de los tres slots, Bird/Bird/Bird visible y Mega excluida como starting choice.
- Información nativa de Water Pulse (20%), Shell Armor (critical hit) y Pidgeotite
  desde el catálogo local; stats reales del formato en los paneles correspondientes.
- Texto con forma Mega, Surf, No Guard, Leftovers, IV0, Tera y roster duplicado:
  rechazo orientativo y autoritativo iguales. Cancelar/botón Back y repetir búsqueda
  conserva el roster y sus valores; mayúsculas normalizadas no cambian identidades.
- Cero errores de página y, tras corregir CSS, recursos observados únicamente
  locales, sin fallback remoto de datos/arte.

**Correcciones descubiertas en browser:** vista de texto aún mostraba Tera; se
oculta sólo para TMT2. El packing/export estándar omite Level100: el editor TMT2
ahora lo conserva explícito para mostrar/rechazar el error después de reabrir o
recargar. El comportamiento de packing ordinario permanece igual. La pista del
importador TMT2 sólo ofrece texto exportado: no promete JSON arbitrario ni URLs
remotas. Finalmente sim-types.css contenía imágenes remotas para los glifos de
tipo; tmt2-local.css elimina sólo esos fondos, manteniendo etiquetas/colores del
cliente nativo. No se añade arte no fijado.

La regresión nueva renderiza el resumen real de TeamTextbox y demuestra Tera
ausente en TMT2/presente en gen9ou. Otra extensión prueba exportación/packing/
reapertura con nivel100 ilegal, además del packing ordinario sin cambios.
`npm test` cliente: 77 pass, 1 skip, builds, ambos typechecks y lint aprobados.

Artefactos locales de esta tarea (no archivos de Git):
`.local/evidence/tmt10/native-visual-results.json` (20 checks),
`native-teambuilder-review.png`, `native-beta-full-final.png`,
`native-invalid-import-server.png`, `native-invalid-reload.png`,
`native-unsupported-server.png`, `native-search-magic.png`,
`native-search-cat.png`, `native-search-bird.png`,
`native-fixed-stats-final.png`, `native-fixed-details.png` y
`native-lookup-water-pulse.png`/`native-lookup-shell-armor.png`/
`native-lookup-pidgeotite.png`. Los drivers y shim están bajo el mismo directorio
o /tmp; no forman un segundo framework/backlog ni introducen dependencias de CI.

Navegador cerrado y supervisor dev terminado con SIGTERM143; puertos8000/8080
liberados, lock retirado y config persistente noguestsecurity=false verificada.
No se modificó ninguna política de seguridad. QA automatizado, **no playtesting
humano ni fidelidad ROM**. La revisión visual del dueño y arte original de gamma/
Mega siguen separados del DoD funcional: no se declara acabado gráfico completo.

**CI-core local sobre las correcciones finales:** `npm run ci:core` aprobado con
data60 / 0 fail, server2424 / 74 pending, client77 / 1 skip / 0 fail, builds, lint,
typechecks, parity/replay y lifecycle HTTP/WS/SIGTERM/lock/puertos. Log
`.local/evidence/tmt10/ci-core-visual-final.log`. Pins exactos: server
`84d4617ea62a8d13b871310d11e55ae71df86e18`, client
`cb3d0b41664bd797a2dc42a616427485298af1f5`. No tests DNS/slow reetiquetados como
aprobados. Pendientes SQLite/skip/assets conservan los límites anteriores.
TMT-10 cumple el DoD funcional bajo adaptación: búsqueda, información/estadísticas
fijas, import/export, ausencia de edición EV y aceptación/rechazo claros reales.
No autoriza combos libres ni inicia TMT-11. PRs siguen en borrador: server
[#5](https://github.com/matiHirCab/Pokemon-Too-Many-Types-2/pull/5), client
[#6](https://github.com/matiHirCab/Pokemon-Too-Many-Types-2-client/pull/6), data
[#12](https://github.com/matiHirCab/tmt2-data/pull/12); orden eventual server→client→data.
CI remoto debe comprobar cada head publicado final antes del merge.
Rollback de revisión sin destruir trabajo: con los checkouts limpios y servicios
cerrados, `git switch master` en cada repo devuelve a las ramas locales previas;
las ramas feature/evidencia permanecen disponibles. No borrar assets/evidencia del
usuario ni hacer reset --hard. Si se fusiona, revertir commits coordinados en orden
inverso (data/client/server) como cambio revisable separado.


## TMT-11 — Regresiones acotadas y gates pendientes (2026-10-03)

Preparación independiente; **TMT-11 parcial**, sin afirmar fidelidad ROM ni dar
por aprobada la revisión visual del dueño pendiente en TMT-07. TMT-08/TMT-10
conservan sus contratos y límites; no se amplía catálogo ni se inicia TMT-12.

`tools/regression/simulator.mjs` y `tests/fixtures/tmt11-adaptation.json` fijan
cuatro casos del mod real: alpha/beta (gana beta, 21 turnos), beta/gamma (beta, 25),
gamma/alpha (gamma, 17) y beta-Mega/alpha (beta, 20). Cada caso valida ambos
premades con el servidor y termina en `win`. Dos ejecuciones completas deben dar
objetos replay idénticos; sólo se excluyen timestamps y canales privados.
Los hashes son caracterización de la adaptación aprobada, no nuevos oráculos de
ROM. Cambios en dataset/eventos/ganador/semilla/orden fallan sin actualizar solos
las expectativas. Seis pruebas unitarias sintéticas ejercitan fallos y alcance;
no se usan fixtures sintéticos para certificar que el mod juega.

Los controles ordinarios verifican EVs/nivel/Tera, inmunidad Ground de Pidgeot,
Dex Gen8/Gen9 y disponibilidad de Mew antes/después; las regresiones de mecánicas
TMT-06/08/09 continúan en la suite completa, sin sustituir el motor de daño.
Los nuevos pins son masters fusionados server `db159373b132babf016cf78ced737dec05d23d97`
y client `49af6c4d55835f69b4222956adf99f7b19b50fa7`; se verificó igualdad de árboles
con los inputs revisados de TMT-10. Dataset 0.3.1 / hash
`6c03764a0518d08bd6a5a92262d40f322308e291e47e9377be70fed91627118b`.

Comandos: `npm test` (66/66), `npm run typecheck` y
`npm run regression:check` (cuatro casos, repetidos, aprobados). Logs locales
ignorados: `.local/evidence/tmt11-data-tests.log` y `tmt11-simulator.json`.
`npm run ci:core` terminó con exit 0: datos 66/66, servidor 2424 passing /
74 pending, cliente 77 passing / 1 skip. Builds, lint, typechecks, validación,
paridad y regresiones aprobados. Lifecycle real HTTP/WS, rechazo de concurrencia,
SIGTERM 143, lock eliminado y puertos liberados aprobados; log ignorado
`.local/evidence/tmt11-ci-core.log`. Los dos tests DNS y suites `(slow)` mantienen
la separación/exclusión documentada; pending/skip no cuentan como aprobados.
Esto no constituye browser CI ni instalación limpia local. La ejecución remota
[37128415787](https://github.com/matiHirCab/tmt2-data/actions/runs/37128415787)
aprobó el commit de implementación `57e615e71f446902d50fdd3df9a736abab2c6e9d`
desde checkout e instalación limpia de los tres lockfiles: datos 66/66, servidor
2428 passing / 70 pending, cliente 77 passing / 1 skip; regresiones y lifecycle
aprobados. El resultado del head posterior de documentación se registra en
[PR #13](https://github.com/matiHirCab/tmt2-data/pull/13), sin pin autorreferencial.

**Gates concretos pendientes:** Chromium con sandbox no inició: helper SUID
mal configurado. No se ejecutó sin sandbox ni se alteraron controles/permisos.
La nueva autorización solicitada sigue pendiente. Falta automatizar los flujos
nativos en CI y la revisión visual del dueño de TMT-07; no se reaprovecha permiso
cerrado ni se marca Done por capturas históricas.

El ZIP `sprites.zip` recibido se inspeccionó sin extracción/ejecución: dieciséis
archivos tienen tamaños y SHA-256 iguales a su manifiesto. SHA-256 del archivo
`533b8f4315c3c144d8397dc881600d92a5258ecd3c430025e420a1c85754d4ab`.
Coincide archivo por archivo con el lote local previamente validado (16/16).
Es el lote original de seis especies más UI; no aporta sprites de las nuevas
adiciones ni prueba derechos de redistribución. No se añadieron assets al Git.
