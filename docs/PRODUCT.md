# GeneralAMO · Product Spec v1

## Propuesta

GeneralAMO convierte el teléfono en la mesa de puntuación de una partida de Generala y, cuando se desea, también en los propios dados.

Debe empezar rápido, funcionar sin Internet y permitir compartir una partida cercana sin convertir la conectividad en requisito.

## Dos modos principales

### Anotar partida

Para dados físicos.

`Nueva partida → jugadores → reglas → marcador → resultado`

Objetivo UX: empezar en menos de 20 segundos.

### Jugar con dados

- cinco dados digitales;
- hasta tres tiradas;
- retener/liberar dados;
- preview de puntajes;
- elegir categoría;
- mismas reglas, jugadores e historial que el marcador.

## Inicio

- Anotar partida
- Jugar con dados
- Continuar última
- Unirme a una mesa
- Partidas recientes

Sin cuenta, red ni configuración obligatoria.

## Jugadores

- 1–8 jugadores;
- nombres rápidos;
- identificador accesible;
- orden editable;
- revancha conservando participantes.

## Marcador

- turno sugerido;
- categorías completas;
- total visible;
- pendiente/anotado/tachado;
- entrada rápida;
- puntaje manual opcional;
- deshacer;
- historial;
- estado Guardado/Compartiendo/Sin conexión.

## Reglas

La UI no contiene la lógica de puntuación. `ScoringProfile` define categorías, valores especiales, servida, victoria inmediata opcional, doble generala y puntaje manual.

Presets iniciales:

- Generala clásica;
- Personalizada.

La antigua regla rígida de “generala servida gana inmediatamente” queda como opción, no como verdad universal.

## Dados digitales

- RNG del sistema;
- 5 valores 1–6;
- máscara de retenidos;
- máximo de tiradas configurable, 3 por defecto;
- preview según reglas;
- animación separada del resultado real;
- accesibilidad textual.

Nunca alterar una tirada para hacerla más entretenida.

## Conectividad

1. Un dispositivo, 100% offline.
2. Misma Wi‑Fi / hotspot: host canónico, código/QR, viewer/editor, snapshot/delta y reconexión.
3. Bluetooth: segundo transporte del mismo protocolo.
4. Enlace remoto: futuro, no bloquea el MVP.

## Persistencia

Guardar partida activa, terminadas, eventos, jugadores recientes, reglas, preferencias y estadísticas locales. Debe recuperarse tras cierre forzado o reinicio.

## Historial y undo

Eventos versionados como `ScoreSet`, `ScoreCleared`, `PlayerAdded`, `TurnChanged`, `DiceRolled` y `GameFinished` permiten undo, auditoría local y sincronización.

## UX/UI

Identidad DesarrollAMO, más lúdica y luminosa que StoreAMO.

Temas previstos: Sistema, Claro, Oscuro y un tema Mesa cálido opcional.

Priorizar números grandes, tabla legible, colores con contraste, dados funcionales, animaciones cortas, landscape/tablet y accesibilidad sin depender sólo del color.

## Seguridad y privacidad

- sin cuenta obligatoria;
- sin analytics por defecto;
- sin publicidad;
- sin secretos en APK;
- permisos mínimos;
- sesiones LAN efímeras;
- edición local sólo con rol/token correspondiente.

## No hacer todavía

Backend complejo, ranking global, chat, pagos, IA, importación por foto, Internet obligatorio o Bluetooth antes de estabilizar el core y LAN.

## Candidate para StoreAMO

Debe demostrar partida offline completa, ambos modos, 1–8 jugadores, reglas correctas, persistencia, undo/historial, LAN estable entre dos Android, permisos justificados, tests, firma estable, Release y actualización desde StoreAMO.
