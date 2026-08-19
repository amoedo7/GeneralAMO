# GeneralAMO · auditoría de material heredado

Fecha: 2026-08-19

Objetivo: rescatar lo útil sin convertir versiones viejas en verdad del producto nuevo.

## GeneralAMO web/Termux antiguo

### Rescatar

- modo de dados digitales;
- flujo `tirar → retener → volver a tirar → elegir categoría`;
- vista previa de puntaje;
- servidor local liviano;
- botón principal grande;
- apertura desde otro dispositivo de la misma Wi‑Fi.

### Reescribir

Estado, reglas, multiusuario, persistencia, turnos, historial, compartir/autoridad y seguridad de servidor.

### No copiar

- un único jugador;
- reglas rígidas en frontend;
- inferir IP conectando a `8.8.8.8`;
- servidor permanente en `0.0.0.0`;
- duplicar reglas entre web y Android.

## Especificación GeneralaAMO v0.6.4

Rescatar lectura/edición separadas, códigos/tokens de sesión, compartir/copy, QR, inicio rápido, espectadores y editores.

## GeneralaAMO 0.7.0-beta

La documentación histórica muestra intención de recuperar partidas, historial, anotación rápida, enlaces de lectura/edición, token de editor, turno sugerido, undo, tests y auditoría previa al build.

Problemas a corregir:

1. auditoría demasiado acoplada a buscar strings en Kotlin;
2. `generala servida = victoria inmediata` como regla rígida;
3. web embebida en strings Kotlin;
4. cleartext global;
5. permisos de red solicitados aunque el modo offline no los necesite;
6. no asumir que compila hoy sin prueba actual.

## Decisión de identidad

La app vieja `GeneralaAMO 0.7.0-beta` puede convivir temporalmente con la nueva.

```text
Legacy: GeneralaAMO / com.desarrollamo.generalaamo
Nueva:  GeneralAMO  / com.desarrollamo.generalamo
```

No se eliminará la legacy del dispositivo hasta que GeneralAMO haya demostrado que puede reemplazarla con seguridad.

## Decisión de producto

No crear dos productos. GeneralAMO integra:

- `Anotar partida` para dados físicos;
- `Jugar con dados` para dados digitales;
- un único motor de reglas;
- jugadores, historial y sincronización compartidos.
