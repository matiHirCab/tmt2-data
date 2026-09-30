# Registro de fuentes — TMT-01

Ticket y decisiones de alcance: [roadmap canónico](../docs/ROADMAP.md#tmt-01--registrar-fuentes-y-versión).
Registro estructurado: [sources.json](sources.json). Revisión: 2026-09-30.
Este registro identifica evidencia; **no es un catálogo de producción ni una
certificación de mecánicas**. `null` significa desconocido/no verificado, nunca cero.

## Fuentes y alcance de la evidencia

| ID | Fuente | Qué respalda | Límite |
| --- | --- | --- | --- |
| SRC-01 | [Hilo oficial, Kobazco/Too Many Productions](https://www.pokecommunity.com/threads/pok%C3%A9mon-too-many-types-2.539542/) | Emerald US como base indicada; no EVs; hasta tres tipos; enlace a documentación del creador | Anuncio/documentación, no tabla exhaustiva ni oráculo de fórmulas |
| SRC-02 | [Página 6, publicación #108](https://www.pokecommunity.com/threads/pok%C3%A9mon-too-many-types-2.539542/page-6) | Anuncio v1.5.2 el 11 de marzo de 2026 | Última versión encontrada en las fuentes revisadas; no identidad del archivo del usuario |
| SRC-03 | [Spreadsheet del creador enlazado por SRC-01](https://docs.google.com/spreadsheets/d/1lclbDiHdUnETmFQRm0v_capEqSJaVBG2OsLuOJ6L9Kk/edit?usp=sharing) | Documentación de tipos; fila de especies pendiente | Documento mutable, sin export/snapshot/hash/versionado aprobado. La vista leída en esta sesión sólo expuso la tabla de tipos; no revalidó la fila de Mega Pidgeot |
| SRC-04 | [ZIP de referencia RA](https://github.com/RetroAchievements/RAPatches/raw/refs/heads/main/GBA/Hacks/Pokemon%20Emerald/37577-PokemonEmerald-TooManyTypes2.zip) | Metadatos BPS reportados por investigación previa (abajo) | Distribución de terceros, URL mutable; no se descargó de nuevo. No identifica el BPS del usuario ni demuestra permiso de redistribuirlo |
| SRC-05 | BPS v1.5.2 adjunto por el usuario | Identidad SHA-256, estructura BPS1 y CRC del parche verificados | Nombre/CRC no autentican release del creador; ROM no aplicado |
| SRC-06 / SRC-07 | BPS v1.4.0 y v1.4.0 Alt adjuntos | Identidades distintas, estructura/CRC verificados | Comparación solamente; significado de diferencias desconocido |
| SRC-08 | readme.txt adjunto | Base declarada y hashes, tamaño/CRC compatibles con cabeceras | Declaración del documento; ningún ROM base verificado |

## Entrada solicitada y referencia separada

El BPS solicitado y los archivos adicionales se recibieron en este mismo chat.
Los tres se inspeccionaron localmente; resultados completos y comandos reproducibles
en [PATCH_INSPECTION.md](PATCH_INSPECTION.md). La entrada seleccionada es SRC-05
(v1.5.2 según el nombre), SHA-256
`722bcd1f0d186284509d41cfbfc0c697b350a1c9cb836962d3bd3e4be8b5e3da`.
Metadatos BPS vacíos. El readme se registra como declaración de base, no como
instrucciones autorizadas ni permiso de redistribución.

Referencia externa comunicada por el investigador que inspeccionó SRC-04:

- Tamaño de entrada: **16,777,216 bytes**; CRC32 esperado de entrada **1F1C08FB**.
- Tamaño de salida: **33,554,432 bytes**; CRC32 esperado de salida **D25FBCCC**.
- Estos campos pertenecen a la **referencia**, no al archivo del usuario.
- No consta aquí SHA-256/CRC del propio BPS ni commit fijo del ZIP. No inventarlos.

Se conservaron los adjuntos fuera de Git y se verificaron magia, cabecera,
action stream completo, bounds de copias y CRC del parche. Los tamaños y CRC
esperados de SRC-05 coinciden con la referencia reportada; no hay hash del BPS
externo para afirmar igualdad de bytes. No se descargó ni aplicó ROM alguno.
Un trailer válido describe un resultado esperado, no verifica una base/salida
real ni contiene una base de datos directamente consultable.

## Inventario de conocimiento y decisiones pendientes

- **Verificado en fuente primaria:** no EVs y hasta tres tipos se anuncian en
  SRC-01; v1.5.2 se anuncia en SRC-02. No se ha comprobado su ejecución en un ROM.
- **Revalidado en fuente primaria:** SRC-02, post #105, anuncia Mega Pidgeot
  Holy/Bird/Bird. No depende de la fila de spreadsheet aún no fijada. Preservar
  orden/repetición; semántica de daño/STAB todavía pendiente. También hay notas
  oficiales sobre split/Pure y efectos modernos; alcance en
  [RULES_REFERENCE.md](../docs/RULES_REFERENCE.md).
- **Pendiente:** stats completos, moves, habilidades/pasivas, ítems, learnsets,
  formas, valores de daño/STAB/inmunidad, interacción de duplicados y cuarto tipo,
  reglas de reset/cambio/switch; cobertura y licencias de assets/datos.
- **Decisiones competitivas aún abiertas (TMT-02):** generación base Showdown,
  nivel, tamaño de equipo y cláusulas. Singles privado/unranked con premades es
  una propuesta de producto; no inferir nivel/tamaño desde el postgame 3v3.
- **Supuestos explícitos:** ninguno se promueve a hecho ROM. Que el hack use
  Emerald/GBA no determina generación 3 de Showdown. El parche no cierra TMT-02
  sin fuentes semánticas y casos oráculo. CI no depende de recibir el parche.
- **Derechos/proveniencia:** no hay aprobación registrada de redistribución ni
  licencia seleccionada para el dataset; TMT-12 mantiene ese gate abierto.

TMT-01 cierra el registro de fuentes/entrada con sus límites explícitos. TMT-02
sigue pendiente de reglas y oráculos; datos de producción permanecen ausentes.
