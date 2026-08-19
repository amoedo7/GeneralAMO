# Security · GeneralAMO

GeneralAMO está en desarrollo y todavía no debe tratarse como software verificado.

## Principios

- ningún secreto, token permanente o credencial dentro del APK;
- permisos mínimos y ligados a funciones concretas;
- el modo offline no necesita permisos de red para jugar;
- sesiones LAN/Bluetooth usan identificadores o tokens efímeros;
- un viewer no puede mutar el estado;
- el host es la autoridad final de una partida compartida;
- mensajes, categorías y puntuaciones recibidos se validan;
- la firma Android y el package se congelarán antes de la primera Release candidate;
- StoreAMO debe verificar integridad, application id, firma y versión antes de actualizar.

## Red local

El servicio local sólo debe existir mientras el usuario comparte una partida. No se escanean IPs y no se mantiene un servidor abierto permanentemente.

Si una fase utiliza HTTP local, debe limitarse al caso deliberado de Wi‑Fi/hotspot de confianza y documentarse en la UI.

## Reportes

No publiques credenciales, tokens de sesión o datos personales en un Issue público. Para fallos reproducibles, describí versión, dispositivo, Android y pasos sin incluir secretos.
