# GeneralAMO · roadmap

## Etapa 0 · evidencia e incubación

Estado: **hecho**

- [x] revisar GeneralAMO web/Termux antiguo;
- [x] revisar especificación v0.6.4;
- [x] revisar documentación/auditoría v0.7.0-beta disponible;
- [x] separar funciones demostradas de intenciones;
- [x] integrar marcador + dados digitales en un prototipo;
- [x] promover el trabajo útil desde IdeAMO al repo oficial `amoedo7/GeneralAMO`.

## Etapa 1 · producto y prototipo

Estado: **en curso**

- [x] Anotar partida;
- [x] Jugar con dados;
- [x] continuar partida local en prototipo;
- [x] presets iniciales;
- [x] tema claro/oscuro en prototipo;
- [ ] resultado final dedicado;
- [ ] revancha;
- [ ] Sistema/Claro/Oscuro definitivos;
- [ ] accesibilidad y responsive final del prototipo.

## Etapa 2 · core testeable

- [ ] Game, Player, ScoringProfile, ScoreEntry, DiceTurn;
- [ ] motor de reglas independiente;
- [ ] RNG inyectable;
- [ ] eventos/revisiones;
- [ ] tests de puntuación y dados;
- [ ] replay/undo determinista.

## Etapa 3 · Android local-first

- [ ] Compose;
- [ ] package `com.desarrollamo.generalamo`;
- [ ] persistencia Room;
- [ ] recuperación de partida;
- [ ] historial;
- [ ] landscape/tablet;
- [ ] accesibilidad;
- [ ] keep-screen-on opcional.

Salida: partida completa offline estable.

## Etapa 4 · misma Wi‑Fi / hotspot

- [ ] NSD/mDNS;
- [ ] código de sesión;
- [ ] HOST/EDITOR/VIEWER;
- [ ] snapshot + delta;
- [ ] reconexión;
- [ ] vista web invitada opcional;
- [ ] pruebas hotspot y router doméstico.

## Etapa 5 · Bluetooth

- [ ] elegir transporte Android final;
- [ ] permisos por versión;
- [ ] implementar NearbyTransport;
- [ ] reutilizar protocolo de sync;
- [ ] pruebas reales.

Puede quedar beta sin bloquear una primera candidate si LAN ya es sólida.

## Etapa 6 · StoreAMO candidate

- [ ] APK con firma estable;
- [ ] tests verdes;
- [ ] SHA-256;
- [ ] GitHub Release;
- [x] `storeamo.json` en development;
- [ ] instalación desde StoreAMO;
- [ ] StoreAMO detecta ABRIR;
- [ ] segunda Release demuestra ACTUALIZAR sin perder datos;
- [ ] pruebas en al menos dos Android.

Entonces `status` puede pasar de `development` a `candidate`.

## Etapa 7 · verified

Sólo después de evidencia suficiente: flujo estable, permisos revisados, sincronización validada, actualización probada, auditoría de seguridad/privacidad y artefacto correspondiente al commit/release.

Nunca marcar `verified` sólo porque compile.
