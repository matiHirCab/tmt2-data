# TMT-01 — Inspección de adjuntos (2026-09-30)

[Backlog único](../docs/ROADMAP.md). [Registro estructurado](sources.json).
Los archivos se recibieron en el chat de esta tarea. Los nombres son etiquetas del
usuario, no firmas del creador. Se selecciona SRC-05 como entrada v1.5.2 para las
siguientes verificaciones. SRC-06/07 sólo se conservan como metadatos de comparación.
Binarios y rutas de la máquina no se guardan en Git.

| Fuente | Nombre / versión declarada | Bytes BPS | SHA-256 | CRC del parche | CRC de salida esperado |
| --- | --- | ---: | --- | --- | --- |
| SRC-05 | v1.5.2 (kobazco) | 19574303 | `722bcd1f0d186284509d41cfbfc0c697b350a1c9cb836962d3bd3e4be8b5e3da` | `4402A029` | `D25FBCCC` |
| SRC-06 | v1.4.0 (kobazco) | 19555012 | `1d3ce9e640e7cf0811afcea12a6239a7975360cb4ba062a8b5f33d78310449ad` | `6E6598A2` | `ABB50931` |
| SRC-07 | v1.4.0 (kobazco) (Alt) | 19555012 | `04c4ed24c670e5b384fcefe4dfa1e0aed370a90bcf1a4fd957a0a71e1780c54b` | `C16EF1F2` | `FBCE22F3` |

Los tres pasan magia BPS1, cabecera, límites de instrucciones/copias, cobertura
exacta del tamaño de salida, consumo exacto del stream y CRC32 del parche.
Metadata vacía en los tres. Todos declaran entrada **16777216 bytes**, CRC32
**1F1C08FB**, y salida **33554432 bytes**. No se reconstruyó la salida.
CRC32 del parche cubre todos sus bytes excepto los últimos cuatro; los CRC32 de
entrada/salida sólo son valores esperados del trailer. No fueron comprobados
contra ROMs. SHA-256 y CRC del parche fueron cotejados independientemente con
Python `hashlib` / `zlib`, además del inspector Node.

El readme adjunto tiene 380 bytes y su hash consta en sources.json. Declara
`Pokemon - Emerald Version (USA, Europe).gba`, 16777216 bytes, CRC32 `1F1C08FB`,
MD5 `605B89B67018ABCEA91E693A4DD25BE3`, SHA1
`F3AE088181BF583E55DAF962A92BB46F4F1D07B7` y SHA256
`A9DEC84DFE7F62AB2220BAFAEF7479DA0929D066ECE16A6885F6226DB19085AF`.
Estos son hashes **declarados de la base**, no calculados sobre una base recibida.
No consta su autenticidad ni permiso de distribución.

Los campos de tamaño/CRC de SRC-05 coinciden con la referencia RA previamente
reportada. Como no hay SHA-256 del BPS de referencia, no se afirma igualdad exacta.
Las variantes v1.4.0 difieren en nueve bytes (incluidos trailers); no se infiere
qué cambia en el juego ni cuál debería utilizarse.

## Reproducción y límites

Desde tmt2-data, para archivos conservados fuera del repositorio:

```sh
npm run source:inspect -- '/ruta/al/Pokemon Emerald - Too Many Types 2 (v1.5.2) (kobazco).bps'
npm test
npm run typecheck
```

`source:inspect` acepta uno o más archivos, emite JSON sin rutas absolutas ni bytes
literales/metadata del parche y falla ante CRC, estructura o límites inválidos.
Es sólo lectura; no importa datos al catálogo. Límite de entrada del CLI: 32 MiB.
La estructura de BPS se contrastó con el lector del proyecto
[Flips (libbps.cpp)](https://github.com/Sir-Walrus/Flips/blob/master/libbps.cpp);
la implementación local es un inspector de estructura, no un aplicador.

Cuatro pruebas con **fixtures sintéticos rotulados** cubren CRC conocido,
reproducibilidad, cuatro modos, offsets negativos, varints multibyte, copia
solapada válida, corrupciones/truncamientos/límites y errores del CLI. Ningún
fixture contiene bytes del juego. El registro también se comprueba por consistencia.
El conjunto total actual pasa 21 tests (16 previos + 5 nuevos), y typecheck pasa.
La validación de producción sigue fallando explícitamente por ausencia del dataset.
La CI y los forks no cambiaron por recibir los parches; la instalación limpia
anterior permanece documentada en [STAGE_1_VALIDATION.md](../docs/STAGE_1_VALIDATION.md).

TMT-01 satisface su DoD de registro y verificación de la entrada recibida. TMT-02
permanece pendiente: STAB, duplicados, habilidades, estadísticas y generación
Showdown requieren evidencia semántica/oráculos; el BPS no resuelve esos hechos.
