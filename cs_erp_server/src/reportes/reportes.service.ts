import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { OrdenProduccionVinculo } from '../orden-produccion-vinculo/entities/orden-produccion-vinculo.entity'
import { OrdenProduccionDetalle } from '../orden-produccion-vinculo/entities/orden-produccion-detalle.entity'
import { OrdenProduccionMateriaPrima } from '../orden-produccion-vinculo/entities/orden-produccion-materia-prima.entity'
import { LineaDocInv } from '../linea-doc-inv/entities/linea-doc-inv.entity'
import { Articulo } from '../articulo/entities/articulo.entity'
import { FactorValuacion } from '../factor-valuacion/entities/factor-valuacion.entity'
import { Response } from 'express'
import * as ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'
import { TrasladoInternoEncabezado } from '../traslado-interno/entities/traslado-interno-encabezado.entity'
import { TrasladoInternoDetalle } from '../traslado-interno/entities/traslado-interno-detalle.entity'
import { Bodega } from '../bodega/entities/bodega.entity'

const pdfmake = require('pdfmake');
const PdfPrinter = require('pdfmake/js/Printer');
const URLResolver = require('pdfmake/js/URLResolver');

@Injectable()
export class ReportesService {
  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {}

  private async getOrdenData(id: number) {
    const vinculoRepo = this.dataSource.getRepository(OrdenProduccionVinculo)
    const detailsRepo = this.dataSource.getRepository(OrdenProduccionDetalle)
    const articulosRepo = this.dataSource.getRepository(Articulo)
    const factorsRepo = this.dataSource.getRepository(FactorValuacion)
    const mpRepo = this.dataSource.getRepository(OrdenProduccionMateriaPrima)

    const dbFactors = await factorsRepo.find()
    const vinculo = await vinculoRepo.findOneBy({ id })
    if (!vinculo) {
      throw new NotFoundException(`No se encontró la orden de producción con ID ${id}`)
    }

    const detalles = await detailsRepo.find({
      where: { vinculoId: id }
    })

    const dbMps = await mpRepo.find({
      where: { vinculoId: id }
    })

    let materiasPrimas = dbMps
    if (dbMps.length === 0 && vinculo.materiaPrima) {
      materiasPrimas = [{
        id: 0,
        vinculoId: id,
        articulo: vinculo.materiaPrima,
        cantidad: Number(vinculo.pesoMateriaPrima || 0),
        costoUnitario: Number(vinculo.costoUnitarioMateriaPrima || 0),
        costoTotal: Number(vinculo.pesoMateriaPrima || 0) * Number(vinculo.costoUnitarioMateriaPrima || 0)
      }] as any
    }

    const codes = Array.from(new Set([
      ...materiasPrimas.map(mp => mp.articulo),
      ...detalles.map(d => d.articulo)
    ].filter(Boolean)))

    let articulosMap = new Map<string, string>()
    if (codes.length > 0) {
      const dbArticulos = await articulosRepo.createQueryBuilder('a')
        .where('a.articulo IN (:...codes)', { codes })
        .getMany()
      dbArticulos.forEach(art => articulosMap.set(art.articulo, art.descripcion))
    }

    const materiasPrimasConNombre = materiasPrimas.map(mp => ({
      ...mp,
      nombre: articulosMap.get(mp.articulo) || 'N/A'
    }))

    const materiaPrimaNombre = vinculo.materiaPrima ? articulosMap.get(vinculo.materiaPrima) : 'N/A'

    const mappedDetalles = detalles.map(d => ({
      ...d,
      nombre: articulosMap.get(d.articulo) || d.nombre || 'N/A'
    }))

    // Ordenar detalles: Mermas al final
    const sortedDetalles = [...mappedDetalles].sort((a, b) => {
      if (a.esMermaRecorte && !b.esMermaRecorte) return 1
      if (!a.esMermaRecorte && b.esMermaRecorte) return -1
      return 0
    })

    // Fetch warehouse (bodega) name
    let bodegaCode = '01'
    try {
      const lineaDocInvRepo = this.dataSource.getRepository(LineaDocInv)
      const consumoLine = await lineaDocInvRepo.findOneBy({
        documentoInv: vinculo.documentoConsumo,
        tipo: 'C'
      })
      if (consumoLine) {
        bodegaCode = consumoLine.bodega?.trim()
      }
    } catch (err) {
      console.error('Error fetching LineaDocInv to extract bodega code', err)
    }

    let bodegaNombre = 'CENTRO DE PRODUCCION 7 SUR'
    try {
      const bodegaRepo = this.dataSource.getRepository(Bodega)
      const dbBodega = await bodegaRepo.findOneBy({ bodega: bodegaCode })
      if (dbBodega && dbBodega.nombre) {
        bodegaNombre = dbBodega.nombre.trim()
      }
    } catch (err) {
      console.error('Error fetching Bodega name from database', err)
    }

    return {
      ...vinculo,
      materiaPrimaNombre,
      materiasPrimas: materiasPrimasConNombre,
      detalles: sortedDetalles,
      factors: dbFactors,
      bodegaNombre
    }
  }

  async exportExcel(id: number, res: Response) {
    const data = await this.getOrdenData(id)
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Orden de Producción')

    // Estilos generales
    const fontTitle: Partial<ExcelJS.Font> = { name: 'Arial', size: 12, bold: true }
    const fontHeader: Partial<ExcelJS.Font> = { name: 'Arial', size: 9, bold: true }
    const fontBody: Partial<ExcelJS.Font> = { name: 'Arial', size: 9 }
    const fontTotal: Partial<ExcelJS.Font> = { name: 'Arial', size: 9, bold: true }
    
    const fillTitle: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF4' } }
    const fillTableHeader: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
    const fillHighlight: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } } // Amarillo para cuadres
    
    const styleThin: ExcelJS.BorderStyle = 'thin'
    const styleDouble: ExcelJS.BorderStyle = 'double'

    const borderThin: Partial<ExcelJS.Borders> = {
      top: { style: styleThin },
      left: { style: styleThin },
      bottom: { style: styleThin },
      right: { style: styleThin }
    }
    const borderDoubleBottom: Partial<ExcelJS.Borders> = {
      top: { style: styleThin },
      bottom: { style: styleDouble }
    }

    // Configuración de columnas
    sheet.columns = [
      { key: 'codigo', width: 14 },
      { key: 'nombre', width: 34 },
      { key: 'cant_unit', width: 14, style: { alignment: { horizontal: 'right' } } },
      { key: 'cost_unit', width: 16, style: { alignment: { horizontal: 'right' } } },
      { key: 'cant_lib', width: 14, style: { alignment: { horizontal: 'right' } } },
      { key: 'cost_lib', width: 16, style: { alignment: { horizontal: 'right' } } },
      { key: 'cost_tot', width: 16, style: { alignment: { horizontal: 'right' } } },
      { key: 'asig_cost', width: 14, style: { alignment: { horizontal: 'right' } } }
    ]

    // 1. Título Superior
    sheet.mergeCells('A1:H1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = `REST. EL ESKIMO S.A. (${data.bodegaNombre})`
    titleCell.font = { name: 'Arial', size: 10, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = fillTitle
    sheet.getRow(1).height = 25

    sheet.mergeCells('A2:H2')
    const subTitleCell = sheet.getCell('A2')
    subTitleCell.value = 'ORDEN DE PRODUCCION'
    subTitleCell.font = fontTitle
    subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(2).height = 20

    // 2. Información General
    const formatDate = (d: Date) => {
      const date = new Date(d)
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
    }

    const alignLabel: Partial<ExcelJS.Alignment> = { wrapText: true, vertical: 'middle', horizontal: 'left' }
    const alignVal: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left' }

    sheet.getRow(3).height = 10

    // Row 4 & 5: Fecha, Doc. Softland, Nº Documento
    sheet.getRow(4).height = 20
    sheet.getRow(5).height = 20
    
    sheet.mergeCells('A4:A5')
    const cellA4 = sheet.getCell('A4')
    cellA4.value = 'FECHA\nOPERATIVA:'
    cellA4.font = fontHeader
    cellA4.alignment = alignLabel

    sheet.mergeCells('B4:B5')
    const cellB4 = sheet.getCell('B4')
    cellB4.value = formatDate(data.fecha)
    cellB4.font = fontBody
    cellB4.alignment = alignVal

    sheet.mergeCells('C4:C5')
    const cellC4 = sheet.getCell('C4')
    cellC4.value = 'DOC.\nSOFTLAND:'
    cellC4.font = fontHeader
    cellC4.alignment = alignLabel

    sheet.mergeCells('D4:D5')
    const cellD4 = sheet.getCell('D4')
    cellD4.value = data.documentoConsumo
    cellD4.font = fontBody
    cellD4.alignment = alignVal

    sheet.mergeCells('E4:E5')
    const cellE4 = sheet.getCell('E4')
    cellE4.value = 'Nº\nDOCUMENTO:'
    cellE4.font = fontHeader
    cellE4.alignment = alignLabel

    sheet.mergeCells('F4:F5')
    const cellF4 = sheet.getCell('F4')
    cellF4.value = data.numeroDocumento || ''
    cellF4.font = fontBody
    cellF4.alignment = alignVal

    // Add raw material column headers if N > 1
    if (data.materiasPrimas.length > 1) {
      const cellG5 = sheet.getCell('G5')
      cellG5.value = 'Costo und'
      cellG5.font = { name: 'Arial', size: 9, bold: true }
      cellG5.alignment = { horizontal: 'right', vertical: 'bottom' }

      const cellH5 = sheet.getCell('H5')
      cellH5.value = 'Costo total'
      cellH5.font = { name: 'Arial', size: 9, bold: true }
      cellH5.alignment = { horizontal: 'right', vertical: 'bottom' }
    }

    // Row 6 & 7: Producto a procesar, Código
    let currentIdx = 6

    if (data.materiasPrimas.length === 1) {
      // 100% original layout for 1 raw material
      sheet.getRow(6).height = 20
      sheet.getRow(7).height = 20

      sheet.mergeCells('A6:A7')
      const cellA6 = sheet.getCell('A6')
      cellA6.value = 'PRODUCTO\nA PROCESAR:'
      cellA6.font = fontHeader
      cellA6.alignment = alignLabel

      sheet.mergeCells('B6:B7')
      const cellB6 = sheet.getCell('B6')
      cellB6.value = data.materiaPrimaNombre
      cellB6.font = fontBody
      cellB6.alignment = alignVal

      sheet.mergeCells('C6:C7')
      const cellC6 = sheet.getCell('C6')
      cellC6.value = 'CÓDIGO:'
      cellC6.font = fontHeader
      cellC6.alignment = alignLabel

      sheet.mergeCells('D6:D7')
      const cellD6 = sheet.getCell('D6')
      cellD6.value = data.materiaPrima
      cellD6.font = fontBody
      cellD6.alignment = alignVal

      currentIdx = 8
    } else {
      // Layout for multiple raw materials (like in the user screenshot)
      const N = data.materiasPrimas.length

      // Merge column A from row 6 to 6 + N - 1 for 'PRODUCTO A PROCESAR'
      sheet.mergeCells(`A6:A${6 + N - 1}`)
      const cellA6 = sheet.getCell('A6')
      cellA6.value = 'PRODUCTO A PROCESAR'
      cellA6.font = fontHeader
      cellA6.alignment = alignLabel

      for (let i = 0; i < N; i++) {
        const rowNum = 6 + i
        const mp = data.materiasPrimas[i]
        sheet.getRow(rowNum).height = 20

        // Boxed cell for name (B:C merged)
        sheet.mergeCells(`B${rowNum}:C${rowNum}`)
        const nameCell = sheet.getCell(`B${rowNum}`)
        nameCell.value = mp.nombre || 'N/A'
        nameCell.font = fontBody
        nameCell.border = borderThin
        nameCell.alignment = alignVal

        // Label CODIGO
        const codeLabelCell = sheet.getCell(`D${rowNum}`)
        codeLabelCell.value = 'CODIGO'
        codeLabelCell.font = fontHeader
        codeLabelCell.alignment = alignLabel

        // Boxed cell for code (E)
        const codeCell = sheet.getCell(`E${rowNum}`)
        codeCell.value = mp.articulo
        codeCell.font = fontBody
        codeCell.border = borderThin
        codeCell.alignment = alignVal

        // F: Quantity
        const qtyCell = sheet.getCell(`F${rowNum}`)
        qtyCell.value = Number(mp.cantidad || 0)
        qtyCell.font = fontBody
        qtyCell.numFmt = '#,##0.00" LBS"'
        qtyCell.alignment = { horizontal: 'right', vertical: 'middle' }

        // G: Costo unitario
        const costCell = sheet.getCell(`G${rowNum}`)
        costCell.value = Number(mp.costoUnitario || 0)
        costCell.font = fontBody
        costCell.numFmt = '#,##0.00'
        costCell.alignment = { horizontal: 'right', vertical: 'middle' }

        // H: Costo total
        const totalCostCell = sheet.getCell(`H${rowNum}`)
        totalCostCell.value = Number(mp.costoTotal || (mp.cantidad * mp.costoUnitario))
        totalCostCell.font = fontBody
        totalCostCell.numFmt = '#,##0.00'
        totalCostCell.alignment = { horizontal: 'right', vertical: 'middle' }
      }

      currentIdx = 6 + N

      // Add totals row for raw materials
      sheet.getRow(currentIdx).height = 20
      
      const totalLabelCell = sheet.getCell(`B${currentIdx}`)
      totalLabelCell.value = '' // empty space

      // F: Total quantity formula
      const totalQtyCell = sheet.getCell(`F${currentIdx}`)
      totalQtyCell.value = { formula: `SUM(F6:F${currentIdx - 1})` }
      totalQtyCell.font = fontTotal
      totalQtyCell.numFmt = '#,##0.00'
      totalQtyCell.alignment = { horizontal: 'right', vertical: 'middle' }

      // H: Total cost formula (styled bold and red)
      const totalCostCell = sheet.getCell(`H${currentIdx}`)
      totalCostCell.value = { formula: `SUM(H6:H${currentIdx - 1})` }
      totalCostCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFF0000' } } // Red font color
      totalCostCell.numFmt = '#,##0.00'
      totalCostCell.alignment = { horizontal: 'right', vertical: 'middle' }

      currentIdx++
    }

    // Row for spacing
    sheet.getRow(currentIdx).height = 10
    currentIdx++

    // Row for Peso en Libras
    sheet.getRow(currentIdx).height = 20
    sheet.getRow(currentIdx + 1).height = 20

    sheet.mergeCells(`A${currentIdx}:A${currentIdx + 1}`)
    const cellA_peso = sheet.getCell(`A${currentIdx}`)
    cellA_peso.value = 'PESO EN\nLIBRAS:'
    cellA_peso.font = fontHeader
    cellA_peso.alignment = alignLabel

    sheet.mergeCells(`B${currentIdx}:B${currentIdx + 1}`)
    const cellB_peso = sheet.getCell(`B${currentIdx}`)
    if (data.materiasPrimas.length === 1) {
      cellB_peso.value = Number(data.pesoMateriaPrima || 0)
    } else {
      cellB_peso.value = { formula: `SUM(F6:F${currentIdx - 3})` } // Sum of raw material quantities
    }
    cellB_peso.font = fontBody
    cellB_peso.numFmt = '#,##0.00'
    cellB_peso.alignment = alignVal

    sheet.mergeCells(`C${currentIdx}:C${currentIdx + 1}`)
    const cellC_costLabel = sheet.getCell(`C${currentIdx}`)
    cellC_costLabel.value = data.materiasPrimas.length === 1 ? 'COSTO\nUNITARIO C$:' : 'PROMEDIO\nUNITARIO C$:'
    cellC_costLabel.font = fontHeader
    cellC_costLabel.alignment = alignLabel

    sheet.mergeCells(`D${currentIdx}:D${currentIdx + 1}`)
    const cellD_costVal = sheet.getCell(`D${currentIdx}`)
    if (data.materiasPrimas.length === 1) {
      cellD_costVal.value = Number(data.costoUnitarioMateriaPrima || 0)
    } else {
      cellD_costVal.value = { formula: `H${currentIdx - 2}/F${currentIdx - 2}` }
    }
    cellD_costVal.font = fontBody
    cellD_costVal.numFmt = '"C$"#,##0.00'
    cellD_costVal.alignment = alignVal

    currentIdx += 2

    // Row for Costo Total C$
    sheet.getRow(currentIdx).height = 20
    sheet.getRow(currentIdx + 1).height = 20

    sheet.mergeCells(`A${currentIdx}:A${currentIdx + 1}`)
    const cellA_tot = sheet.getCell(`A${currentIdx}`)
    cellA_tot.value = 'COSTO\nTOTAL C$:'
    cellA_tot.font = fontHeader
    cellA_tot.alignment = alignLabel

    sheet.mergeCells(`B${currentIdx}:B${currentIdx + 1}`)
    const cellB_tot = sheet.getCell(`B${currentIdx}`)
    if (data.materiasPrimas.length === 1) {
      cellB_tot.value = Number(data.totalCosto || 0)
    } else {
      cellB_tot.value = { formula: `H${currentIdx - 4}` } // reference to total cost sum cell
    }
    cellB_tot.font = fontTitle
    cellB_tot.numFmt = '"C$"#,##0.00'
    cellB_tot.alignment = alignVal

    currentIdx += 2

    sheet.getRow(currentIdx).height = 10
    currentIdx++

    // 3. Subproductos Tabla
    sheet.getRow(currentIdx).height = 20
    sheet.getCell(`A${currentIdx}`).value = 'SUB PRODUCTOS ENTREGADOS'
    sheet.getCell(`A${currentIdx}`).font = fontTitle
    sheet.getCell(`A${currentIdx}`).alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.mergeCells(`A${currentIdx}:H${currentIdx}`)
    currentIdx++

    const headersRow = sheet.getRow(currentIdx)
    headersRow.values = [
      'CODIGO',
      'NOMBRE DE LOS INSUMOS',
      'CANTIDAD UNITARIA',
      'NUEVO COSTO UNITARIO C$',
      'CANTIDAD EN LIBRA',
      'NUEVO COSTO EN LIBRA C$',
      'COSTO TOTAL',
      'ASIGNACION DE COSTO'
    ]
    headersRow.eachCell((cell) => {
      cell.font = fontHeader
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.fill = fillTableHeader
      cell.border = borderThin
    })
    headersRow.height = 30
    currentIdx++

    const detailsStartRow = currentIdx
    let currentRowIdx = detailsStartRow
    for (const d of data.detalles) {
      const row = sheet.getRow(currentRowIdx)
      row.values = [
        d.articulo,
        d.nombre,
        d.esMermaRecorte ? '-' : Number(d.cantidadUnitaria || 0),
        d.esMermaRecorte ? '-' : Number(d.nuevoCostoUnitario || 0),
        Number(d.cantidadLibra || 0),
        Number(d.nuevoCostoLibra || 0),
        Number(d.costoTotal || 0),
        Number((d.asignacionCosto || 0) / 100)
      ]
      row.eachCell((cell, colIdx) => {
        cell.font = fontBody
        cell.border = borderThin
        if (colIdx === 3) {
          if (!d.esMermaRecorte) cell.numFmt = '#,##0'
        }
        if (colIdx === 4 || colIdx === 6 || colIdx === 7) {
          if (colIdx === 4 && d.esMermaRecorte) return
          cell.numFmt = '"C$"#,##0.00'
        }
        if (colIdx === 5) {
          cell.numFmt = '#,##0.00'
        }
        if (colIdx === 8) {
          cell.numFmt = '0.0%'
        }
      })
      currentRowIdx++
    }

    // Totales de la Tabla
    const totalRow = sheet.getRow(currentRowIdx)
    totalRow.getCell('B').value = 'TOTALES'
    totalRow.getCell('B').font = fontTotal
    totalRow.getCell('E').value = { formula: `SUM(E${detailsStartRow}:E${currentRowIdx - 1})` }
    totalRow.getCell('E').font = fontTotal
    totalRow.getCell('E').numFmt = '#,##0.00'
    totalRow.getCell('H').value = { formula: `SUM(H${detailsStartRow}:H${currentRowIdx - 1})` }
    totalRow.getCell('H').font = fontTotal
    totalRow.getCell('H').numFmt = '0.0%'

    totalRow.eachCell((cell, colIdx) => {
      if (colIdx >= 2 && colIdx <= 8) {
        cell.border = borderDoubleBottom
      }
    })
    currentRowIdx += 2

    // 4. Totales y Merma Efectiva
    sheet.getCell(`D${currentRowIdx}`).value = 'TOTAL COSTO DE PRODUCCION'
    sheet.getCell(`D${currentRowIdx}`).font = fontHeader
    sheet.getCell(`G${currentRowIdx}`).value = Number(data.totalCosto || 0)
    sheet.getCell(`G${currentRowIdx}`).font = fontTitle
    sheet.getCell(`G${currentRowIdx}`).numFmt = '"C$"#,##0.00'
    sheet.getCell(`G${currentRowIdx}`).border = borderThin
    sheet.getCell(`G${currentRowIdx}`).fill = fillTableHeader
    currentRowIdx += 2

    const mermaStartRow = currentRowIdx
    sheet.getCell(`B${currentRowIdx}`).value = 'MERMA EFECTIVA'
    sheet.getCell(`B${currentRowIdx}`).font = fontTitle

    sheet.getCell(`B${currentRowIdx + 1}`).value = 'LIBRAS ENTREGADAS DE BODEGA'
    sheet.getCell(`B${currentRowIdx + 1}`).font = fontBody
    sheet.getCell(`E${currentRowIdx + 1}`).value = Number(data.pesoMateriaPrima || 0)
    sheet.getCell(`E${currentRowIdx + 1}`).numFmt = '#,##0.00'
    sheet.getCell(`G${currentRowIdx + 1}`).value = Number(data.totalCosto || 0)
    sheet.getCell(`G${currentRowIdx + 1}`).numFmt = '"C$"#,##0.00'

    sheet.getCell(`B${currentRowIdx + 2}`).value = 'LIBRAS PRODUCIDAS EN CORTE'
    sheet.getCell(`B${currentRowIdx + 2}`).font = fontBody
    const mainProdWeightFormula = `SUMIF(H16:H${mermaStartRow - 3}, "<>0.13", E16:E${mermaStartRow - 3})` // Excluir mermas (aproximado por tasa)
    // Para ser exactos, calculamos la suma de libras producidas en JS
    const mainProds = data.detalles.filter(d => !d.esMermaRecorte)
    const mermasProds = data.detalles.filter(d => d.esMermaRecorte)
    const totalMainWeight = mainProds.reduce((sum, d) => sum + Number(d.cantidadLibra || 0), 0)
    const totalMermaWeight = mermasProds.reduce((sum, d) => sum + Number(d.cantidadLibra || 0), 0)

    sheet.getCell(`E${currentRowIdx + 2}`).value = totalMainWeight
    sheet.getCell(`E${currentRowIdx + 2}`).numFmt = '#,##0.00'
    sheet.getCell(`G${currentRowIdx + 2}`).value = 'cuadre'
    sheet.getCell(`G${currentRowIdx + 2}`).font = fontHeader
    sheet.getCell(`H${currentRowIdx + 2}`).value = '-'
    sheet.getCell(`H${currentRowIdx + 2}`).alignment = { horizontal: 'center' }
    sheet.getCell(`H${currentRowIdx + 2}`).fill = fillHighlight

    sheet.getCell(`B${currentRowIdx + 3}`).value = 'MERMA EN LIBRAS'
    sheet.getCell(`B${currentRowIdx + 3}`).font = fontBody
    sheet.getCell(`E${currentRowIdx + 3}`).value = Number(data.mermaLibras || 0)
    sheet.getCell(`E${currentRowIdx + 3}`).numFmt = '#,##0.00'

    sheet.getCell(`B${currentRowIdx + 5}`).value = '%'
    sheet.getCell(`B${currentRowIdx + 5}`).font = fontHeader
    sheet.getCell(`E${currentRowIdx + 5}`).value = Number((data.mermaPorcentaje || 0) / 100)
    sheet.getCell(`E${currentRowIdx + 5}`).font = fontTotal
    sheet.getCell(`E${currentRowIdx + 5}`).numFmt = '0.0%'
    sheet.getCell(`E${currentRowIdx + 5}`).fill = fillHighlight

    // Nota
    const mermas = data.detalles.filter(d => d.esMermaRecorte)
    const noteTexts = mermas.map(m => {
      const factorObj = (data.factors || []).find((f: any) => f.articulo === m.articulo)
      const factorPct = factorObj ? Number((Number(factorObj.factor) * 100).toFixed(2)) : 20
      const mainName = (data.materiaPrimaNombre || '').toUpperCase()
      const mName = (m.nombre || '').toUpperCase()
      return `${mName} VALUADO AL ${factorPct}% del costo del ${mainName}`
    })
    const noteValue = noteTexts.length > 0 
      ? `NOTA. ${noteTexts.join(', ')}` 
      : 'NOTA. SIN SUBPRODUCTOS DE CORTE'

    sheet.mergeCells(`F${currentRowIdx + 3}:H${currentRowIdx + 6}`)
    const noteCell = sheet.getCell(`F${currentRowIdx + 3}`)
    noteCell.value = noteValue
    noteCell.font = { name: 'Arial', size: 8, italic: true }
    noteCell.alignment = { wrapText: true, horizontal: 'left', vertical: 'top' }
    noteCell.border = borderThin

    currentRowIdx += 7

    // 5. Tabla de Cuadre
    sheet.getCell(`B${currentRowIdx}`).value = 'CUADRE'
    sheet.getCell(`B${currentRowIdx}`).font = fontHeader
    sheet.getCell(`B${currentRowIdx}`).border = borderThin
    sheet.getCell(`B${currentRowIdx}`).fill = fillTableHeader
    sheet.getCell(`C${currentRowIdx}`).value = 'PESO'
    sheet.getCell(`C${currentRowIdx}`).font = fontHeader
    sheet.getCell(`C${currentRowIdx}`).border = borderThin
    sheet.getCell(`C${currentRowIdx}`).fill = fillTableHeader
    sheet.getCell(`D${currentRowIdx}`).value = 'COSTO UNITARIO'
    sheet.getCell(`D${currentRowIdx}`).font = fontHeader
    sheet.getCell(`D${currentRowIdx}`).border = borderThin
    sheet.getCell(`D${currentRowIdx}`).fill = fillTableHeader
    sheet.getCell(`E${currentRowIdx}`).value = 'VALOR TOTAL'
    sheet.getCell(`E${currentRowIdx}`).font = fontHeader
    sheet.getCell(`E${currentRowIdx}`).border = borderThin
    sheet.getCell(`E${currentRowIdx}`).fill = fillTableHeader

    let cuadreRowIdx = currentRowIdx + 1
    // Mermas individuales en el cuadre
    for (const m of mermasProds) {
      sheet.getCell(`B${cuadreRowIdx}`).value = m.nombre
      sheet.getCell(`B${cuadreRowIdx}`).font = fontBody
      sheet.getCell(`B${cuadreRowIdx}`).border = borderThin
      sheet.getCell(`C${cuadreRowIdx}`).value = Number(m.cantidadLibra || 0)
      sheet.getCell(`C${cuadreRowIdx}`).numFmt = '#,##0.00'
      sheet.getCell(`C${cuadreRowIdx}`).border = borderThin
      sheet.getCell(`D${cuadreRowIdx}`).value = Number(m.nuevoCostoLibra || 0)
      sheet.getCell(`D${cuadreRowIdx}`).numFmt = '"C$"#,##0.00'
      sheet.getCell(`D${cuadreRowIdx}`).border = borderThin
      sheet.getCell(`E${cuadreRowIdx}`).value = Number(m.costoTotal || 0)
      sheet.getCell(`E${cuadreRowIdx}`).numFmt = '"C$"#,##0.00'
      sheet.getCell(`E${cuadreRowIdx}`).border = borderThin
      sheet.getCell(`E${cuadreRowIdx}`).fill = fillHighlight
      cuadreRowIdx++
    }

    // Subproductos agrupados
    const totalMainCosto = mainProds.reduce((sum, d) => sum + Number(d.costoTotal || 0), 0)
    const avgMainCost = totalMainWeight > 0 ? totalMainCosto / totalMainWeight : 0

    sheet.getCell(`B${cuadreRowIdx}`).value = 'SUB PRODUCTOS'
    sheet.getCell(`B${cuadreRowIdx}`).font = fontBody
    sheet.getCell(`B${cuadreRowIdx}`).border = borderThin
    sheet.getCell(`C${cuadreRowIdx}`).value = totalMainWeight
    sheet.getCell(`C${cuadreRowIdx}`).numFmt = '#,##0.00'
    sheet.getCell(`C${cuadreRowIdx}`).border = borderThin
    sheet.getCell(`D${cuadreRowIdx}`).value = avgMainCost
    sheet.getCell(`D${cuadreRowIdx}`).numFmt = '"C$"#,##0.00'
    sheet.getCell(`D${cuadreRowIdx}`).border = borderThin
    sheet.getCell(`E${cuadreRowIdx}`).value = totalMainCosto
    sheet.getCell(`E${cuadreRowIdx}`).numFmt = '"C$"#,##0.00'
    sheet.getCell(`E${cuadreRowIdx}`).border = borderThin
    sheet.getCell(`E${cuadreRowIdx}`).fill = fillHighlight
    cuadreRowIdx++

    // Costo Total
    sheet.getCell(`B${cuadreRowIdx}`).value = 'COSTO TOTAL QUE INGRESO A CORTE'
    sheet.getCell(`B${cuadreRowIdx}`).font = fontHeader
    sheet.getCell(`B${cuadreRowIdx}`).border = borderThin
    sheet.getCell(`B${cuadreRowIdx}`).alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' }
    sheet.getRow(cuadreRowIdx).height = 25
    sheet.getCell(`E${cuadreRowIdx}`).value = { formula: `SUM(E${currentRowIdx + 1}:E${cuadreRowIdx - 1})` }
    sheet.getCell(`E${cuadreRowIdx}`).font = fontTotal
    sheet.getCell(`E${cuadreRowIdx}`).numFmt = '"C$"#,##0.00'
    sheet.getCell(`E${cuadreRowIdx}`).border = borderThin
    sheet.getCell(`E${cuadreRowIdx}`).fill = fillTitle

    currentRowIdx = cuadreRowIdx + 3

    // 6. Firmas
    const sigRow = currentRowIdx
    sheet.mergeCells(`B${sigRow}:D${sigRow}`)
    const elabLabel = sheet.getCell(`B${sigRow}`)
    elabLabel.value = 'ELABORADO POR'
    elabLabel.font = fontHeader
    elabLabel.alignment = { horizontal: 'left', vertical: 'middle' }

    sheet.mergeCells(`F${sigRow}:H${sigRow}`)
    const liqLabel = sheet.getCell(`F${sigRow}`)
    liqLabel.value = 'LIQUIDADO POR'
    liqLabel.font = fontHeader
    liqLabel.alignment = { horizontal: 'left', vertical: 'middle' }

    // User / line
    const lineRow = sigRow + 2
    sheet.mergeCells(`B${lineRow}:D${lineRow}`)
    const elabVal = sheet.getCell(`B${lineRow}`)
    elabVal.value = data.elaboradoPor || 'ERPADMIN'
    elabVal.font = fontBody
    elabVal.alignment = { horizontal: 'left', vertical: 'middle' }
    
    // Set border on the merged range cells
    for (let c = 2; c <= 4; c++) {
      sheet.getRow(lineRow).getCell(c).border = { bottom: { style: 'thin' } }
    }
    for (let c = 6; c <= 8; c++) {
      sheet.getRow(lineRow).getCell(c).border = { bottom: { style: 'thin' } }
    }

    const subSigRow = sigRow + 3
    sheet.mergeCells(`B${subSigRow}:D${subSigRow}`)
    const elabSub = sheet.getCell(`B${subSigRow}`)
    elabSub.value = 'NOMBRE Y FIRMA'
    elabSub.font = { name: 'Arial', size: 7 }
    elabSub.alignment = { horizontal: 'left', vertical: 'middle' }

    sheet.mergeCells(`F${subSigRow}:H${subSigRow}`)
    const liqSub = sheet.getCell(`F${subSigRow}`)
    liqSub.value = 'NOMBRE Y FIRMA'
    liqSub.font = { name: 'Arial', size: 7 }
    liqSub.alignment = { horizontal: 'left', vertical: 'middle' }

    const footerRow = sigRow + 5
    sheet.mergeCells(`B${footerRow}:D${footerRow}`)
    const origLabel = sheet.getCell(`B${footerRow}`)
    origLabel.value = 'ORIGINAL CONTABILIDAD'
    origLabel.font = { name: 'Arial', size: 8, italic: true }
    origLabel.alignment = { horizontal: 'left', vertical: 'middle' }

    sheet.mergeCells(`F${footerRow}:H${footerRow}`)
    const copiaLabel = sheet.getCell(`F${footerRow}`)
    copiaLabel.value = 'COPIA CONSECUTIVO'
    copiaLabel.font = { name: 'Arial', size: 8, italic: true }
    copiaLabel.alignment = { horizontal: 'left', vertical: 'middle' }

    // Stream Excel to Response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=orden_produccion_${id}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()
  }

  async exportPdf(id: number, res: Response) {
    const data = await this.getOrdenData(id)

    // Formatear valores
    const fmtLoc = (num: number) => `C$ ${(num || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const fmtQty = (num: number) => (num || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const formatDate = (d: Date) => {
      const date = new Date(d)
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
    }

    const mainProds = data.detalles.filter(d => !d.esMermaRecorte)
    const mermasProds = data.detalles.filter(d => d.esMermaRecorte)
    const totalMainWeight = mainProds.reduce((sum, d) => sum + Number(d.cantidadLibra || 0), 0)
    const totalMainCosto = mainProds.reduce((sum, d) => sum + Number(d.costoTotal || 0), 0)
    const avgMainCost = totalMainWeight > 0 ? totalMainCosto / totalMainWeight : 0

    // Construcción de la tabla de detalles
    const detailsTableBody = [
      [
        { text: 'CODIGO', style: 'tableHeader' },
        { text: 'NOMBRE DE LOS INSUMOS', style: 'tableHeader' },
        { text: 'CANT. UNITARIA', style: 'tableHeader', alignment: 'right' },
        { text: 'NUEVO COSTO UNIT. C$', style: 'tableHeader', alignment: 'right' },
        { text: 'CANT. EN LIBRA', style: 'tableHeader', alignment: 'right' },
        { text: 'NUEVO COSTO LIB. C$', style: 'tableHeader', alignment: 'right' },
        { text: 'COSTO TOTAL', style: 'tableHeader', alignment: 'right' },
        { text: 'ASIGNACION COSTO', style: 'tableHeader', alignment: 'right' }
      ]
    ]

    for (const d of data.detalles) {
      detailsTableBody.push([
        { text: d.articulo, style: 'tableBody' },
        { text: d.nombre, style: 'tableBody' },
        { text: d.esMermaRecorte ? '-' : String(d.cantidadUnitaria || 0), style: 'tableBody', alignment: 'right' },
        { text: d.esMermaRecorte ? '-' : fmtLoc(d.nuevoCostoUnitario), style: 'tableBody', alignment: 'right' },
        { text: fmtQty(d.cantidadLibra), style: 'tableBody', alignment: 'right' },
        { text: fmtLoc(d.nuevoCostoLibra), style: 'tableBody', alignment: 'right' },
        { text: fmtLoc(d.costoTotal), style: 'tableBodyBold', alignment: 'right' },
        { text: `${(d.asignacionCosto || 0).toFixed(1)}%`, style: 'tableBody', alignment: 'right' }
      ] as any)
    }

    // Fila de totales
    detailsTableBody.push([
      { text: '', style: 'tableBody' },
      { text: 'TOTALES', style: 'tableBodyBold' },
      { text: '', style: 'tableBody' },
      { text: '', style: 'tableBody' },
      { text: fmtQty(totalMainWeight + mermasProds.reduce((sum, d) => sum + Number(d.cantidadLibra || 0), 0)), style: 'tableBodyBold', alignment: 'right' },
      { text: '', style: 'tableBody' },
      { text: '', style: 'tableBody' },
      { text: '100.0%', style: 'tableBodyBold', alignment: 'right' }
    ] as any)

    // Tabla de cuadre
    const cuadreTableBody = [
      [
        { text: 'CUADRE', style: 'tableHeader' },
        { text: 'PESO (LB)', style: 'tableHeader', alignment: 'right' },
        { text: 'COSTO UNITARIO', style: 'tableHeader', alignment: 'right' },
        { text: 'VALOR TOTAL', style: 'tableHeader', alignment: 'right' }
      ]
    ]

    for (const m of mermasProds) {
      cuadreTableBody.push([
        { text: m.nombre, style: 'tableBody' },
        { text: fmtQty(m.cantidadLibra), style: 'tableBody', alignment: 'right' },
        { text: fmtLoc(m.nuevoCostoLibra), style: 'tableBody', alignment: 'right' },
        { text: fmtLoc(m.costoTotal), style: 'tableBodyBold', alignment: 'right', fillColor: '#FFFFCC' }
      ] as any)
    }

    cuadreTableBody.push([
      { text: 'SUB PRODUCTOS', style: 'tableBody' },
      { text: fmtQty(totalMainWeight), style: 'tableBody', alignment: 'right' },
      { text: fmtLoc(avgMainCost), style: 'tableBody', alignment: 'right' },
      { text: fmtLoc(totalMainCosto), style: 'tableBodyBold', alignment: 'right', fillColor: '#FFFFCC' }
    ] as any)

    cuadreTableBody.push([
      { text: 'COSTO TOTAL QUE INGRESO A CORTE', style: 'tableBodyBold', fillColor: '#E9EEF4' },
      { text: '', style: 'tableBody' },
      { text: '', style: 'tableBody' },
      { text: fmtLoc(data.totalCosto), style: 'tableBodyBold', alignment: 'right', fillColor: '#E9EEF4' }
    ] as any)

    const pdfNoteTexts = mermasProds.map(m => {
      const factorObj = (data.factors || []).find((f: any) => f.articulo === m.articulo)
      const factorPct = factorObj ? Number((Number(factorObj.factor) * 100).toFixed(2)) : 20
      const mainName = (data.materiaPrimaNombre || '').toUpperCase()
      const mName = (m.nombre || '').toUpperCase()
      return `${mName} VALUADO AL ${factorPct}% del costo del ${mainName}`
    })
    const pdfNoteValue = pdfNoteTexts.length > 0 
      ? `NOTA. ${pdfNoteTexts.join(', ')}` 
      : 'NOTA. SIN SUBPRODUCTOS DE CORTE'

    const metaTableBody = []

    // Row 1: Fecha & Doc. Softland
    metaTableBody.push([
      { text: 'FECHA OPERATIVA:', style: 'metaLabel' },
      { text: formatDate(data.fecha), style: 'metaVal', colSpan: 3 },
      {}, {},
      { text: 'DOC. SOFTLAND:', style: 'metaLabel' },
      { text: data.documentoConsumo, style: 'metaVal', colSpan: 2 },
      {}
    ])

    if (data.materiasPrimas.length === 1) {
      // Original 3 rows
      metaTableBody.push([
        { text: 'PRODUCTO A PROCESAR:', style: 'metaLabel' },
        { text: data.materiaPrimaNombre, style: 'metaVal', colSpan: 3 },
        {}, {},
        { text: 'CODIGO:', style: 'metaLabel' },
        { text: data.materiaPrima, style: 'metaVal', colSpan: 2 },
        {}
      ])
      metaTableBody.push([
        { text: 'PESO EN LIBRAS:', style: 'metaLabel' },
        { text: fmtQty(data.pesoMateriaPrima), style: 'metaVal', colSpan: 3 },
        {}, {},
        { text: 'COSTO UNIT.:', style: 'metaLabel' },
        { text: fmtLoc(data.costoUnitarioMateriaPrima), style: 'metaVal', colSpan: 2 },
        {}
      ])
      metaTableBody.push([
        { text: 'COSTO TOTAL C$:', style: 'metaLabelBold' },
        { text: fmtLoc(data.totalCosto), style: 'metaValTitle', colSpan: 3 },
        {}, {},
        { text: 'Nº DOCUMENTO:', style: 'metaLabel' },
        { text: data.numeroDocumento || '', style: 'metaVal', colSpan: 2 },
        {}
      ])
    } else {
      const N = data.materiasPrimas.length

      // Add column headers row for raw materials
      metaTableBody.push([
        { text: 'PRODUCTO A PROCESAR:', style: 'metaLabel', rowSpan: N + 1 },
        {},
        {},
        {},
        {},
        { text: 'Costo und', style: 'metaLabel', alignment: 'right' },
        { text: 'Costo total', style: 'metaLabel', alignment: 'right' }
      ])

      // Add N raw material rows
      for (let i = 0; i < N; i++) {
        const mp = data.materiasPrimas[i]
        metaTableBody.push([
          {},
          { text: mp.nombre || 'N/A', style: 'metaVal' },
          { text: 'CODIGO:', style: 'metaLabel' },
          { text: mp.articulo, style: 'metaVal' },
          { text: fmtQty(mp.cantidad) + ' LBS', style: 'metaVal', alignment: 'right' },
          { text: fmtLoc(mp.costoUnitario), style: 'metaVal', alignment: 'right' },
          { text: fmtLoc(mp.costoTotal || (mp.cantidad * mp.costoUnitario)), style: 'metaValBold', alignment: 'right' }
        ])
      }

      // Add raw material totals row
      const totalMpQty = data.materiasPrimas.reduce((sum, mp) => sum + Number(mp.cantidad || 0), 0)
      metaTableBody.push([
        {}, {}, {}, {},
        { text: fmtQty(totalMpQty) + ' LBS', style: 'metaValBold', alignment: 'right' },
        {},
        { text: fmtLoc(data.totalCosto), style: 'metaValTitle', alignment: 'right', color: '#FF0000' }
      ])

      // Add Peso en Libras / Promedio Unitario row
      const avgUnitCost = totalMpQty > 0 ? (data.totalCosto / totalMpQty) : 0
      metaTableBody.push([
        { text: 'PESO EN LIBRAS:', style: 'metaLabel' },
        { text: fmtQty(totalMpQty), style: 'metaVal', colSpan: 3 },
        {}, {},
        { text: 'PROMEDIO UNIT.:', style: 'metaLabel' },
        { text: fmtLoc(avgUnitCost), style: 'metaVal', colSpan: 2 },
        {}
      ])

      // Add Costo Total / Nº Documento row
      metaTableBody.push([
        { text: 'COSTO TOTAL C$:', style: 'metaLabelBold' },
        { text: fmtLoc(data.totalCosto), style: 'metaValTitle', colSpan: 3 },
        {}, {},
        { text: 'Nº DOCUMENTO:', style: 'metaLabel' },
        { text: data.numeroDocumento || '', style: 'metaVal', colSpan: 2 },
        {}
      ])
    }

    const docDefinition = {
      pageSize: 'LETTER',
      pageMargins: [30, 30, 30, 30],
      content: [
        // Encabezado
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: `REST. EL ESKIMO S.A. (${data.bodegaNombre})`,
                  alignment: 'center',
                  bold: true,
                  fontSize: 10,
                  fillColor: '#E9EEF4',
                  margin: [0, 4, 0, 4]
                }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 6]
        },
        { text: 'ORDEN DE PRODUCCION', style: 'mainTitle' },

        // Bloque Meta
        {
          table: {
            widths: [110, '*', 45, 55, 60, 60, 60],
            body: metaTableBody
          },
          layout: 'lightHorizontalLines',
          margin: [0, 10, 0, 15]
        },

        // Subtítulo Tabla
        { text: 'SUB PRODUCTOS ENTREGADOS', style: 'subTitle' },

        // Tabla de Detalles
        {
          table: {
            headerRows: 1,
            widths: [55, '*', 45, 62, 45, 62, 65, 45],
            body: detailsTableBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#CCCCCC',
            vLineColor: () => '#CCCCCC'
          },
          margin: [0, 5, 0, 15]
        },

        // Merma & Cuadre
        {
          columns: [
            // Lado izquierdo: Merma Efectiva
            {
              width: '*',
              stack: [
                { text: 'MERMA EFECTIVA', style: 'subTitle' },
                {
                  table: {
                    widths: ['*', 50, 65],
                    body: [
                      [
                        { text: 'LIBRAS ENTREGADAS DE BODEGA', style: 'metaLabel' },
                        { text: fmtQty(data.pesoMateriaPrima), style: 'metaVal', alignment: 'right' },
                        { text: fmtLoc(data.totalCosto), style: 'metaVal', alignment: 'right' }
                      ],
                      [
                        { text: 'LIBRAS PRODUCIDAS EN CORTE', style: 'metaLabel' },
                        { text: fmtQty(totalMainWeight), style: 'metaVal', alignment: 'right' },
                        { text: 'cuadre', style: 'metaValBold', alignment: 'right', fillColor: '#FFFF99' }
                      ],
                      [
                        { text: 'MERMA EN LIBRAS', style: 'metaLabel' },
                        { text: fmtQty(data.mermaLibras), style: 'metaVal', alignment: 'right' },
                        { text: '-', style: 'metaVal', alignment: 'right' }
                      ],
                      [
                        { text: '%', style: 'metaLabelBold' },
                        { text: `${(data.mermaPorcentaje || 0).toFixed(1)}%`, style: 'metaValBold', alignment: 'right', fillColor: '#FFFF99' },
                        { text: '', border: [false] }
                      ]
                    ]
                  },
                  layout: 'horizontalLines',
                  margin: [0, 5, 0, 0]
                },
                {
                  text: `\n${pdfNoteValue}.`,
                  style: 'noteText',
                  margin: [0, 5, 0, 0]
                }
              ]
            },
            // Espaciador
            { width: 20, text: '' },
            // Lado derecho: Cuadre
            {
              width: 230,
              stack: [
                { text: 'DESGLOSE DE CUADRE', style: 'subTitle' },
                {
                  table: {
                    widths: ['*', 45, 52, 60],
                    body: cuadreTableBody
                  },
                  layout: 'grid',
                  margin: [0, 5, 0, 0]
                }
              ]
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Firmas
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'ELABORADO POR', style: 'signatureTitle' },
                { text: '\n\n' },
                { text: data.elaboradoPor || 'ERPADMIN', style: 'signatureName' },
                { text: 'NOMBRE Y FIRMA', style: 'signatureSub' }
              ]
            },
            { width: 50, text: '' },
            {
              width: '*',
              stack: [
                { text: 'LIQUIDADO POR', style: 'signatureTitle' },
                { text: '\n\n' },
                { text: '', style: 'signatureName' },
                { text: 'NOMBRE Y FIRMA', style: 'signatureSub' }
              ]
            }
          ],
          margin: [0, 10, 0, 25]
        },

        // Copias Footer
        {
          columns: [
            { text: 'ORIGINAL CONTABILIDAD', style: 'copyMark' },
            { text: 'COPIA CONSECUTIVO', style: 'copyMark', alignment: 'right' }
          ]
        }
      ],
      defaultStyle: {
        font: 'Helvetica'
      },
      styles: {
        mainTitle: {
          fontSize: 13,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        subTitle: {
          fontSize: 9,
          bold: true,
          color: '#531424',
          margin: [0, 0, 0, 3]
        },
        metaLabel: {
          fontSize: 8,
          bold: true,
          color: '#444444'
        },
        metaLabelBold: {
          fontSize: 8,
          bold: true,
          color: '#531424'
        },
        metaVal: {
          fontSize: 8
        },
        metaValBold: {
          fontSize: 8,
          bold: true
        },
        metaValTitle: {
          fontSize: 10,
          bold: true,
          color: '#531424'
        },
        tableHeader: {
          fontSize: 7,
          bold: true,
          fillColor: '#F2F2F2',
          alignment: 'center'
        },
        tableBody: {
          fontSize: 7
        },
        tableBodyBold: {
          fontSize: 7,
          bold: true
        },
        noteText: {
          fontSize: 7,
          italics: true,
          color: '#666666'
        },
        signatureTitle: {
          fontSize: 8,
          bold: true,
          alignment: 'center'
        },
        signatureName: {
          fontSize: 8,
          alignment: 'center',
          decoration: 'underline'
        },
        signatureSub: {
          fontSize: 6,
          alignment: 'center',
          color: '#777777'
        },
        copyMark: {
          fontSize: 7,
          italics: true,
          color: '#999999'
        }
      }
    }

    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    }

    const resolver = new URLResolver.default(pdfmake.virtualfs)
    resolver.setUrlAccessPolicy(pdfmake.urlAccessPolicy)

    const printer = new PdfPrinter.default(
      fonts,
      pdfmake.virtualfs,
      resolver,
      pdfmake.localAccessPolicy
    )
    const pdfDoc = await printer.createPdfKitDocument(docDefinition)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=orden_produccion_${id}.pdf`)

    pdfDoc.pipe(res)
    pdfDoc.end()
  }

  async exportTrasladoPdf(id: number, logos: string, titulo: string, res: Response) {
    const trasladoRepo = this.dataSource.getRepository(TrasladoInternoEncabezado)
    const detallesRepo = this.dataSource.getRepository(TrasladoInternoDetalle)
    const bodegaRepo = this.dataSource.getRepository(Bodega)

    const traslado = await trasladoRepo.findOneBy({ id })
    if (!traslado) {
      throw new NotFoundException(`No se encontró el traslado interno con ID ${id}`)
    }

    const detalles = await detallesRepo.find({
      where: { trasladoInternoId: id }
    })

    const bodegasDb = await bodegaRepo.find()
    const getBodegaName = (code: string) => {
      const b = bodegasDb.find(x => x.bodega.trim() === code.trim())
      return b ? `${code} - ${b.nombre}` : code
    }

    const docTitle = titulo ? `HOJA DE PEDIDO - ${titulo.toUpperCase()}` : 'HOJA DE PEDIDO'

    // Formatear valores
    const fmtLoc = (num: number) => `C$ ${(num || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const fmtQty = (num: number) => num ? num.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'
    const formatDate = (d: Date) => {
      const date = new Date(d)
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
    }

    // Cargar logos si existen
    const logoEskimoPath = path.join(process.cwd(), 'static', 'logoEskimo.jpeg')
    const logoCremaPath = path.join(process.cwd(), 'static', 'logoCremaBatida.jpeg')

    let logoEskimoBase64 = ''
    if (fs.existsSync(logoEskimoPath)) {
      logoEskimoBase64 = `data:image/jpeg;base64,${fs.readFileSync(logoEskimoPath).toString('base64')}`
    }

    let logoCremaBase64 = ''
    if (fs.existsSync(logoCremaPath)) {
      logoCremaBase64 = `data:image/jpeg;base64,${fs.readFileSync(logoCremaPath).toString('base64')}`
    }

    // Configurar encabezado del PDF con logos dinámicos
    const headerColumns: any[] = []

    if (logos === 'both') {
      if (logoEskimoBase64) {
        headerColumns.push({ image: logoEskimoBase64, width: 80, alignment: 'left' })
      } else {
        headerColumns.push({ text: '', width: 80 })
      }

      headerColumns.push({
        text: [
          { text: `${docTitle}\n`, fontSize: 12, bold: true }
        ],
        alignment: 'center',
        margin: [0, 10, 0, 0],
        width: '*'
      })

      if (logoCremaBase64) {
        headerColumns.push({ image: logoCremaBase64, width: 80, alignment: 'right' })
      } else {
        headerColumns.push({ text: '', width: 80 })
      }
    } else if (logos === 'eskimo') {
      if (logoEskimoBase64) {
        headerColumns.push({ image: logoEskimoBase64, width: 80, alignment: 'left' })
      }
      headerColumns.push({
        text: [
          { text: `${docTitle}\n`, fontSize: 12, bold: true }
        ],
        alignment: 'center',
        margin: [0, 10, 0, 0],
        width: '*'
      })
      if (logoEskimoBase64) {
        headerColumns.push({ text: '', width: 80 })
      }
    } else if (logos === 'crema') {
      if (logoCremaBase64) {
        headerColumns.push({ image: logoCremaBase64, width: 80, alignment: 'left' })
      }
      headerColumns.push({
        text: [
          { text: `${docTitle}\n`, fontSize: 12, bold: true }
        ],
        alignment: 'center',
        margin: [0, 10, 0, 0],
        width: '*'
      })
      if (logoCremaBase64) {
        headerColumns.push({ text: '', width: 80 })
      }
    } else {
      headerColumns.push({
        text: [
          { text: `${docTitle}\n`, fontSize: 12, bold: true }
        ],
        alignment: 'center',
        margin: [0, 5, 0, 5],
        width: '*'
      })
    }

    // Body de la tabla de detalles (Sin agrupamiento, lista plana de los detalles)
    const tableBody = [
      [
        { text: 'CÓDIGO', style: 'tableHeader' },
        { text: 'DESCRIPCIÓN', style: 'tableHeader' },
        { text: 'UNIDAD', style: 'tableHeader', alignment: 'center' },
        { text: 'LB', style: 'tableHeader', alignment: 'center' },
        { text: 'C/U', style: 'tableHeader', alignment: 'center' },
        { text: 'COSTO TOTAL', style: 'tableHeader', alignment: 'right' }
      ]
    ]

    let overallTotal = 0
    for (const d of detalles) {
      const rowTotal = Number(d.costoTotal || 0)
      overallTotal += rowTotal

      tableBody.push([
        { text: d.articulo, style: 'tableBody', font: 'Courier' },
        { text: d.descripcion, style: 'tableBody' },
        { text: d.unidad ? fmtQty(d.unidad) : '-', style: 'tableBody', alignment: 'center' },
        { text: d.lb ? fmtQty(d.lb) : '-', style: 'tableBody', alignment: 'center' },
        { text: fmtLoc(d.costoUnitario), style: 'tableBody', alignment: 'center' },
        { text: fmtLoc(d.costoTotal), style: 'tableBodyBold', alignment: 'right' }
      ] as any)
    }

    // Fila totalizador
    tableBody.push([
      { text: '', border: [false] },
      { text: 'VALOR TOTAL DEL TRASLADO:', style: 'tableBodyBold', alignment: 'right', colSpan: 4 },
      {}, {}, {},
      { text: fmtLoc(overallTotal), style: 'tableBodyBold', alignment: 'right', fillColor: '#F2F2F2' }
    ] as any)

    const docDefinition = {
      pageSize: 'LETTER',
      pageMargins: [35, 30, 35, 95],
      content: [
        // Fila de encabezado con logos
        {
          columns: headerColumns,
          margin: [0, 0, 0, 15]
        },
        // Bloque de información simplificado (Fecha, Supervisor y Autorizado)
        {
          stack: [
            {
              text: [
                { text: 'FECHA: ', bold: true, fontSize: 8.5 },
                { text: formatDate(traslado.fecha), fontSize: 8.5 }
              ]
            },
            {
              text: [
                { text: 'Nº DOCUMENTO: ', bold: true, fontSize: 8.5 },
                { text: traslado.numeroDocumento || 'N/D', fontSize: 8.5 }
              ],
              margin: [0, 4, 0, 0]
            },
            {
              text: [
                { text: 'SUPERVISOR: ', bold: true, fontSize: 7.5 },
                { text: '________________________________________', color: '#CCCCCC', fontSize: 7.5 }
              ],
              margin: [0, 4, 0, 0]
            },
            {
              text: [
                { text: 'AUTORIZADO: ', bold: true, fontSize: 7.5 },
                { text: '________________________________________', color: '#CCCCCC', fontSize: 7.5 }
              ],
              margin: [0, 4, 0, 0]
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Referencia si existe
        traslado.referencia ? {
          stack: [
            { text: 'COMENTARIOS / REFERENCIA', style: 'subTitle' },
            { text: traslado.referencia, style: 'noteText', margin: [0, 2, 0, 12] }
          ]
        } : null,

        // Tabla de detalles
        {
          table: {
            headerRows: 1,
            widths: [60, '*', 55, 55, 80, 85],
            body: tableBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#CCCCCC',
            vLineColor: () => '#CCCCCC'
          },
          margin: [0, 0, 0, 30]
        }
      ].filter(Boolean),
      footer: (currentPage: number, pageCount: number) => {
        if (currentPage === pageCount) {
          return {
            columns: [
              {
                width: '*',
                stack: [
                  { text: '\n\n' },
                  { text: '___________________________', alignment: 'center', color: '#CCCCCC' },
                  { text: 'ELABORADO', style: 'signatureTitle', margin: [0, 4, 0, 0] }
                ]
              },
              { width: 60, text: '' },
              {
                width: '*',
                stack: [
                  { text: '\n\n' },
                  { text: '___________________________', alignment: 'center', color: '#CCCCCC' },
                  { text: 'APROBADO', style: 'signatureTitle', margin: [0, 4, 0, 0] }
                ]
              }
            ],
            margin: [35, 0, 35, 0]
          }
        }
        return null
      },
      defaultStyle: {
        font: 'Helvetica'
      },
      styles: {
        subTitle: {
          fontSize: 8,
          bold: true,
          color: '#531424',
          margin: [0, 0, 0, 3]
        },
        metaLabel: {
          fontSize: 8,
          bold: true,
          color: '#444444'
        },
        metaVal: {
          fontSize: 8
        },
        tableHeader: {
          fontSize: 7,
          bold: true,
          fillColor: '#F2F2F2',
          alignment: 'center'
        },
        tableBody: {
          fontSize: 7
        },
        tableBodyBold: {
          fontSize: 7,
          bold: true
        },
        noteText: {
          fontSize: 8,
          italics: true,
          color: '#444444'
        },
        signatureTitle: {
          fontSize: 8,
          bold: true,
          alignment: 'center'
        },
        signatureSub: {
          fontSize: 6,
          alignment: 'center',
          color: '#777777',
          margin: [0, 4, 0, 0]
        }
      }
    }

    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      },
      Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique'
      }
    }

    const resolver = new URLResolver.default(pdfmake.virtualfs)
    resolver.setUrlAccessPolicy(pdfmake.urlAccessPolicy)

    const printer = new PdfPrinter.default(
      fonts,
      pdfmake.virtualfs,
      resolver,
      pdfmake.localAccessPolicy
    )
    const pdfDoc = await printer.createPdfKitDocument(docDefinition)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=traslado_interno_${id}.pdf`)

    pdfDoc.pipe(res)
    pdfDoc.end()
  }
}
