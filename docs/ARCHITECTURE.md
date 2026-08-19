# GeneralAMO · arquitectura v1

## Objetivo

Aplicación Android local-first con dos superficies sobre un único motor:

- scorekeeper para dados físicos;
- digital dice para jugar desde el dispositivo.

Reglas, eventos, persistencia y sincronización se separan de Compose para poder probarlos sin emulador.

## Estructura objetivo

```text
app/
  ui/
  navigation/
  feature/home/
  feature/setup/
  feature/scoreboard/
  feature/dice/
  feature/history/
  feature/nearby/
  feature/results/
  feature/settings/

core/
  model/
  rules/
  dice/
  events/
  persistence/
  sync/
  transport-lan/
  transport-bt/
```

Un solo repo y una sola app. No backend para el MVP.

## Identidad Android

- nombre: `GeneralAMO`
- package previsto y a congelar antes de la primera candidate: `com.desarrollamo.generalamo`
- StoreAMO id: `generalamo`
- separado de la legacy `com.desarrollamo.generalaamo`.

## Modelo principal

```text
Game
- id UUID
- status ACTIVE|FINISHED
- mode SCOREKEEPER|DIGITAL_DICE
- scoringProfile
- players[]
- scores
- currentTurnIndex
- revision

Player
- id UUID
- name
- colorKey
- position

ScoreEntry
- categoryId
- value
- state EMPTY|SCORED|CROSSED
- revision
- actorId

DiceTurn
- playerId
- values[5]
- held[5]
- throwCount
```

## Core de reglas

API conceptual sin Android APIs:

```text
availableCategories(profile)
validateManualScore(profile, category, value)
scoreDice(profile, category, dice)
previewScores(profile, dice)
computeTotal(game, playerId)
instantWin(profile, game, event)
applyEvent(game, event)
```

Los valores especiales no se hardcodean en UI.

## Dados

```text
roll(previousValues, heldMask, randomSource)
canRoll(turnState)
hold(index)
release(index)
```

`RandomSource` será inyectable. La animación nunca decide el resultado.

## Eventos

Cambios relevantes generan eventos versionados:

`GameCreated`, `PlayerAdded`, `PlayerRenamed`, `ScoreSet`, `ScoreCleared`, `ScoreCrossed`, `TurnChanged`, `DiceRolled`, `DiceHeld`, `GameFinished`.

Campos comunes: eventId, protocolVersion, gameId, revision, actorId, timestamp y payload.

## Persistencia

Room será la fuente local de verdad con games, players, scores, dice_turns, game_events, scoring_profiles y preferences.

Reglas: persistir antes de confirmar éxito, no reemplazar partida activa sin confirmación, migraciones explícitas y recuperación sin red.

## Sincronización

Contrato independiente del transporte:

```json
{
  "protocol": "generalamo.sync.v1",
  "type": "hello|snapshot|events|command|ack|error|presence",
  "gameId": "...",
  "revision": 17,
  "messageId": "...",
  "payload": {}
}
```

El host es autoridad final. Un cliente informa su última revisión y recibe delta o snapshot.

## LAN / hotspot

- servicio sólo mientras la partida está compartida;
- descubrimiento con Android NSD/mDNS;
- sin barrer IPs;
- emparejamiento por código o QR;
- roles HOST/EDITOR/VIEWER;
- tokens efímeros;
- al cerrar compartir, servidor y tokens desaparecen.

## Bluetooth

Segundo transporte detrás de una interfaz común `NearbyTransport`. No duplica reglas ni resolución de conflictos.

## Seguridad

- ningún secreto permanente en APK;
- códigos/tokens por sesión;
- firma y package estables al entrar a StoreAMO;
- cleartext sólo si es deliberado para servidor local y limitado/documentado;
- límites y validación estricta de mensajes;
- no confiar en puntajes calculados por clientes.

## Permisos

Offline base: ninguno especial.

LAN: `INTERNET` y sólo los permisos adicionales que la API elegida requiera realmente.

Bluetooth: se agregará cuando exista la función y separado por versión Android.

## Tests mínimos

Rules, dice, events, persistencia, serialización, replay/undo, sync, reconexión, roles y partidas completas con 1/2/4/8 jugadores.

Antes de `candidate`: al menos dos teléfonos Android en Wi‑Fi/hotspot.
