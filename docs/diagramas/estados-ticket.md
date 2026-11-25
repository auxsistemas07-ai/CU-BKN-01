# CU-BKN-01 · Diagrama de estados del ticket

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Nuevo : ticket creado (botón o palabra clave)
    Nuevo --> Asignado : se asigna responsable
    Asignado --> EnProceso : el agente empieza
    EnProceso --> EnEspera : falta algo del cliente
    EnEspera --> Resuelto : llega lo que faltaba
    Resuelto --> Cerrado : motivo + solución, aviso al cliente con folio
    Resuelto --> Reabierto : el cliente dice que no quedó resuelto
    Cerrado --> [*]

    EnProceso : En proceso
    EnEspera : En espera del cliente
```

## Tabla de transiciones permitidas

| Desde | Hacia | Condición |
|---|---|---|
| Nuevo | Asignado | Tener responsable |
| Asignado | En proceso | — |
| En proceso | En espera del cliente | — |
| En espera del cliente | Resuelto | — |
| Resuelto | Cerrado | Motivo y solución obligatorios; se avisa al cliente con su folio |
| Resuelto | Reabierto | El cliente responde que no quedó resuelto; vuelve a la bandeja |

**Cualquier otro salto se rechaza** (por ejemplo, Nuevo → Cerrado). Esta tabla vivirá en un solo archivo del código y tendrá su prueba automatizada.

**Reasignar responsable no cambia el estado**; solo se registra en la bitácora (quién, cuándo, responsable anterior y nuevo).

## Pendiente de decidir (no se agrega sin autorización)
- ¿**Reabierto → En proceso**? Sin esta transición, un ticket reabierto no puede volver a trabajarse.
- ¿**En espera del cliente → En proceso**? (el cliente respondió, pero aún falta trabajo).
- ¿**En proceso → Resuelto** directo? (casos que no requieren nada del cliente).
