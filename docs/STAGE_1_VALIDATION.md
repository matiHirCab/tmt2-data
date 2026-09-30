# Etapa 1 — Evidencia de implementación local y CI remota

Las secciones iniciales registran el estado previo a la autorización de publicación.
La [actualización remota](#publicación-autorizada-y-ci-remota) supersede sus pendientes
de publicación/primera CI; preserva los resultados históricos y límites de datos.

Backlog único: [ROADMAP.md](ROADMAP.md). No se inició ninguna etapa posterior.
Rama nueva `feat/stage-1-sources-ci`, creada desde el master fusionado
`ca95f141aabfa6e9ed68333577b279874973e8eb`, sin reutilizar la rama de PR #1.
No había cambios ajenos; no se modificaron fuentes de los forks ni permisos remotos.
No push, PR, merge, despliegue, issue o chat nuevo en esta etapa.

## TMT-01 — Estado histórico previo a recibir adjuntos

Registro de fuentes primarias leído/creado, campos desconocidos explícitos y
metadatos de referencia separados del input del usuario. Se solicitó el BPS exacto
en este mismo chat. **Parcial/bloqueado:** no se recibieron bytes, no hay hash de ese
archivo, no se inspeccionó/aplicó un ROM y no se ha elegido generación Showdown.
La lectura de la hoja confirmó su procedencia desde el hilo oficial y expuso la
tabla de tipos; la fila Holy/Bird/Bird sigue como observación de investigación previa,
no como una fila revalidada/snapshot fijado ni prueba de su fórmula de STAB.

## TMT-03: comprobaciones locales

Entorno: Node 24.19.0, npm 11.9.0, Git 2.52.0. Pins de forks y herramientas en ci/pins.json.

- `npm test`: **16 pasan**, 0 fallan. Incluye 13 pruebas de coordinación previas y
  tres nuevas de pins estrictos/no destructivos y selección exacta de tests DNS.
- `node tools/ci/pins.mjs verify`: coincide Node/npm/HEADs y árboles hermanos limpios.
- `npm run ci:core`: éxito local. Tests de datos y typecheck; builds normales;
  lint y TypeScript del servidor; **2365 tests servidor pasan, 74 pendientes**;
  cliente build/typechecks/lint y **21 tests pasan, 3 omitidos**. La suite de texto
  de 22 casos no se instancia sin assets: no se atribuyen 45 passes a esta ejecución.
- El perfil core no ejecuta **dos** casos DNS: se declaran por nombre exacto en
  tools/ci/policy.mjs y en la salida. No se alteró el resultado de tests upstream.
- Manifiesto generado/recalculado idéntico; smoke real HTTP/WS, rechazo de comandos
  simultáneos, SIGTERM 143, lock eliminado y puertos liberados.
- `actionlint .github/workflows/ci.yml`: sin errores. Se usó el binario oficial
  actionlint v1.7.7, con SHA-256 cotejado contra checksums del release.
- Sintaxis Node y `git diff --check`: verificados antes del commit final.

### Instalación limpia y diagnósticos separados

Se crearon tres worktrees temporales separados, con datos en el commit de
implementación `3fa03a8` y los dos forks en sus pins exactos. En cada uno se ejecutó
`npm ci --no-audit --no-fund`, sin reutilizar node_modules del workspace: las tres
instalaciones terminaron con código 0. Después, `npm run ci:core` en ese checkout
limpio terminó con código 0, reproduciendo **16 / 2365 / 21** tests aprobados y los
mismos pendientes/omisiones arriba indicados, manifiesto y ciclo de vida incluidos.
El ajuste final de descubrimiento de tests en `workspace:test` se verificó con
`node --test` (16 pasan); no cambia el perfil CI probado.

`npm run ci:network` terminó con **código 2**, dos fallos reales:

- `IP tools should resolve 127.0.0.1 to localhost`: respuesta `ip6-localhost` frente
  a `localhost` esperado.
- `IP tools should resolve unknown IPs correctly`: timeout de 2000 ms.

Son los mismos casos reproducidos anteriormente sobre el baseline sin cambios,
con evidencia en [BASELINE_COMPARISON.md](BASELINE_COMPARISON.md). No se declararon
aprobados, no se modificaron DNS ni tests upstream. El workflow permite ejecutarlos
explícitamente y conserva el fallo del job. El core excluye sólo esos dos casos y
los `(slow)` que ya excluía upstream.

Logs locales (ignorados por Git): `.local/verification/stage-1/`. Tras el commit
final se regenera el manifiesto dos veces y se comprueba igualdad y HEAD actual;
el manifiesto es un artefacto local, no una certificación de datos de producción.

## Límites del estado

El workflow nuevo **no se ha ejecutado en GitHub**: la autorización actual excluye
publicar esta rama. TMT-03 queda implementado local, con primera ejecución remota
pendiente como parte de su DoD. No se cambió la configuración de Actions ni se
presupone una política administrativa que el conector no permite leer.
No hay CI de fidelidad/batallas TMT2 ni datos de producción. Se preservan el fallo
explícito de `workspace:data:validate`, el aviso de assets ausentes, el diagnóstico
DNS y el aviso opcional de PHP/noticias del cliente.

## Actualización tras recibir el BPS

La petición anterior está satisfecha: se recibieron BPS v1.5.2, v1.4.0, v1.4.0 Alt
y readme en este chat. [PATCH_INSPECTION.md](../provenance/PATCH_INSPECTION.md)
supersede el bloqueo por falta de archivo. TMT-01 termina el registro con límites
explícitos; TMT-02 sigue pendiente. Los tres parches pasan estructura/CRC y el
readme sólo declara la base. No se aplicaron ROMs ni se importaron datos.

`npm test`: 21 pasan (16 previos + 5 de inspección/consistencia);
`npm run typecheck` y `git diff --check`: pasan.
`workspace:data:validate`: código 1 esperado; dataset de producción ausente.
Los perfiles core/network y la instalación limpia anteriores no se repitieron:
no cambiaron sus scripts, pins o los forks; el perfil core descubrirá las nuevas
pruebas automáticamente. No hay ejecución remota autorizada.

## Publicación autorizada y CI remota

El usuario autorizó publicar esta rama y abrir PR en borrador el 2026-09-30.
[PR #2](https://github.com/matiHirCab/tmt2-data/pull/2), base master, rama
`feat/stage-1-sources-ci`; no merge/despliegue ni cambios de settings/protecciones.
Se revisaron los 26 archivos cambiados antes del push: texto/metadata, sin binarios
ROM/BPS, credenciales ni rutas de checkout específicas.

- Primer commit publicado `5e0060e4b05729cbb6313e5324c2650fb448713e`: el
  [run 36749315578](https://github.com/matiHirCab/tmt2-data/actions/runs/36749315578)
  falló en `Set up job`, antes de tests. `actions/checkout` tenía un carácter de más
  en el pin. No fue un fallo upstream ni una prueba aprobada.
- Se cotejó el tag v6 por Git y API primaria y se corrigió checkout a
  `d23441a48e516b6c34aea4fa41551a30e30af803` (40 hex). El pin de setup-node
  permaneció correcto. Se añadió una prueba que rechaza pins de Actions mal
  formados/flotantes. `npm test`: **22 pasan**; typecheck/actionlint/diff-check pasan.
- Commit `e1cd28fc181fbe52946b0d0b04104b2e2d3e0441`: el
  [run 36749458158](https://github.com/matiHirCab/tmt2-data/actions/runs/36749458158)
  terminó **success**; todos los pasos del job core y post-checkouts pasaron.
  Tres instalaciones lockfile, Node/npm/commits exactos, permisos read-only.
  **21 tests propios** (antes de la nueva prueba del pin), **2369 servidor / 70
  pendientes**, **21 cliente / 3 omitidos**. Typechecks/lint/builds, manifiesto
  reproducible y HTTP/WS, rechazo de concurrencia, SIGTERM143, lock/puertos: pasan.
- La diferencia local **2365/74** → runner **2369/70** mantiene 2439 casos.
  Localmente `better-sqlite3` no está instalado y la suite condicional
  `test/lib/sql.js` da exactamente 0 pasan/4 pendientes (reproducido por separado).
  CI instaló 355 paquetes de servidor frente a 282 en la instalación limpia local;
  los cuatro pases adicionales son consistentes con esa dependencia opcional.
  El reporter dot remoto no enumera casos: la atribución por nombre es una
  inferencia explícita, no un log de cuatro resultados individuales.
- DNS: los **dos** casos exactos no se ejecutaron en core; sus fallos locales
  baseline se conservan. No se ejecutó aquí workflow_dispatch de diagnóstico.
  Slow/pendientes upstream y assets cliente ausentes no se ocultaron.
- Se conserva la alerta de cliente incompleto en el smoke. Producción permanece
  ausente/no validada y no hay prueba de gameplay TMT2. TMT-02 sigue parcial.

Esta primera ejecución remota satisface el pendiente de TMT-03. La prueba preventiva
y esta actualización documental se publican como commits ordinarios posteriores;
la PR conserva los checks de cada commit y se verifica su head final antes de
entregarla. No se registran por anticipado resultados del head final.
