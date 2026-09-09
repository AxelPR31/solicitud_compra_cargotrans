# Guia de pruebas de endpoints para la nueva logica contable

## Objetivo

Este documento describe como probar la logica en API para:

- Restriccion de tipos por flujo
- Diario editable y balanceado
- Regla de linea bancaria con null
- Retenciones y linea adicional sugerida en factura

## Precondiciones

- Tener catalogos base cargados:
  - Cuenta bancaria valida
  - CB_MOV_PREDEF valido
  - CB_MOV_PROY valido para entradas
  - Tipos en SUBTIPO_DOC_CB
- Tener al menos una retencion con CTA_RETENCION

Ejemplo para crear retencion:
POST /retenciones
{
"codigoRetencion": "ISR01",
"descripcion": "ISR Servicios",
"cuentaRetencion": "2-01-010-0007",
"porcentaje": 10
}

## Casos de prueba Factura

## Caso F1: Factura valida con tipo de salida y lineas personalizadas

Request:
POST /cb-factura
{
"usuario": "ADMIN",
"factura": "F-2026-100001",
"idMovPredef": 4,
"subtipo": "CHQ",
"cuentaBanco": "001-0023456-7",
"numeroFactura": "001-001-000099991",
"proveedor": "PROVEEDOR DEMO",
"fecha": "2026-04-21T00:00:00.000Z",
"subtotal": 1000,
"impuesto": 130,
"total": 1130,
"lineasDiario": [
{
"cuentaContable": "1-01-001-0001",
"creditoLocal": 1130,
"debitoLocal": null
},
{
"cuentaContable": "5-01-001-0003",
"debitoLocal": 1130,
"creditoLocal": null
}
]
}

Esperado:

- Exito
- Crea CB_FACTURA, MOV_BANCOS, ASIENTO_DE_DIARIO y DIARIO
- En linea bancaria: creditoLocal con monto y debitoLocal en null

## Caso F2: Factura invalida por tipo de entrada

Request:
POST /cb-factura
{
"usuario": "ADMIN",
"factura": "F-2026-100002",
"idMovPredef": 4,
"subtipo": "DEP",
"cuentaBanco": "001-0023456-7",
"numeroFactura": "001-001-000099992",
"proveedor": "PROVEEDOR DEMO",
"fecha": "2026-04-21T00:00:00.000Z",
"subtotal": 100,
"impuesto": 13,
"total": 113
}

Esperado:

- Falla con mensaje de tipos permitidos para factura

## Caso F3: Factura con retencion y linea adicional

Request:
POST /cb-factura
{
"usuario": "ADMIN",
"factura": "F-2026-100003",
"idMovPredef": 4,
"subtipo": "CHQ",
"cuentaBanco": "001-0023456-7",
"numeroFactura": "001-001-000099993",
"proveedor": "PROVEEDOR DEMO",
"fecha": "2026-04-21T00:00:00.000Z",
"subtotal": 1000,
"impuesto": 130,
"total": 1130,
"retenciones": [
{
"codigoRetencion": "ISR01",
"monto": 130
}
]
}

Esperado:

- Exito
- Se insertan registros en CB_RETENCIONES
- El diario queda balanceado

## Caso F4: Factura con diario desbalanceado

Request:
POST /cb-factura
{
"usuario": "ADMIN",
"factura": "F-2026-100004",
"idMovPredef": 4,
"subtipo": "CHQ",
"cuentaBanco": "001-0023456-7",
"numeroFactura": "001-001-000099994",
"proveedor": "PROVEEDOR DEMO",
"fecha": "2026-04-21T00:00:00.000Z",
"subtotal": 100,
"impuesto": 13,
"total": 113,
"lineasDiario": [
{
"cuentaContable": "1-01-001-0001",
"creditoLocal": 113,
"debitoLocal": null
},
{
"cuentaContable": "5-01-001-0003",
"debitoLocal": 100,
"creditoLocal": null
}
]
}

Esperado:

- Falla con mensaje de diario no balanceado

## Casos de prueba Entrada de Proyecto

## Caso E1: Entrada valida con tipo de ingreso

Request:
POST /cb-ent-proy
{
"usuario": "ADMIN",
"cbMovProy": 22,
"tipo": "DEP",
"cuentaBanco": "001-0023456-7",
"idCbMovPredef": 4,
"fecha": "2026-04-21T00:00:00.000Z",
"referencia": "DEP-100001",
"monto": 3500,
"descripcion": "Entrada prueba",
"lineasDiario": [
{
"cuentaContable": "1-01-001-0001",
"debitoLocal": 3500,
"creditoLocal": null
},
{
"cuentaContable": "4-01-010-0002",
"debitoLocal": null,
"creditoLocal": 3500
}
]
}

Esperado:

- Exito
- En linea bancaria: debitoLocal con monto y creditoLocal en null

## Caso E2: Entrada invalida por tipo de salida

Request:
POST /cb-ent-proy
{
"usuario": "ADMIN",
"cbMovProy": 22,
"tipo": "CHQ",
"cuentaBanco": "001-0023456-7",
"idCbMovPredef": 4,
"fecha": "2026-04-21T00:00:00.000Z",
"referencia": "DEP-100002",
"monto": 500,
"descripcion": "Entrada invalida"
}

Esperado:

- Falla con mensaje de tipos permitidos para entrada

## Caso E3: Entrada invalida por linea bancaria incorrecta

Request:
POST /cb-ent-proy
{
"usuario": "ADMIN",
"cbMovProy": 22,
"tipo": "DEP",
"cuentaBanco": "001-0023456-7",
"idCbMovPredef": 4,
"fecha": "2026-04-21T00:00:00.000Z",
"referencia": "DEP-100003",
"monto": 500,
"descripcion": "Entrada invalida",
"lineasDiario": [
{
"cuentaContable": "1-01-001-0001",
"debitoLocal": null,
"creditoLocal": 500
},
{
"cuentaContable": "4-01-010-0002",
"debitoLocal": 500,
"creditoLocal": null
}
]
}

Esperado:

- Falla por regla de linea bancaria

## Verificacion posterior en endpoints GET

- GET /cb-factura/:factura
- GET /cb-ent-proy/:id
- GET /cb-retenciones

Validar:

- Identificadores creados
- Asiento asociado
- Numero asociado
- Retenciones guardadas cuando aplique

## Checklist de aceptacion

- Factura solo acepta CHQ, N/D, O/D, T/D
- Entrada solo acepta DEP, N/C, O/C, T/C
- Diario acepta mas de 2 lineas
- Diario falla si no balancea
- En linea bancaria el lado opuesto siempre queda en null
- Retenciones insertan en CB_RETENCIONES y usan CTA_RETENCION para sugerencia
