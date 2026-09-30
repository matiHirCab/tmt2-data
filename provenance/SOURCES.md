# Registro de fuentes — TMT-01 (parcial)

Ticket y decisiones de alcance: [roadmap canónico](../docs/ROADMAP.md#tmt-01--registrar-fuentes-y-versión).
Registro estructurado: [sources.json](sources.json). Revisión: 2026-09-30.
Este registro identifica evidencia; **no es un catálogo de producción ni una
certificación de mecánicas**. `null` significa desconocido/no verificado, nunca cero.

## Fuentes y alcance de la evidencia

| ID | Fuente | Qué respalda | Límite |
| --- | --- | --- | --- |
| SRC-01 | [Hilo oficial, Kobazco/Too Many Productions](https://www.pokecommunity.com/threads/pok%C3%A9mon-too-many-types-2.539542/) | Emerald US como base indicada; no EVs; hasta tres tipos; enlace a documentación del creador | Anuncio/documentación, no tabla exhaustiva ni oráculo de fórmulas |
| SRC-02 | [Página 6, publicación #108](https://www.pokecommunity.com/threads/pok%C3%A9mon-too-many-types-2.539542/page-6) | Anuncio v1.5.2 el 11 de marzo de 2026 | Última versión encontrada en las fuentes revisadas; no identidad del archivo del usuario |
| SRC-03 | [Spreadsheet del creador enlazado por SRC-01](https://docs.google.com/spreadsheets/d/1lclbDiHdUnETmFQRm0v_capEqSJaVBG2OsLuOJ6L9Kk/edit?usp=sharing) | Documentación de tipos; investigación previa reportó Mega Pidgeot Holy/Bird/Bird | Documento mutable, sin export/snapshot/hash/versionado aprobado. La vista leída en esta sesión sólo expuso la tabla de tipos; no revalidó la fila de Mega Pidgeot |
| SRC-04 | [ZIP de referencia RA](https://github.com/RetroAchievements/RAPatches/raw/refs/heads/main/GBA/Hacks/Pokemon%20Emerald/37577-PokemonEmerald-TooManyTypes2.zip) | Metadatos BPS reportados por investigación previa (abajo) | Distribución de terceros, URL mutable; no se descargó de nuevo. No identifica el BPS del usuario ni demuestra permiso de redistribuirlo |
| SRC-05 | BPS del usuario, todavía no adjunto | Debe fijar la entrada exacta que se pretende implementar | Identidad, hash y cabecera del archivo siguen desconocidos |

## Entrada solicitada y referencia separada

En este mismo chat de trabajo se pidió:
**`Pokemon Emerald - Too Many Types 2 (v1.5.2) (kobazco).bps`**.
El usuario afirma tenerlo, pero todavía no se recibieron sus bytes. SHA-256,
tamaño de parche, CRC del parche, metadata y comparación con referencia: pendientes.

Referencia externa comunicada por el investigador que inspeccionó SRC-04:

- Tamaño de entrada: **16,777,216 bytes**; CRC32 esperado de entrada **1F1C08FB**.
- Tamaño de salida: **33,554,432 bytes**; CRC32 esperado de salida **D25FBCCC**.
- Estos campos pertenecen a la **referencia**, no al archivo del usuario.
- No consta aquí SHA-256/CRC del propio BPS ni commit fijo del ZIP. No inventarlos.

Al recibir el BPS: conservarlo fuera de Git, calcular tamaño/SHA-256, validar magia
BPS1 y estructura/CRC del parche, registrar tamaños y CRC esperados del trailer y
comparar con la referencia. No aplicar ni descargar un ROM. No copiar bytes del
parche al registro. Un trailer válido describe el resultado esperado, no verifica
un ROM base/salida real ni contiene una base de datos directamente consultable.

## Inventario de conocimiento y decisiones pendientes

- **Verificado en fuente primaria:** no EVs y hasta tres tipos se anuncian en
  SRC-01; v1.5.2 se anuncia en SRC-02. No se ha comprobado su ejecución en un ROM.
- **Observación documental previa conservada:** Mega Pidgeot Holy/Bird/Bird.
  Preservar orden y repetición al diseñar el esquema; fila/snapshot y semántica de
  daño/STAB todavía requieren verificación específica. No deduplicar por intuición.
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

Actualizar este registro con evidencia concreta al recibir el archivo. Mantener
TMT-01 parcial/bloqueado mientras su identidad exacta no esté verificada.
