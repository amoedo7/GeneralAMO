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
- la firma Android y el package se congelan antes de distribución estable;
- StoreAMO debe verificar integridad, application id, firma y versión antes de actualizar.

## Claves de firma

La clave privada de firma nunca se guarda en Git, ni siquiera en Base64. Tampoco se guardan en Gradle contraseñas, aliases sensibles o rutas privadas. CI recibe el material de firma exclusivamente mediante GitHub Actions Secrets y lo materializa sólo durante el job.

Si una clave privada o keystore estuvo alguna vez en un repositorio público debe considerarse comprometida aunque después se borre del último commit. Antes de distribución de producción hay que rotar/migrar esa identidad de firma y conservar únicamente el fingerprint público del certificado para verificación.

## Red local

El servicio local sólo debe existir mientras el usuario comparte una partida. No se escanean IPs y no se mantiene un servidor abierto permanentemente.

Si una fase utiliza HTTP local, debe limitarse al caso deliberado de Wi‑Fi/hotspot de confianza y documentarse en la UI.

## Reportes

No publiques credenciales, tokens de sesión o datos personales en un Issue público. Para fallos reproducibles, describí versión, dispositivo, Android y pasos sin incluir secretos.
