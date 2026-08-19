# GeneralAMO

**Generala local-first con marcador, dados digitales y juego compartido.**

Estado actual: `development` · repo oficial creado a partir de la incubación en IdeAMO.

## Qué es

GeneralAMO convierte el teléfono en la mesa de puntuación de una partida de Generala y, cuando querés, también en los propios dados.

La app tendrá dos experiencias sobre un único motor:

- **Anotar partida**: para usar dados físicos y reemplazar la hoja de papel.
- **Jugar con dados**: cinco dados digitales, hasta tres tiradas, retener/liberar y anotar la categoría elegida.

El objetivo es que una partida pueda empezar rápido, funcione sin Internet y pueda compartirse con otros dispositivos cercanos sin que la conectividad sea requisito para terminarla.

## Importante: convivencia con la app vieja

Esta nueva línea usa una identidad separada de la antigua `GeneralaAMO 0.7.0-beta`.

```text
Legacy instalada:  GeneralaAMO
Package legacy:     com.desarrollamo.generalaamo

Nueva línea:        GeneralAMO
Package previsto:   com.desarrollamo.generalamo
StoreAMO id:        generalamo
```

Esto permite probar GeneralAMO sin desinstalar la beta que todavía funciona. La app vieja sólo se retirará cuando la nueva demuestre que cubre y mejora su flujo principal.

## Prioridades

1. partida completa offline;
2. 1–8 jugadores;
3. marcador y dados digitales con el mismo motor de reglas;
4. persistencia y recuperación;
5. undo e historial;
6. misma Wi‑Fi / hotspot;
7. Bluetooth como transporte secundario;
8. instalación y actualización mediante StoreAMO.

No hay cuentas obligatorias ni backend para el MVP.

## Estado de implementación

Ya se migraron desde IdeAMO:

- especificación de producto;
- auditoría del material histórico;
- arquitectura v1;
- roadmap;
- prototipo web integrado de `Anotar partida` + `Jugar con dados`;
- manifest inicial de StoreAMO en estado `development`.

Todavía **no hay APK oficial ni Release candidata**. Mientras no exista un artefacto probado, StoreAMO debe mostrar GeneralAMO dentro de **Lo que se viene**, no como una app instalable.

## Estructura actual

```text
docs/
  PRODUCT.md
  ARCHITECTURE.md
  LEGACY_AUDIT.md
  ROADMAP.md
prototype/
  index.html
storeamo.json
SECURITY.md
PRIVACY.md
```

La próxima fase es convertir el prototipo en un core testeable y una app Android local-first con package estable `com.desarrollamo.generalamo`.

## StoreAMO

El repositorio se declara a sí mismo mediante `storeamo.json`. StoreAMO no debe necesitar código hardcodeado para conocer GeneralAMO.

Ciclo previsto:

```text
GeneralAMO repo
→ tests
→ APK firmado
→ GitHub Release
→ StoreAMO-Catalog
→ StoreAMO-Verify
→ OBTENER
→ ABRIR
→ ACTUALIZAR
→ AL DÍA
```

## Principios

- local-first;
- permisos mínimos;
- reglas fuera de la UI;
- sin manipular resultados de dados;
- conectividad opcional;
- identidad DesarrollAMO, más lúdica y luminosa que StoreAMO;
- no marcar `verified` sólo porque compile.
