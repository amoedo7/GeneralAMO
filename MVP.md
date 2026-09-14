# MVP · GeneralAMO

## Resultado que debe entregar
Un grupo puede jugar una partida de Generala localmente con dados físicos o digitales y conservar el marcador; opcionalmente otros dispositivos de la misma red pueden mirar/editar según el enlace recibido.

## Flujo mínimo
1. Crear partida y jugadores.
2. Elegir dados físicos o digitales.
3. En digital: hasta 3 tiradas + retener/liberar.
4. Elegir categoría válida.
5. Guardar puntaje.
6. Cambiar turno.
7. Deshacer la última anotación.
8. Persistir partida.
9. Finalizar/archivar.
10. Opcional: compartir enlace read-only o editor en LAN.

## Criterios obligatorios
- reglas de categorías testeadas;
- una categoría no se puntúa dos veces por jugador;
- recarga/reinicio conserva partida;
- enlaces read-only no editan;
- sin cuenta/backend obligatorio;
- candidate ≠ verified.

## Fuera del MVP
- matchmaking global;
- dinero real/apuestas.
