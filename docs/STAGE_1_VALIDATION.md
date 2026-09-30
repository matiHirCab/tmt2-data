# Etapa 1 — Evidencia de implementación local

Backlog único: [ROADMAP.md](ROADMAP.md). No se inició ninguna etapa posterior.
Rama nueva `feat/stage-1-sources-ci`, creada desde el master fusionado
`ca95f141aabfa6e9ed68333577b279874973e8eb`, sin reutilizar la rama de PR #1.
No había cambios ajenos; no se modificaron fuentes de los forks ni permisos remotos.
No push, PR, merge, despliegue, issue o chat nuevo en esta etapa.

## TMT-01

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
  actionlint v1.7.7, con SHA-256 cotejado contra checksums del release. El comando
  `go` disponible aquí no era el compilador Go, por lo que no se utilizó para instalarlo.
- Sintaxis Node y `git diff --check`: verificados antes del commit final.

Instalación limpia y diagnóstico DNS separados: resultados finales se registran
al completar la verificación de los checkouts temporales; no declarados aprobados
por anticipado.

## Límites del estado

El workflow nuevo **no se ha ejecutado en GitHub**: la autorización actual excluye
publicar esta rama. TMT-03 queda implementado local, con primera ejecución remota
pendiente como parte de su DoD. No se cambió la configuración de Actions ni se
presupone una política administrativa que el conector no permite leer.
No hay CI de fidelidad/batallas TMT2 ni datos de producción. Se preservan el fallo
explícito de `workspace:data:validate`, el aviso de assets ausentes, el diagnóstico
DNS y el aviso opcional de PHP/noticias del cliente.
