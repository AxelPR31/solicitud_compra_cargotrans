# Contexto del Proyecto: Módulo de Transformación de Producción para Softland

## 1. Descripción General
Este proyecto consiste en una extensión construida con NestJS y React, conectada a la base de datos SQL de Softland. Su objetivo principal es gestionar la transformación de materia prima (ej. Filete de Res) en múltiples productos terminados y subproductos (ej. cortes específicos, recortes y pellejo), automatizando el cálculo de costos y vinculando los documentos de inventario generados en el ERP.

## 2. Flujo Operativo
*   **Consumo:** Se registra la salida o consumo de la materia prima principal con su costo unitario original.
*   **Transformación (Corte/Procesamiento):** La materia prima se divide en varios productos terminados según una receta predefinida, generando tanto productos aprovechables como mermas o subproductos.
*   **Entrada:** Se registran los ingresos de los productos terminados al inventario con sus nuevos costos calculados.
*   **Vinculación:** Se asocian lógicamente el Documento de Consumo y el Documento de Entrada de Softland para cuadrar el costo total, asegurando que el costo de la materia prima sea igual a la suma de los costos de los productos resultantes.

## 3. Lógica de Costos y Valuación (Basado en la Orden de Producción)
*   El costo total de la materia prima consumida debe ser exactamente igual al costo total distribuido entre los productos terminados y subproductos.
*   **Subproductos (Ej. Pellejo/Sobrantes):** Se valúan multiplicando el Costo Unitario original de la materia prima por un factor de valuación (ej. 0.20 para el 20%). El costo total del subproducto es este nuevo costo multiplicado por su peso en libras.
*   **Productos Terminados Principales:** El costo restante (Costo Total de la Materia Prima restando el Costo Total de los Subproductos) se divide entre las libras netas producidas de los cortes principales. Esto genera un "Nuevo Costo en Libra" uniforme.
*   El costo total por línea de producto se obtiene multiplicando el "Nuevo Costo en Libra" por la "Cantidad en Libra" de ese producto específico.

## 4. Estructura de Datos Propuesta
A continuación se describen las entidades necesarias para gestionar la lógica de recetas, factores y vinculación documental. Todo esto estructurado mediante listas descriptivas:

*   **Entidad Receta_Encabezado:** Almacena la configuración principal. Contiene el identificador único, el código de la materia prima (haciendo referencia a los catálogos de Softland), la descripción del proceso de transformación y su estado.
*   **Entidad Receta_Detalle:** Relaciona la materia prima con sus productos resultantes esperados. Contiene el identificador de la receta, el código del producto terminado, y un indicador para diferenciar si el ítem es un producto principal o un subproducto/merma.
*   **Entidad Factor_Valuacion:** Gestiona los porcentajes de costo asignados a los sobrantes. Contiene el código del producto (ej. código del pellejo de res) y el factor multiplicador (ej. 0.20).
*   **Entidad Orden_Produccion_Vinculo:** Enlaza los movimientos de inventario de las transacciones. Contiene el número de documento de consumo, el número de documento de entrada, la fecha de la orden, y los totales de libras y costos para garantizar el cuadre financiero del lote.

## 5. Reporteo
La información unificada alimentará una vista o reporte de "Orden de Producción" que detallará los insumos, mermas efectivas, libras producidas en corte, el cálculo desglosado del nuevo costo unitario, la asignación porcentual de costos y el cuadre final del costo que ingresó a corte.