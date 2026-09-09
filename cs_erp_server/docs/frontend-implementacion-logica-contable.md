# Guia frontend para logica contable en Factura y Entrada de Proyecto

## Objetivo

Este documento define como debe comportarse el frontend para cumplir la logica nueva del backend en:

- Facturas
- Entradas de proyecto
- Retenciones asociadas a factura
- Construccion y edicion de lineas de diario

Además incluye la nueva lógica **multi-moneda** para `CB_FACTURA`:

- `subtotal/impuesto/total` siempre son el **PAGO** en la moneda de la cuenta bancaria.
- `*_Doc` representan el **DOCUMENTO** (factura del proveedor) en su moneda.
- Las **retenciones** se calculan en la **moneda del documento**.

## Catalogo de tipos de documento

Tipos disponibles en SUBTIPO_DOC_CB:

- CHQ
- DEP
- N/C
- N/D
- O/C
- O/D
- T/C
- T/D

Clasificacion funcional:

- Disminuyen saldo de banco: CHQ, N/D, O/D, T/D
- Aumentan saldo de banco: DEP, N/C, O/C, T/C

## Reglas por pantalla

## Pantalla Crear Factura

Reglas de seleccion:

- El campo subtipo solo debe permitir: CHQ, N/D, O/D, T/D

Reglas de cuentas:

- La cuenta bancaria sale de cuentaBanco en CB_FACTURA
- La contrapartida inicial se sugiere desde CB_MOV_PREDEF
- La contrapartida NO es obligatoria fija: el usuario puede editar y agregar mas lineas

Reglas de diario:

- Si subtipo es CHQ/N/D/O/D/T/D, la linea bancaria debe ir a creditoLocal
- En esa misma linea bancaria, debitoLocal debe ir en null
- El resto de lineas debe mantener el asiento balanceado

Retenciones en factura:

- Si el usuario agrega retenciones, se debe sugerir una linea adicional por cada retencion
- La cuenta contable de esa linea sale de RETENCIONES.CTA_RETENCION
- El monto de esa linea corresponde al monto de la retencion aplicada

### Multi-moneda (Factura en una moneda, pago desde otra cuenta)

Caso típico (lo que te solicitaron):

- El _documento_ del proveedor está en **NIO**.
- El pago sale de una cuenta **USD**.

En ese caso el frontend debe capturar/mandar:

- **Pago (moneda cuenta)**: `subtotal, impuesto, total` (en USD)
- **Documento**: `monedaDoc, subtotalDoc, impuestoDoc, totalDoc` (en NIO)
- **Tipo de cambio aplicado**: `tcAplicado` (NIO por 1 USD)

Reglas:

- Si `monedaDoc !== moneda de la cuenta bancaria`, `tcAplicado` es **obligatorio**.
- Las retenciones se calculan usando `subtotalDoc` (moneda documento).
- El backend convierte retenciones a moneda de pago para netear el banco y hacer el asiento.

## Pantalla Crear Entrada de Proyecto

Reglas de seleccion:

- El campo tipo solo debe permitir: DEP, N/C, O/C, T/C

Reglas de cuentas:

- La cuenta bancaria sale de cuentaBanco en CB_ENT_PROY
- La contrapartida inicial se sugiere desde CB_MOV_PREDEF
- La contrapartida NO es obligatoria fija: el usuario puede editar y agregar mas lineas

Reglas de diario:

- Si tipo es DEP/N/C/O/C/T/C, la linea bancaria debe ir a debitoLocal
- En esa misma linea bancaria, creditoLocal debe ir en null
- El resto de lineas debe mantener el asiento balanceado

## Contrato de payload para Factura

Endpoint: POST /cb-factura

Campos clave nuevos para frontend:

- lineasDiario: arreglo opcional
- retenciones: arreglo opcional
- Campos nuevos para multi-moneda:
  - `monedaDoc`: 'NIO' | 'USD' (opcional)
  - `subtotalDoc`, `impuestoDoc`, `totalDoc` (opcionales)
  - `tcAplicado` (opcional; requerido si `monedaDoc` distinto a moneda cuenta)

Ejemplo payload:
{
"factura": "F-2026-000321",
"idMovPredef": 4,
"subtipo": "CHQ",
"cuentaBanco": "001-0023456-7",
"numeroFactura": "001-001-000012345",
"proveedor": "SUMINISTROS DEL CARIBE S.A.",
"fecha": "2026-04-20T00:00:00.000Z",
"subtotal": 1000,
"impuesto": 130,
"total": 1130,
"retenciones": [
{
"codigoRetencion": "ISR01",
"monto": 130
}

### Ejemplo (Multi-moneda): documento en NIO, pago desde cuenta USD

Notas:

- `subtotal/impuesto/total` están en **USD** (monto que sale del banco)
- `*_Doc` están en **NIO** (monto del documento proveedor)
- `tcAplicado` es el tipo de cambio OFIC (NIO por 1 USD)

{
"factura": "F-2026-000350",
"idMovPredef": 4,
"subtipo": "CHQ",
"cuentaBanco": "CTA-USD-001",
"proveedor": "PROV001",
"fecha": "2026-04-20T00:00:00.000Z",

    "subtotal": 300,
    "impuesto": 0,
    "total": 300,

    "monedaDoc": "NIO",
    "subtotalDoc": 9500,
    "impuestoDoc": 1450,
    "totalDoc": 10950,
    "tcAplicado": 36.5,

    "retenciones": [
    	{ "codigoRetencion": "ISR01" }
    ]

}
],
"lineasDiario": [
{
"cuentaContable": "1-01-001-0001",
"creditoLocal": 1000,
"debitoLocal": null
},
{
"cuentaContable": "2-01-010-0007",
"creditoLocal": 130,
"debitoLocal": null
},
{
"cuentaContable": "5-01-001-0003",
"debitoLocal": 1130,
"creditoLocal": null
}
]
}

## Contrato de payload para Entrada de Proyecto

Endpoint: POST /cb-ent-proy

Campos clave nuevos para frontend:

- lineasDiario: arreglo opcional

Ejemplo payload:
{
"cbMovProy": 22,
"tipo": "DEP",
"cuentaBanco": "001-0023456-7",
"idCbMovPredef": 4,
"fecha": "2026-04-20T00:00:00.000Z",
"referencia": "DEP-000019",
"monto": 3500,
"descripcion": "Donacion recibida para fase 2",
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

## Validaciones que debe hacer frontend antes de enviar

- Debe existir al menos una linea con la cuenta contable bancaria
- En cada linea, solo un lado puede tener valor: debitoLocal o creditoLocal
- No se permite que ambos lados esten null en una misma linea
- El total debitoLocal debe ser igual al total creditoLocal
- En Factura, la linea bancaria debe quedar en credito y debito en null
- En Entrada, la linea bancaria debe quedar en debito y credito en null
- Todas las lineas deben tener cuentaContable

## Comportamiento recomendado de UX

- Cargar lineas sugeridas al seleccionar tipo, cuentaBanco, idMovPredef y monto/total
- Permitir agregar, editar y eliminar lineas
- Bloquear submit si el diario no balancea
- Mostrar mensaje de error de negocio devuelto por backend
- Si hay retenciones, mostrar las lineas sugeridas por CTA_RETENCION y permitir ajustar

Validaciones adicionales para multi-moneda (Factura):

- Si el usuario llena `monedaDoc` o cualquier campo `*_Doc`, entonces:
  - `monedaDoc` debe ser `NIO` o `USD`
  - `totalDoc > 0`
  - si `monedaDoc` es distinta a la moneda de la cuenta bancaria: `tcAplicado > 0`
- Recomendación UX: mostrar un cálculo de verificación:
  - si `monedaDoc=NIO` y cuenta USD: `totalDoc / tcAplicado ≈ total` (tolerancia)
  - si `monedaDoc=USD` y cuenta NIO: `totalDoc * tcAplicado ≈ total` (tolerancia)

## Endpoints utiles para frontend

- GET /subtipo-doc-cb
- GET /cb-mov-predef
- GET /cuenta-bancaria
- GET /retenciones
- POST /cb-factura
- POST /cb-ent-proy

