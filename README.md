# GeneralAMO

**Generala local-first con marcador, dados digitales y juego compartido.**

Estado actual: `candidate` · Android · distribuida mediante StoreAMO.

## Qué es

GeneralAMO convierte el teléfono en la mesa de puntuación de una partida de Generala y, cuando querés, también en los propios dados.

Tiene dos experiencias sobre el mismo estado de partida:

- **Anotar partida**: para usar dados físicos y reemplazar la hoja de papel.
- **Jugar con dados**: cinco dados digitales, hasta tres tiradas, retener/liberar y guardar la categoría elegida.

La partida funciona sin Internet y queda guardada en el dispositivo. Si todos están en la misma Wi-Fi o hotspot, el teléfono que creó la mesa puede publicar un enlace para mirar y otro enlace separado para editar puntuaciones.

## Convivencia con la app anterior

La nueva línea usa una identidad separada de `GeneralaAMO 0.7.0-beta`:

```text
Legacy instalada:  GeneralaAMO
Package legacy:     com.desarrollamo.generalaamo

Nueva línea:        GeneralAMO
Package:             com.desarrollamo.generalamo
StoreAMO id:         generalamo
```

Esto permite probar GeneralAMO sin desinstalar la beta anterior.

## Candidate actual

Disponible ahora:

- 1–8 jugadores;
- agregar y eliminar jugadores;
- marcador para dados físicos;
- dados digitales con tres tiradas;
- retener/liberar cada dado;
- cálculo de categorías;
- persistencia local entre aperturas y turnos;
- deshacer anotaciones;
- historial local de partidas archivadas;
- modo claro/oscuro según preferencia;
- acceso compartido por misma Wi-Fi/hotspot;
- enlace de solo lectura;
- enlace distinto con permiso para editar puntos;
- APK firmado con identidad estable para actualizaciones desde StoreAMO.

Pendiente para versiones posteriores:

- Bluetooth como segundo transporte;
- sincronización más rica de eventos y presencia;
- estadísticas avanzadas;
- mayor cobertura automatizada de reglas y partidas completas.

No hay cuentas obligatorias ni backend para jugar.

## Estructura

```text
app/
  src/main/assets/index.html
  src/main/java/com/desarrollamo/generalamo/MainActivity.java
  src/main/AndroidManifest.xml
ci/
docs/
prototype/
scripts/
storeamo.json
SECURITY.md
PRIVACY.md
```

## StoreAMO

El repositorio se declara mediante `storeamo.json`. Cada push de `main` valida el MVP, reconstruye el APK con la misma firma candidate, comprueba el package `com.desarrollamo.generalamo`, genera SHA-256 y publica una GitHub Release.

```text
GeneralAMO repo
→ validación
→ APK firmado
→ SHA-256
→ GitHub Release
→ StoreAMO-Catalog
→ OBTENER / ACTUALIZAR
```

GeneralAMO continúa como `candidate`; compilar correctamente no equivale por sí solo a obtener el sello `verified`.

## Principios

- local-first;
- permisos mínimos;
- conectividad opcional;
- actualizaciones sin cambiar package ni firma;
- no publicar funciones ficticias;
- identidad DesarrollAMO con personalidad propia para el juego.
