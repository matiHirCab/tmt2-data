# TMT-02 — Reglas, base y casos de referencia

Evidencia de [TMT-02 en el backlog único](ROADMAP.md#tmt-02--reglas-y-casos-de-referencia),
no un segundo plan. Estado: **parcial/bloqueado por semántica/oráculos y decisiones**.
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
sólo la tabla; htmlview no estuvo accesible. Páginas 2/3 del foro respondieron 403;
no se eludió acceso. Hace falta documentación adicional o resultados legítimos.

## Comportamiento heredado y base provisional

Fork revisado: servidor `2f5b273925862ac242b419086c1e7a8868b51da1` (pins actuales).
El mod hereda datos/scripts, no sólo una etiqueta de generación. Las diferencias
siguientes se observaron en su Dex compilado; el callback de estados usa un harness
sin habilidades, no un combate completo. `Future`/`Past` son flags de catálogo;
existir en el Dex **no implica legalidad**. La matriz no es evidencia ROM.

| Base | Waterfall/Bite | Burn por turno sobre 160 HP | Speed 100 con parálisis | Rapid Spin potencia | Protosynthesis | Mega Pidgeot |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Gen 3 | Special/Special | 20 | 25 | 20 | Future | Future |
| Gen 6 | Physical/Physical | 20 | 25 | 20 | Future | actual |
| Gen 7 | Physical/Physical | 10 | 50 | 20 | Future | actual |
| Gen 8 | Physical/Physical | 10 | 50 | 50 | Future | Past |
| Gen 9 | Physical/Physical | 10 | 50 | 50 | actual | Past |

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

**Propuesta provisional de ingeniería: investigar Gen 9 como padre**, porque el
creador menciona efectos modernos que allí ya existen y es el Dex raíz del fork
(`data/scripts.ts`). Es minimizar reconstrucción, no afirmar fidelidad Gen 9.
Gen 7 sigue alternativa si los oráculos favorecen su timing/valores. Decisión real
`showdownBaseGeneration` permanece null. Antes de fijarla: medir split, estados,
mega/speed/prioridad, movepowers y efectos; inventariar overrides y legalidad.
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

Para mediciones empezar con **dos combatientes de referencia**, controles sin
pasivas/objetos y filas completas verificadas; no es la semilla jugable TMT-04.
Para TMT-04 recomendar el mínimo autorizado de **seis especies** y dos premades,
seleccionadas sólo tras resolver sus dependencias: control ordinario, triple tipo,
control de split y el menor conjunto de chart/moves/abilities/items/learnsets
necesario para usar esos casos. Mega Pidgeot es un candidato de oráculo, no una
fila de semilla aceptada: stats/ability/baseform no están completos. No hay aún
seis nombres/sets verificables; ninguna especie se aprueba sólo por existir en Dex.
Primera semilla excluiría megas, cambios de tipo y pasivas sin oráculo; si una
pasiva inherente no puede excluirse legalmente, excluir la especie.

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

**Bloqueos exactos:** chart/seed/export de documentación vinculado a v1.5.2;
definiciones de pasivas/moves/stats/learnsets; oráculos REF-01…09; generación y
políticas competitivas sin aceptar. Pregunta enviada en este mismo chat: si el
usuario puede probar su copia legítima en mGBA o aportar fuente/documentación.
No se requiere otro BPS y no se solicitó compartir un ROM.

Sin esos inputs pueden mantenerse CI y documentación, preparar el formato de
registro de observaciones y cotejar fuentes públicas permitidas. No se desbloquea
TMT-04 ni se implementa mod/combate. TMT-02 sigue incompleto. TMT-03 tiene CI remota verificada, con evidencia
en [STAGE_1_VALIDATION.md](STAGE_1_VALIDATION.md#publicación-autorizada-y-ci-remota). Derechos/proveniencia y publicación conservan sus gates del roadmap.

## Verificación de esta revisión

- `npm test`: 21 pasan, 0 fallan; pruebas propias, no oráculos ROM.
- `npm run typecheck`, `node --check tools/provenance/showdown-reference.mjs` y
  `git diff --check`: pasan.
- `npm run workspace:build`: código 0, builds normales de ambos forks; persiste
  aviso baseline `php: not found` para noticias opcionales del cliente.
- `npm run source:showdown-reference`: código 0; salida idéntica antes/después del
  build y en dos ejecuciones. Argumento inesperado: código 1, sin datos de éxito.
- Suite mega exacta arriba: 9 pasan; ningún test del juego ejecutado.
- Perfil CI completo/DNS no repetido: scripts, pins y fuentes de forks intactos;
  resultados anteriores siguen en STAGE_1_VALIDATION.md. No se levantó UI nueva.
- Manifiesto local se regenera y coteja dos veces después del commit final.
  Ese fue el estado previo a la autorización de publicar PR #2; la actualización
  remota y el historial de corrección del pin están en STAGE_1_VALIDATION.md.
