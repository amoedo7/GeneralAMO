# GeneralAMO — recuperación

Este documento define cómo volver a un estado conocido de GeneralAMO sin confundir recuperación de código con recuperación de distribución o de datos del dispositivo.

## Alcance

Aplica al repositorio `amoedo7/GeneralAMO`, su contrato `.amo`, el AutoCheck y el código de la app. No autoriza cambios en StoreAMO, firmas, secretos ni releases.

## Antes de recuperar

1. Identificar el último commit de `main` que haya pasado `bash scripts/autocheck.sh` y el CI aplicable.
2. Confirmar si el incidente afecta sólo al repositorio/CI o también a un APK/release ya publicado.
3. No declarar una instalación física saludable sin comprobarla en un dispositivo.

## Recuperación de código o CI

Para una regresión introducida por un cambio fusionado, preferir un `git revert` del commit causante en una rama nueva. Ejecutar `bash scripts/autocheck.sh` y el CI de Android antes de fusionar la reversión.

No reescribir `main`, no borrar evidencia histórica y no usar una release anterior como sustituto de un gate fallido.

## Si existe un artefacto publicado afectado

Tratarlo como incidente de distribución separado. La recuperación del repositorio no implica por sí sola retirar, reemplazar o volver a publicar un APK. Cualquier cambio de release, firma o catálogo requiere sus gates específicos y verificación del package/artefacto correspondiente.

## Datos locales

GeneralAMO conserva estado local en el dispositivo. Este repositorio no declara un mecanismo de backup/restauración de datos de usuario; por tanto esa recuperación queda `UNKNOWN` salvo evidencia específica del dispositivo o una función documentada posterior.

## Criterio de cierre

La recuperación de la unidad de código sólo puede considerarse cerrada cuando:

- `bash scripts/autocheck.sh` termina correctamente sobre el commit recuperado;
- el CI aplicable está en `success` para ese SHA;
- cualquier incidente de distribución relacionado queda verificado por separado;
- no se presenta `UNKNOWN` como `PASS`.
