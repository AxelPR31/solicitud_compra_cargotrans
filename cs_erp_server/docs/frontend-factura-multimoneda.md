# Frontend: Factura multi‑moneda (CB_FACTURA) + Retenciones en moneda del documento

Este documento explica **solo** los cambios recientes relacionados a `CB_FACTURA` para soportar:

- Pago (banco) en una moneda (`NIO` o `USD`)
- Documento del proveedor (la “factura real”) en otra moneda
- Retenciones calculadas en **moneda del documento**

> Importante: En este sistema `CB_FACTURA` representa el **pago bancario** (se genera `MOV_BANCOS` + asiento contable). Por compatibilidad, los montos tradicionales se mantienen como **montos del pago**.

---

## 1) Principio clave (no te confundas con los montos)

### Montos del pago (moneda de la cuenta bancaria)

Estos campos siguen siendo **obligatorios** y están en la moneda de la cuenta bancaria (`CuentaBancaria.moneda`):

- `subtotal`
- `impuesto`
- `total`

En el backend:

- `MOV_BANCOS.monto` usa `total`.
- El asiento contable usa esos montos como “salida real del banco”.

### Montos del documento (moneda de la factura del proveedor)

Campos **nuevos** (opcionales) para representar el documento del proveedor:

- `monedaDoc`: `'NIO' | 'USD'`
- `subtotalDoc`
- `impuestoDoc`
- `totalDoc`
- `tcAplicado`

Si los envías:

- `*_Doc` están en `monedaDoc`.
- `tcAplicado` es el tipo de cambio **NIO por 1 USD** (igual a OFIC)

---

## 2) Cuándo enviar los campos \*\_Doc

### Caso A (legacy / sin cambios)

Si el pago y el documento son “equivalentes” o no te interesa el documento:

- Envías solo `subtotal/impuesto/total`.
- NO envías `monedaDoc/*Doc/tcAplicado`.

### Caso B (nuevo): documento y pago en monedas distintas

Ejemplo típico:

- Documento proveedor: **NIO**
- Pago desde cuenta bancaria: **USD**

En este caso:

- Envías `subtotal/impuesto/total` en **USD** (lo que sale del banco)
- Envías `monedaDoc/*Doc` en **NIO** (lo que vale la factura del proveedor)
- Envías `tcAplicado` (NIO por USD)

---

## 3) Validaciones que debe hacer el frontend

### Validaciones generales

- `total > 0`
- `subtotal >= 0`, `impuesto >= 0`
- `subtotal + impuesto == total` (ideal con tolerancia)

### Validaciones si usas multi‑moneda

Si el usuario envía **cualquier** campo de documento (`monedaDoc` o `totalDoc` o `subtotalDoc` o `impuestoDoc`):

1. `monedaDoc` debe ser `NIO` o `USD`.
2. `totalDoc > 0`.
3. Si `monedaDoc != moneda de la cuenta bancaria` entonces:
   - `tcAplicado > 0` es **obligatorio**.

Recomendación UX:

- Mostrar un cálculo de consistencia (con tolerancia):
  - Si `monedaDoc=NIO` y cuenta USD: `totalDoc / tcAplicado ≈ total`
  - Si `monedaDoc=USD` y cuenta NIO: `totalDoc * tcAplicado ≈ total`

---

## 4) Retenciones (regla nueva)

### Regla

- Las retenciones se calculan en la **moneda del documento** (si se envía documento).
- Luego el backend las convierte a moneda del pago para:
  - netear lo que sale del banco
  - construir el asiento

### Qué manda el frontend

En el payload de `retenciones[]` puedes:

- mandar solo `codigoRetencion` (recomendado)
- o mandar `monto` si tu UI lo captura manualmente

> Si mandas `monto`, debe interpretarse en moneda del documento cuando estás usando `monedaDoc/*Doc`.

---

## 5) Payloads de ejemplo

### 5.1 Legacy (como siempre)

```json
{
  "factura": "F-2026-000321",
  "cbMovProy": 1,
  "idMovPredef": 4,
  "subtipo": "CHQ",
  "cuentaBanco": "001-0023456-7",
  "proveedor": "PROV001",
  "fecha": "2026-04-20T00:00:00.000Z",

  "subtotal": 1000,
  "impuesto": 130,
  "total": 1130,

  "retenciones": [{ "codigoRetencion": "ISR01" }]
}
```

### 5.2 Multi‑moneda: Documento NIO, Pago USD

```json
{
  "factura": "F-2026-000350",
  "cbMovProy": 1,
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

  "retenciones": [{ "codigoRetencion": "ISR01" }]
}
```

---

## 6) Qué respuestas/errores puede devolverte el backend

Errores comunes (deben mostrarse tal cual):

- `tcAplicado es requerido... cuando monedaDoc != moneda de la cuenta bancaria`
- `totalDoc debe ser mayor a cero`
- `El total (monto del pago) debe ser mayor a cero`

---

## 7) Notas de implementación

- `CuentaBancaria.moneda` solo puede ser `NIO` o `USD`.
- El backend usa el tipo de cambio OFIC más reciente (`TIPO_CAMBIO_HIST` ordenado por fecha desc) como referencia general.
- Si el frontend manda `tcAplicado`, ese es el que se usa para las conversiones documento↔pago del registro.

