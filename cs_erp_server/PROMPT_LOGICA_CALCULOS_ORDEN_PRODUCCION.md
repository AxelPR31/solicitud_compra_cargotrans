# Prompt para Antigravity — Lógica de Cálculo del Módulo "Orden de Producción"

## Contexto

Estamos construyendo el módulo de transformación de producción (NestJS + React, conectado a la base SQL de Softland) descrito en `contexto.md`. Este módulo toma un registro de **consumo de materia prima** (ej. Filete de Res) y un registro de **entrada de productos terminados/subproductos**, y calcula cómo se distribuye el costo de la materia prima entre todo lo que salió de ella, cuadrando el total exacto.

El ejemplo real que usamos de referencia es la orden de producción del 08/07/2026 (Filete de Res 3UP, código `CARN0001`), cuyo Excel y foto adjuntamos como referencia visual. Todos los cálculos de abajo deben reproducir exactamente esos números.

Implementa esta lógica como un servicio de cálculo puro (backend), que reciba los datos crudos (materia prima + líneas de subproductos con sus cantidades) y devuelva el desglose completo listo para: (a) mostrarse en el reporte "Orden de Producción" y (b) generar las dos inserciones de inventario en Softland (documento de consumo y documento de entrada).

---

## 1. Datos de entrada

### 1.1 Materia prima (documento de CONSUMO)

| Campo | Origen |
|---|---|
| Código materia prima | `Receta_Encabezado.codigo_materia_prima` |
| **Peso en Libras** | `LINEA_DOC_INV.CANTIDAD` del documento de consumo (Softland) |
| **Costo Unitario** | `ARTICULO.COSTO_PROM_LOC` (Softland), leído al momento del consumo |
| **Costo Total** | `Peso en Libras × Costo Unitario` |

### 1.2 Líneas de subproductos (documento de ENTRADA)

Cada línea viene de `Receta_Detalle` (una fila por cada producto terminado o subproducto/merma asociado a la receta de la materia prima) y para cada una el usuario ingresa **manualmente** dos valores al momento de liquidar la orden:

- **Cantidad en Unitaria** (unidades físicas, ej. 30 churrascos)
- **Cantidad en Libra** (peso resultante de esa línea, ej. 23.70 lb)

`Receta_Detalle.esMermaRecorte` marca si la línea es:
- **Subproducto/merma** (ej. pellejo, recorte)
- **Producto terminado principal** (ej. churrascos, medallones, steaks)

Para las líneas marcadas como **merma**, se debe buscar su **factor de valuación** en `Factor_Valuacion.factor` (según el código del producto, ej. pellejo = 0.20 → 20%).

---

## 2. Orden de cálculo (paso a paso, obligatorio en este orden)

El cálculo **no** es línea por línea de forma independiente: primero hay que resolver los subproductos/merma con valor propio, porque el resto del costo se reparte entre los productos terminados. Sigue este orden exacto:

### Paso 1 — Costo total de la materia prima (costo total de producción)
```
costoTotalProduccion = cantidad en unitaria × costoUnitarioMateriaPrima
```
Este valor es el que debe cuadrar al final contra la suma de todas las líneas de salida.

### Paso 2 — Valuar la merma con factor propio (ej. pellejo)
Para cada línea marcada como merma con factor de valuación:
```
nuevoCostoEnLibra(merma) = factorValuacion × costoUnitarioMateriaPrima
costoTotal(merma) = cantidadEnLibra(merma) × nuevoCostoEnLibra(merma)
```
> Ejemplo real: Pellejo Filete 3UP Res → factor 0.20 × 326.12 = 65.224 → 30.65 lb × 65.224 = 1,999.12

Si una línea de merma no tiene cantidad en libra registrada (ej. "RECORTE FILETE 3 UP RES" sin datos), su costo total es 0 y no participa en el reparto.

Suma todos los costoTotal de estas líneas de merma → `valorTotalMermaConValor`.

### Paso 3 — Costo disponible para repartir entre productos terminados
```
valorTotalProductosTerminados = costoTotalProduccion − valorTotalMermaConValor
```
> Ejemplo real: 81,233.23 − 1,999.12 = 79,234.11

### Paso 4 — Libras producidas en corte
```
librasProducidasEnCorte = Σ (cantidadEnLibra) de TODAS las líneas de producto terminado principal, osea los que no son merma

> Ejemplo real: 23.70+26.55+18.25+15.40+36.70+18.70+17.15+6.20+44.60+6.50 = 213.75

### Paso 5 — Nuevo Costo en Libra uniforme (para productos terminados)
```
nuevoCostoEnLibraUniforme = valorTotalProductosTerminados / librasProducidasEnCorte
```
Este mismo valor se aplica **igual** a todas las líneas de producto terminado principal.
> Ejemplo real: 79,234.11 / 213.75 = 370.6859...

### Paso 6 — Costo total y costo unitario por línea de producto terminado
Para cada línea de producto terminado:
```
costoTotal(línea) = cantidadEnLibra(línea) × nuevoCostoEnLibraUniforme
nuevoCostoUnitario(línea) = costoTotal(línea) / cantidadEnUnitaria(línea)
```
`nuevoCostoUnitario` es el costo por unidad física (por churrasco, por medallón, etc.), y se calcula **después** de tener el costo total de la línea — no al revés.

Si `cantidadEnUnitaria` es 0 o nula, el resultado es indeterminado (`#DIV/0!` en el Excel actual); en la nueva app esto debe manejarse como `null`/no aplicable en vez de generar un error, cuando la línea no tuvo unidades (por ejemplo, si un corte no se produjo ese día).

### Paso 7 — Merma efectiva (en libras)
```
librasEntregadasDeBodega = pesoEnLibrasMateriaPrima
mermaEnLibras = librasEntregadasDeBodega − librasProducidasEnCorte
porcentajeMerma = mermaEnLibras / librasEntregadasDeBodega
```
> Ejemplo real: 249.09 − 213.75 = 35.34 lb → 35.34/249.09 = 14.19%

Nota: `mermaEnLibras` incluye tanto el peso que se convirtió en pellejo (con valor) como cualquier merma sin valor (recorte descartado); es la diferencia total entre lo entregado y lo que efectivamente se convirtió en producto terminado vendible.

### Paso 8 — Asignación de costo por línea (para el reporte, todas las líneas incluidas)
```
asignacionDeCosto(línea) = costoTotal(línea) / costoTotalProduccion
```
Aplica tanto a líneas de producto terminado como a líneas de subproducto/merma (pellejo). La suma de `asignacionDeCosto` de todas las líneas debe dar 100%.

### Paso 9 — Cuadre final (tabla resumen inferior del reporte)
```
valorTotalMerma = mermaEnLibras_convertida_a_valor  // = costoTotal del pellejo/subproducto con valor (Paso 2)
valorTotalSubProductos = costoTotalProduccion − valorTotalMerma
costoTotalQueIngresoACorte = valorTotalMerma + valorTotalSubProductos  // debe ser exactamente igual a costoTotalProduccion
```
Este es el **cuadre**: `costoTotalQueIngresoACorte` debe ser matemáticamente idéntico a `costoTotalProduccion` (diferencia = 0). Si no cuadra, hay un error en las cantidades ingresadas y el sistema debe alertarlo antes de permitir generar los documentos de inventario en Softland.

---

## 3. Resumen de fórmulas (referencia rápida)

| Campo | Fórmula |
|---|---|
| Costo Total Materia Prima | `pesoLibras × costoUnitario` |
| Nuevo Costo en Libra (merma con factor) | `factorValuacion × costoUnitarioMateriaPrima` |
| Costo Total (merma) | `cantidadEnLibra × nuevoCostoEnLibra` |
| Valor disponible p/ productos terminados | `costoTotalProduccion − Σ costoTotal(subproductos con factor)` |
| Libras producidas en corte | `Σ cantidadEnLibra (solo productos terminados)` |
| Nuevo Costo en Libra uniforme | `valorProductosTerminados / librasProducidasEnCorte` |
| Costo Total por línea (producto terminado) | `cantidadEnLibra(línea) × nuevoCostoEnLibraUniforme` |
| Nuevo Costo Unitario por línea | `costoTotal(línea) / cantidadEnUnitaria(línea)` |
| Merma en libras | `librasEntregadasDeBodega − librasProducidasEnCorte` |
| % Merma | `mermaEnLibras / librasEntregadasDeBodega` |
| Asignación de costo (cualquier línea) | `costoTotal(línea) / costoTotalProduccion` |
| Cuadre | `costoTotalProduccion − (valorTotalMerma + valorTotalSubProductos) = 0` |

---

## 4. Caso de prueba (usar como test unitario)

**Materia prima:** Filete de Res 3UP (`CARN0001`), 249.09 lb, costo unitario C$326.12 → costo total C$81,233.23.

**Factor de valuación pellejo:** 0.20

| Código | Producto | Cant. Unitaria | Cant. Libra | Tipo |
|---|---|---|---|---|
| TERM0008 | Churrasco 12 oz | 30 | 23.70 | Terminado |
| TERM0010 | Churrasco 9 oz | 44 | 26.55 | Terminado |
| TERM0009 | Churrasco 8 oz (CB) | 34 | 18.25 | Terminado |
| TERM0024 | Punta 10 oz | 23 | 15.40 | Terminado |
| TERM0025 | Medallones 10 oz | 55 | 36.70 | Terminado |
| TERM0009 | Filete Criollo 8 oz | 35 | 18.70 | Terminado |
| TERM0007 | Steak Ejecutivo 6 oz | 41 | 17.15 | Terminado |
| TERM0002 | Steak Sandwich 5 oz | 18 | 6.20 | Terminado |
| TERM0058 | Philli Steak 4 oz | 151 | 44.60 | Terminado |
| TERM0012 | Steak Sandwich 4 oz (CB) | 24 | 6.50 | Terminado |
| TERM0059 | Recorte Filete 3UP Res | — | — | Merma (sin valor, 0) |
| TERM0094 | Pellejo Filete 3UP Res | — | 30.65 | Subproducto con factor |

**Resultados esperados:**
- Costo total producción: **C$81,233.23**
- Costo total pellejo: **C$1,999.12** (nuevo costo en libra = 65.224)
- Valor disponible para terminados: **C$79,234.11**
- Libras producidas en corte: **213.75**
- Nuevo costo en libra uniforme: **C$370.6859...**
- Merma en libras: **35.34** (14.19%)
- Costo total por línea, ejemplo Churrasco 12 oz: 23.70 × 370.6859 = **C$8,785.26** → asignación 10.81%
- Cuadre final: **C$81,233.23 = C$81,233.23** (diferencia 0)

---

## 5. Notas de implementación

- Todo el cálculo debe hacerse con precisión decimal (no redondear intermedios; solo redondear al mostrar en el reporte, típicamente a 2 decimales para córdobas y libras).
- El servicio de cálculo debe ser puro/testeable (sin llamadas a la BD dentro de la función de cálculo); las lecturas a `ARTICULO.COSTO_PROM_LOC`, `Factor_Valuacion` y `Receta_Detalle` deben resolverse antes y pasarse como parámetros.
- Antes de permitir generar los documentos de inventario en Softland (`DOCUMENTO_INV` + `LINEA_DOC_INV`, ver estructura en `INSERCIONES_DE_LOS_PAQUETES_DE_INVENTARIO_EN_SOFTLAND.xlsx`), el sistema debe validar el cuadre del Paso 9 y bloquear la inserción si no cuadra en 0 (con margen de tolerancia por redondeo, ej. ±0.01).
- El reporte de "Orden de Producción" debe mostrar todas las columnas del ejemplo: Código, Nombre, Cantidad Unitaria, Nuevo Costo Unitario, Cantidad en Libra, Nuevo Costo en Libra, Costo Total, Asignación de Costo — más el bloque inferior de Merma Efectiva y el bloque de Cuadre (Pellejo/Merma, Subproductos, Costo Total que Ingresó a Corte).
