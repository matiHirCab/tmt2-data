# TMT-02 — Reglas, base y casos de referencia

Evidencia de [TMT-02 en el backlog único](ROADMAP.md#tmt-02--reglas-y-casos-de-referencia),
no un segundo plan. Estado: **parcial: contrato inicial acotado; faltan expected ROM mínimos y política competitiva**.
Revisión 2026-09-30. Entrada fijada: SRC-05 v1.5.2 por SHA-256 en
[registro de fuentes](../provenance/sources.json). Integridad BPS no demuestra reglas.

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
existir en el Dex **no implica legalidad**. La matriz no es evidencia ROM.

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

Otros comportamientos heredados que requieren confrontación:

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

## Especificaciones de oráculo reproducibles — todas pendientes

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

Tras medir, convertir cada resultado verificado en prueba de servidor/Dex y caso
cliente/replay con la misma versión. Hasta entonces son protocolos pendientes,
no tests de fidelidad aprobados. Casos mega/4ºtipo también alimentan TMT-08 sin
implementar esa etapa ahora.

## Semilla mínima recomendada y decisiones competitivas

### Contrato inicial acotado

No exige resolver todo TMT2. Los requisitos de datos de esta tabla
se ejecutan en TMT-04 para los sets aceptados; TMT-02 fija reglas y expectativas.
No se han implementado legalidad ni mecánicas de etapa 2.

| Regla | Estado / condición de aceptación |
| --- | --- |
| EV0; rechazar EVs no cero | NoEV documentado por creador; prohibición de formato propuesta. Fórmula de stats aún pendiente |
| Tipos como array ordenado, sin deduplicar | Repetición documentada; conservar datos. No aprobar especies repetidas hasta REF-01/02 |
| Chart por pareja de tipos | Cinco observaciones SRC-03 registradas abajo; verificar sólo las parejas usadas, con versión/proveniencia |
| STAB y daño ordinario | Producto defensivo por entrada y STAB único ×1.5 son hipótesis heredadas; requiere oráculo, no hechos ROM |
| Stats/categoría/moves | Seis base stats, naturaleza/IVs, categoría, potencia, precisión, PP, prioridad, flags y learnset verificados para cada set; no tomar valores del Dex base como ROM |
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
La agrupación no es balance validado. Dos equipos de tres quedan sujetos a política.
Mega Pidgeot permanece candidato de oráculo futuro, excluido de esta semilla.

### Referencia mínima que desbloquea reglas

Para TMT-02 bastan **dos combatientes de referencia**, no seis filas completas.
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

| Política | Recomendación de producto | Pendiente antes de aceptar |
| --- | --- | --- |
| Formato | Singles privado, unranked, dos premades | Confirmación del usuario; no ladder/cláusulas automáticas de OU |
| Nivel | Proponer nivel fijo 50 para comparar; 100 es alternativa | Elección competitiva, no ROM universal. Battle Challenge 3v3/50 no define todo el juego |
| Tamaño | Proponer 3 por equipo para primer combate (6 especies); 6v6 alternativa posterior | Usuario elige; no inferirlo del postgame |
| IV/naturaleza | Controlar valores explícitos; IV31 como propuesta simplificadora, EV0 obligatorio por política noEV | IVs reales/stat oracle, efectos Hidden Power y naturalezas; nunca sustituir unknowns por 31 |
| Legalidad | Lista permitida de sets comprobados; rechazar choices/EVs no soportados | Learnsets/abilities/items y mensajes claros; no heredar prohibiciones de ladder sin decisión |
| Transformaciones | Sin Tera/Dynamax/Z ni mega no verificada en primera semilla | No hay autorización documental de esas reglas como formato TMT2 |

## Inspección estática del parche y cierre pendiente

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

**Bloqueos de cierre TMT-02:** expected de stats y STAB/daño ordinario respaldados
por fuente semántica del build o experimento mínimo; confirmar política competitiva.
Los datos completos de seis candidatos son de **TMT-04**, no un bloqueo añadido
al DoD de TMT-02. Dos fichas de controles sólo son inputs del experimento.
No falta otro BPS. El stream BPS contiene instrucciones/literales sin mapa de
símbolos verificado: CRC y offsets no identifican un cálculo ni el código activo.
No basta citar el proyecto RHH de los créditos para afirmar qué commit/config usa
este build. Ningún binario desconocido se ejecutó, ni se aplicó ROM.

Pregunta concreta pendiente aquí: singles privado con premades 3v3/nivel50/IV31
(recomendado) o 6v6/nivel100/IV31; EV0, sin ranking, cláusulas OU ni transformaciones.
Los valores de nivel/tamaño/IV permanecen null hasta respuesta. La decisión del
padre de ingeniería Gen9 sí queda registrada, separada de esa política.

### Revisión del DoD, sin cambiarlo

| Criterio canónico | Estado | Evidencia / falta exacta |
| --- | --- | --- |
| Matriz regla → fuente/oráculo → caso esperado | Parcial | NoEV, secuencia de tipos y split documentados; cinco parejas de chart. Expected heredados reproducibles de daño/stats. Falta expected ROM para stats y STAB/daño ordinario; no sustituirlo por tests Showdown |
| Generación justificada | Cumplido como decisión de ingeniería | Gen9 seleccionado: chart moderno/split, efectos modernos mencionados y Dex raíz del fork fijado. No prueba generación/fidelidad del ROM |
| Decisiones competitivas explícitas | Parcial | Recomendación y alternativa exactas; usuario aún no eligió nivel/tamaño/IV. No asumir aprobación |
| Faltantes que impiden semilla identificados | Cumplido | TMT-04 necesita seis filas y sólo dependencias de los sets; fuentes/licencias pendientes. Es inventario, no entrega de catálogo en TMT-02 |
| Sin conjeturas de duplicados/cuarto tipo/pasivas | Cumplido como límite del contrato | Representación preserva duplicados; REF-01…09 discriminan hipótesis. Especies repetidas, cambios de tipo, megas y efectos no verificados excluidos hasta evidencia; sin declarar expected ROM |

TMT-02 no requiere implementar runtime parity, legalidad, generación de catálogo,
client Dex ni combate: TMT-04…06 lo hacen con este contrato. Tampoco exige resolver
oráculos de contenido excluido. Sí necesita cerrar las expectativas de las reglas
ordinarias que el contrato inicial usaría. Por eso no se marca terminado.

Sin esos inputs se pueden ejecutar los controles heredados y CI ya existente;
no empezar TMT-04 ni afirmar fidelidad. TMT-02 continúa parcial. TMT-03 conserva
la CI remota verificada en [STAGE_1_VALIDATION.md](STAGE_1_VALIDATION.md#publicación-autorizada-y-ci-remota).
Derechos/proveniencia y publicación conservan sus gates del roadmap.

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
