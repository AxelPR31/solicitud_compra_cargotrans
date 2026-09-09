import { Injectable } from '@nestjs/common'
// exceljs es CommonJS; en runtime puede quedar como { default: ... } si se importa como default.
// Usamos require para asegurar compatibilidad.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExcelJS = require('exceljs')
// pdfmake en Node usa PdfPrinter desde `pdfmake/js/printer`.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/js/printer').default
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { ReporteProyectoMonedaDto } from './dto/reporte-proyecto-moneda.dto'
import {
  ReporteProyectoDetalleDto,
  ReporteProyectoEntradaDetalleDto,
  ReporteProyectoFacturaDetalleDto,
} from './dto/reporte-proyecto-detalle.dto'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class ReportesExportService {
  async toExcelProyectoMoneda(data: ReporteProyectoMonedaDto): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Reporte')

    ws.columns = [
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Proyecto', key: 'codigoProyecto', width: 18 },
      { header: 'Moneda', key: 'moneda', width: 10 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Total', key: 'total', width: 18 },
    ]

    ws.addRows(data.rows)

    ws.getRow(1).font = { bold: true }
    ws.getColumn('cantidad').alignment = { horizontal: 'right' }
    ws.getColumn('total').alignment = { horizontal: 'right' }
    ws.getColumn('total').numFmt = '#,##0.00'

    const buf = await wb.xlsx.writeBuffer()
    return Buffer.from(buf)
  }

  async toExcelDetalleProyecto(
    data: ReporteProyectoDetalleDto,
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'cs_erp_server'
    wb.created = new Date()

    // Colores profesionales
    const headerColor = 'FF0F2A4A'
    const headerFontColor = 'FFFFFFFF'
    const projectTitleColor = 'FF2E5B8A'
    const projectTitleFontColor = 'FFFFFFFF'
    const totalRowColor = 'FFE8F0FE'
    const alternateRowColor = 'FFF8F9FA'

    // Función helper para aplicar bordes
    const applyBorder = (row: any, color = 'FFD0D0D0') => {
      row.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.border = {
          top: { style: 'thin', color: { argb: color } },
          left: { style: 'thin', color: { argb: color } },
          bottom: { style: 'thin', color: { argb: color } },
          right: { style: 'thin', color: { argb: color } },
        }
      })
    }

    // Hoja: PARAMETROS (primera hoja con diseño mejorado)
    const wsParams = wb.addWorksheet('PARÁMETROS')
    wsParams.tabColor = 'FF0F2A4A'

    const proyectoParam = data.codigoProyecto
      ? (data.facturas?.[0] as any)?.proyectoDisplay ||
        (data.entradas?.[0] as any)?.proyectoDisplay ||
        data.codigoProyecto
      : 'TODOS'

    // Título principal
    wsParams.mergeCells('A1:B1')
    const titleCell = wsParams.getCell('A1')
    titleCell.value = 'Reporte de Facturas y Entradas'
    titleCell.font = { bold: true, size: 16, color: { argb: headerFontColor } }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerColor },
    }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    wsParams.getRow(2).height = 20

    wsParams.columns = [
      { header: 'Campo', key: 'campo', width: 20 },
      { header: 'Valor', key: 'valor', width: 40 },
    ]

    wsParams.addRows([
      { campo: 'Proyecto', valor: proyectoParam },
      { campo: 'Desde', valor: data.desde ?? '-' },
      { campo: 'Hasta', valor: data.hasta ?? '-' },
    ])

    // Estilo de encabezados
    const headerRowParams = wsParams.getRow(3)
    headerRowParams.font = { bold: true, color: { argb: headerFontColor } }
    headerRowParams.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerColor },
    }
    headerRowParams.alignment = { horizontal: 'center' }
    applyBorder(headerRowParams)

    // Estilo de filas de datos
    for (let i = 4; i <= 6; i++) {
      const row = wsParams.getRow(i)
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' },
        }
      })
      applyBorder(row)
    }

    // Hoja: FACTURAS (agrupado por proyecto con diseño mejorado)
    const wsFact = wb.addWorksheet('FACTURAS')
    wsFact.tabColor = 'FF2E5B8A'

    // Título de la hoja
    wsFact.mergeCells('A1:J1')
    const factTitleCell = wsFact.getCell('A1')
    factTitleCell.value = 'FACTURAS'
    factTitleCell.font = {
      bold: true,
      size: 14,
      color: { argb: headerFontColor },
    }
    factTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: headerColor,
    }
    factTitleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    wsFact.getRow(2).height = 25

    wsFact.columns = [
      { header: 'Proyecto', key: 'codigoProyecto', width: 18 },
      { header: 'Cuenta', key: 'cuentaBanco', width: 16 },
      { header: 'Subtipo', key: 'subtipo', width: 10 },
      { header: 'Número', key: 'numero', width: 12 },
      { header: 'Factura', key: 'factura', width: 16 },
      { header: 'Moneda', key: 'moneda', width: 10 },
      { header: 'Total Local', key: 'totalLocal', width: 16 },
      { header: 'Total USD', key: 'totalUsd', width: 16 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Ref', key: 'referencia', width: 18 },
    ]

    const facturasPorProyecto = this.groupByProyecto(data.facturas)
    let currentRow = 3

    // Estilo de encabezado de tabla
    const headerRowFact = wsFact.getRow(2)
    headerRowFact.font = { bold: true, color: { argb: headerFontColor } }
    headerRowFact.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerColor },
    }
    headerRowFact.alignment = { horizontal: 'center' }
    applyBorder(headerRowFact)

    for (const [proy, rows] of facturasPorProyecto) {
      const proyectoLabel = (rows[0] as any)?.proyectoDisplay || proy
      // Título del proyecto
      wsFact.addRow({
        codigoProyecto: proyectoLabel,
        cuentaBanco: '',
        subtipo: '',
        numero: '',
        factura: '',
        moneda: '',
        total: null,
        totalLocal: null,
        totalUsd: null,
        fecha: '',
        referencia: '',
      })
      const titleRow = wsFact.lastRow
      titleRow.height = 28
      titleRow.font = {
        bold: true,
        size: 12,
        color: { argb: projectTitleFontColor },
      }
      titleRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: projectTitleColor },
      }
      titleRow.alignment = { horizontal: 'left', vertical: 'middle' }
      wsFact.mergeCells(`A${titleRow.number}:J${titleRow.number}`)
      applyBorder(titleRow, 'FF0F2A4A')
      currentRow++

      // Filas de facturas con zebra striping
      let dataRowIndex = 0
      for (const r of rows) {
        wsFact.addRow({
          codigoProyecto: (r as any).proyectoDisplay ?? r.codigoProyecto,
          cuentaBanco: r.cuentaBanco,
          subtipo: r.subtipo ?? '',
          numero: r.numero ?? '',
          factura: r.factura ?? '',
          moneda: (r.moneda ?? '').toString(),
          totalLocal: Number((r as any).totalLocal ?? 0),
          totalUsd: Number((r as any).totalUsd ?? 0),
          fecha: r.fecha,
          referencia: r.referencia ?? '',
        })
        const dataRow = wsFact.lastRow
        if (dataRowIndex % 2 === 0) {
          dataRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: alternateRowColor },
            }
          })
        }
        applyBorder(dataRow)
        dataRowIndex++
        currentRow++
      }

      // Totales por moneda (como en el PDF)
      const totalesPorMoneda = this.groupByMoneda(rows).map(([moneda, rs]) => ({
        moneda,
        totalLocal: rs.reduce(
          (acc, r) => acc + Number((r as any).totalLocal ?? 0),
          0,
        ),
        totalUsd: rs.reduce(
          (acc, r) => acc + Number((r as any).totalUsd ?? 0),
          0,
        ),
      }))

      for (const t of totalesPorMoneda) {
        wsFact.addRow({
          codigoProyecto: `Total ${proyectoLabel} (${t.moneda})`,
          cuentaBanco: '',
          subtipo: '',
          numero: '',
          factura: '',
          moneda: '',
          totalLocal: t.totalLocal,
          totalUsd: t.totalUsd,
          fecha: '',
          referencia: '',
        })
        const totalRow = wsFact.lastRow
        totalRow.height = 24
        totalRow.font = { bold: true, size: 11, color: { argb: 'FF000000' } }
        totalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: totalRowColor },
        }
        totalRow.alignment = { horizontal: 'left', vertical: 'middle' }
        wsFact.mergeCells(`A${totalRow.number}:F${totalRow.number}`)
        wsFact.mergeCells(`I${totalRow.number}:J${totalRow.number}`)
        applyBorder(totalRow, 'FF4A90E2')
        currentRow++
      }

      // Espacio en blanco entre proyectos
      wsFact.addRow([])
      const spacerRow = wsFact.lastRow
      spacerRow.height = 10
      currentRow++
    }

    wsFact.getColumn('totalLocal').alignment = { horizontal: 'right' }
    wsFact.getColumn('totalLocal').numFmt = '#,##0.00'
    wsFact.getColumn('totalUsd').alignment = { horizontal: 'right' }
    wsFact.getColumn('totalUsd').numFmt = '#,##0.00'

    // Hoja: ENTRADAS (agrupado por proyecto con diseño mejorado)
    const wsEnt = wb.addWorksheet('ENTRADAS')
    wsEnt.tabColor = 'FF2E5B8A'

    // Título de la hoja
    wsEnt.mergeCells('A1:J1')
    const entTitleCell = wsEnt.getCell('A1')
    entTitleCell.value = 'ENTRADAS'
    entTitleCell.font = {
      bold: true,
      size: 14,
      color: { argb: headerFontColor },
    }
    entTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerColor },
    }
    entTitleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    wsEnt.getRow(2).height = 25

    wsEnt.columns = [
      { header: 'Proyecto', key: 'codigoProyecto', width: 18 },
      { header: 'Cuenta', key: 'cuentaBanco', width: 16 },
      { header: 'Tipo', key: 'tipo', width: 10 },
      { header: 'Número', key: 'numero', width: 12 },
      { header: 'Descripción', key: 'descripcion', width: 30 },
      { header: 'Moneda', key: 'moneda', width: 10 },
      { header: 'Monto Local', key: 'montoLocal', width: 16 },
      { header: 'Monto USD', key: 'montoUsd', width: 16 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Ref', key: 'referencia', width: 18 },
    ]

    const entradasPorProyecto = this.groupByProyecto(data.entradas)
    currentRow = 3

    // Estilo de encabezado de tabla
    const headerRowEnt = wsEnt.getRow(2)
    headerRowEnt.font = { bold: true, color: { argb: headerFontColor } }
    headerRowEnt.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerColor },
    }
    headerRowEnt.alignment = { horizontal: 'center' }
    applyBorder(headerRowEnt)

    for (const [proy, rows] of entradasPorProyecto) {
      const proyectoLabel = (rows[0] as any)?.proyectoDisplay || proy
      // Título del proyecto
      wsEnt.addRow({
        codigoProyecto: proyectoLabel,
        cuentaBanco: '',
        tipo: '',
        numero: '',
        descripcion: '',
        moneda: '',
        monto: null,
        montoLocal: null,
        montoUsd: null,
        fecha: '',
        referencia: '',
      })
      const titleRow = wsEnt.lastRow
      titleRow.height = 28
      titleRow.font = {
        bold: true,
        size: 12,
        color: { argb: projectTitleFontColor },
      }
      titleRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: projectTitleColor },
      }
      titleRow.alignment = { horizontal: 'left', vertical: 'middle' }
      wsEnt.mergeCells(`A${titleRow.number}:J${titleRow.number}`)
      applyBorder(titleRow, 'FF0F2A4A')
      currentRow++

      // Filas de entradas con zebra striping
      let dataRowIndex = 0
      for (const r of rows) {
        wsEnt.addRow({
          codigoProyecto: (r as any).proyectoDisplay ?? r.codigoProyecto,
          cuentaBanco: r.cuentaBanco,
          tipo: r.tipo ?? '',
          numero: r.numero ?? '',
          descripcion: r.descripcion ?? '',
          moneda: (r.moneda ?? '').toString(),
          montoLocal: Number((r as any).montoLocal ?? 0),
          montoUsd: Number((r as any).montoUsd ?? 0),
          fecha: r.fecha,
          referencia: r.referencia ?? '',
        })
        const dataRow = wsEnt.lastRow
        if (dataRowIndex % 2 === 0) {
          dataRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: alternateRowColor },
            }
          })
        }
        applyBorder(dataRow)
        dataRowIndex++
        currentRow++
      }

      // Totales por moneda (como en el PDF)
      const totalesPorMoneda = this.groupByMoneda(rows).map(([moneda, rs]) => ({
        moneda,
        totalLocal: rs.reduce(
          (acc, r) => acc + Number((r as any).montoLocal ?? 0),
          0,
        ),
        totalUsd: rs.reduce(
          (acc, r) => acc + Number((r as any).montoUsd ?? 0),
          0,
        ),
      }))

      for (const t of totalesPorMoneda) {
        wsEnt.addRow({
          codigoProyecto: `Total ${proyectoLabel} (${t.moneda})`,
          cuentaBanco: '',
          tipo: '',
          numero: '',
          descripcion: '',
          moneda: '',
          monto: null,
          montoLocal: t.totalLocal,
          montoUsd: t.totalUsd,
          fecha: '',
          referencia: '',
        })
        const totalRow = wsEnt.lastRow
        totalRow.height = 24
        totalRow.font = { bold: true, size: 11, color: { argb: 'FF000000' } }
        totalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: totalRowColor },
        }
        totalRow.alignment = { horizontal: 'left', vertical: 'middle' }
        wsEnt.mergeCells(`A${totalRow.number}:F${totalRow.number}`)
        wsEnt.mergeCells(`I${totalRow.number}:J${totalRow.number}`)
        applyBorder(totalRow, 'FF4A90E2')
        currentRow++
      }

      // Espacio en blanco entre proyectos
      wsEnt.addRow([])
      const spacerRow = wsEnt.lastRow
      spacerRow.height = 10
      currentRow++
    }

    wsEnt.getColumn('montoLocal').alignment = { horizontal: 'right' }
    wsEnt.getColumn('montoLocal').numFmt = '#,##0.00'
    wsEnt.getColumn('montoUsd').alignment = { horizontal: 'right' }
    wsEnt.getColumn('montoUsd').numFmt = '#,##0.00'

    // RESUMEN GENERAL (suma de todo, en local y en USD)
    const wsResumen = wb.addWorksheet('RESUMEN')
    wsResumen.tabColor = 'FF0F2A4A'
    wsResumen.columns = [
      { header: 'Tipo', key: 'tipo', width: 18 },
      { header: 'Total Local', key: 'totalLocal', width: 20 },
      { header: 'Total USD', key: 'totalUsd', width: 20 },
    ]
    wsResumen.getRow(1).font = { bold: true }

    const totalFactLocal = data.facturas.reduce(
      (acc, r: any) => acc + Number(r.totalLocal ?? 0),
      0,
    )
    const totalFactUsd = data.facturas.reduce(
      (acc, r: any) => acc + Number(r.totalUsd ?? 0),
      0,
    )
    const totalEntLocal = data.entradas.reduce(
      (acc, r: any) => acc + Number(r.montoLocal ?? 0),
      0,
    )
    const totalEntUsd = data.entradas.reduce(
      (acc, r: any) => acc + Number(r.montoUsd ?? 0),
      0,
    )

    wsResumen.addRows([
      {
        tipo: 'EGRESOS (FACTURAS)',
        totalLocal: totalFactLocal,
        totalUsd: totalFactUsd,
      },
      {
        tipo: 'INGRESOS (ENTRADAS)',
        totalLocal: totalEntLocal,
        totalUsd: totalEntUsd,
      },
      {
        tipo: 'NETO',
        totalLocal: totalEntLocal - totalFactLocal,
        totalUsd: totalEntUsd - totalFactUsd,
      },
    ])

    wsResumen.getColumn('totalLocal').numFmt = '#,##0.00'
    wsResumen.getColumn('totalUsd').numFmt = '#,##0.00'

    const buf = await wb.xlsx.writeBuffer()
    return Buffer.from(buf)
  }

  async toPdfProyectoMoneda(data: ReporteProyectoMonedaDto): Promise<Buffer> {
    const body = [
      ['Tipo', 'Proyecto', 'Moneda', 'Cantidad', 'Total'],
      ...data.rows.map((r) => [
        r.tipo,
        r.codigoProyecto,
        r.moneda,
        r.cantidad.toString(),
        r.total.toFixed(2),
      ]),
    ]

    const doc: TDocumentDefinitions = {
      content: [
        { text: 'Reporte por Proyecto y Moneda', style: 'header' },
        {
          text: `Proyecto: ${data.codigoProyecto ?? 'TODOS'}   Desde: ${data.desde ?? '-'}   Hasta: ${data.hasta ?? '-'}`,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto'],
            body,
          },
        },
      ],
      styles: {
        header: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
      },
      defaultStyle: { font: 'Helvetica', fontSize: 9 },
      pageSize: 'LETTER',
      pageMargins: [30, 30, 30, 30],
    }

    const printer = new PdfPrinter({
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    })

    // pdfmake/js/printer usa urlResolver internamente aunque no estés usando URLs.
    // En backend, si no vas a usar fonts/imágenes remotas, un stub es suficiente.
    printer.urlResolver = {
      resolve: () => {},
      resolved: async () => {},
    }

    const pdfDoc = await printer.createPdfKitDocument(doc)

    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      pdfDoc.on('data', (chunk: Buffer | Uint8Array) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
      )
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
      pdfDoc.on('error', reject)
      pdfDoc.end()
    })
  }

  private readLogoBase64(): string | null {
    try {
      const logoPath = path.resolve(
        process.cwd(),
        'uploads',
        'logo cepenad.png',
      )
      if (!fs.existsSync(logoPath)) return null
      const bytes = fs.readFileSync(logoPath)
      return `data:image/png;base64,${bytes.toString('base64')}`
    } catch {
      return null
    }
  }

  private groupByProyecto<T extends { codigoProyecto: string }>(rows: T[]) {
    const map = new Map<string, T[]>()
    for (const r of rows) {
      const key = r.codigoProyecto || 'SIN_PROY'
      const arr = map.get(key) ?? []
      arr.push(r)
      map.set(key, arr)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }

  private groupByMoneda<T extends { moneda?: string }>(rows: T[]) {
    const map = new Map<string, T[]>()
    for (const r of rows) {
      const key = (r.moneda || '').trim().toUpperCase() || 'N/A'
      const arr = map.get(key) ?? []
      arr.push(r)
      map.set(key, arr)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }

  private formatMoney(amount: number, moneda?: string) {
    const m = (moneda || '').trim().toUpperCase()

    // Para evitar cargar i18n, dejamos un formato simple y consistente.
    // Puedes ajustar símbolos si lo necesitás.
    const symbol = m === 'USD' ? 'US$' : m === 'NIO' ? 'C$' : ''
    const value = Number(amount ?? 0)
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    return symbol ? `${symbol} ${formatted}` : formatted
  }

  async toPdfDetalleProyecto(data: ReporteProyectoDetalleDto): Promise<Buffer> {
    const logo = this.readLogoBase64()

    const proyectoTitulo = data.codigoProyecto
      ? (data.facturas?.[0] as any)?.proyectoDisplay ||
        (data.entradas?.[0] as any)?.proyectoDisplay ||
        data.codigoProyecto
      : 'TODOS'

    const printer = new PdfPrinter({
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    })
    printer.urlResolver = { resolve: () => {}, resolved: async () => {} }

    const content: any[] = []

    // Header con logo + título
    content.push({
      columns: [
        logo
          ? {
              image: logo,
              width: 70,
              margin: [0, 0, 0, 20],
            }
          : { text: '', width: 70 },
        {
          stack: [
            {
              text: 'Reporte de Facturas y Entradas',
              style: 'title',
              margin: [185, 0, 0, 10],
            },
            {
              text: `Proyecto: ${proyectoTitulo}   Desde: ${data.desde ?? '-'}   Hasta: ${data.hasta ?? '-'}`,
              style: 'subtitle',
              margin: [170, 0, 0, 10],
            },
          ],
          //alignment: 'center',
        },
      ],
    })
    // content.push({
    //   canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1 }],
    // })
    // content.push({ text: '', margin: [0, 6, 0, 0] })

    const renderFacturasGrupo = (
      proyecto: string,
      rows: ReporteProyectoFacturaDetalleDto[],
    ) => {
      const proyectoLabel = (rows[0] as any)?.proyectoDisplay || proyecto
      const body: any[] = [
        [
          { text: 'Proyecto', style: 'th' },
          { text: 'Cuenta', style: 'th' },
          { text: 'Subtipo', style: 'th' },
          { text: 'Número', style: 'th' },
          { text: 'Factura', style: 'th' },
          { text: 'Moneda', style: 'th' },
          { text: 'Local', style: 'th', alignment: 'right' },
          { text: 'USD', style: 'th', alignment: 'right' },
          { text: 'Fecha', style: 'th' },
          { text: 'Ref', style: 'th' },
        ],
        ...rows.map((r) => [
          (r as any).proyectoDisplay ?? r.codigoProyecto,
          r.cuentaBanco,
          r.subtipo ?? '',
          r.numero ?? '',
          r.factura ?? '',
          (r.moneda ?? '').toString(),
          {
            text: this.formatMoney((r as any).totalLocal ?? 0, 'NIO'),
            alignment: 'right',
          },
          {
            text: this.formatMoney((r as any).totalUsd ?? 0, 'USD'),
            alignment: 'right',
          },
          r.fecha,
          r.referencia ?? '',
        ]),
      ]

      const totalesPorMoneda = this.groupByMoneda(rows).map(([moneda, rs]) => ({
        moneda,
        total: rs.reduce((acc, r) => acc + (r.total ?? 0), 0),
      }))

      // Footer: una fila por moneda
      for (const t of totalesPorMoneda) {
        body.push([
          {
            text: `Total ${proyectoLabel} (${t.moneda})`,
            colSpan: 6,
            style: 'tfoot',
          },
          '',
          '',
          '',
          '',
          '',
          {
            text: this.formatMoney(
              rows.reduce((acc, r: any) => acc + Number(r.totalLocal ?? 0), 0),
              'NIO',
            ),
            alignment: 'right',
            style: 'tfoot',
          },
          {
            text: this.formatMoney(
              rows.reduce((acc, r: any) => acc + Number(r.totalUsd ?? 0), 0),
              'USD',
            ),
            alignment: 'right',
            style: 'tfoot',
          },
          { text: '', colSpan: 2 },
          '',
        ])
      }

      return {
        table: {
          headerRows: 1,
          widths: [50, 66, 36, 42, 54, 34, 60, 60, 62, '*'],
          body,
        },
        layout: 'lightHorizontalLines',
      }
    }

    const renderEntradasGrupo = (
      proyecto: string,
      rows: ReporteProyectoEntradaDetalleDto[],
    ) => {
      const proyectoLabel = (rows[0] as any)?.proyectoDisplay || proyecto
      const body: any[] = [
        [
          { text: 'Proyecto', style: 'th' },
          { text: 'Cuenta', style: 'th' },
          { text: 'Tipo', style: 'th' },
          { text: 'Número', style: 'th' },
          { text: 'Descripción', style: 'th' },
          { text: 'Moneda', style: 'th' },
          { text: 'Local', style: 'th', alignment: 'right' },
          { text: 'USD', style: 'th', alignment: 'right' },
          { text: 'Fecha', style: 'th' },
          { text: 'Ref', style: 'th' },
        ],
        ...rows.map((r) => [
          (r as any).proyectoDisplay ?? r.codigoProyecto,
          r.cuentaBanco,
          r.tipo ?? '',
          r.numero ?? '',
          r.descripcion ?? '',
          (r.moneda ?? '').toString(),
          {
            text: this.formatMoney((r as any).montoLocal ?? 0, 'NIO'),
            alignment: 'right',
          },
          {
            text: this.formatMoney((r as any).montoUsd ?? 0, 'USD'),
            alignment: 'right',
          },
          r.fecha,
          r.referencia ?? '',
        ]),
      ]

      const totalesPorMoneda = this.groupByMoneda(rows).map(([moneda, rs]) => ({
        moneda,
        total: rs.reduce((acc, r) => acc + (r.monto ?? 0), 0),
      }))

      // Footer: una fila por moneda
      for (const t of totalesPorMoneda) {
        body.push([
          {
            text: `Total ${proyectoLabel} (${t.moneda})`,
            colSpan: 6,
            style: 'tfoot',
          },
          '',
          '',
          '',
          '',
          '',
          {
            text: this.formatMoney(
              rows.reduce((acc, r: any) => acc + Number(r.montoLocal ?? 0), 0),
              'NIO',
            ),
            alignment: 'right',
            style: 'tfoot',
          },
          {
            text: this.formatMoney(
              rows.reduce((acc, r: any) => acc + Number(r.montoUsd ?? 0), 0),
              'USD',
            ),
            alignment: 'right',
            style: 'tfoot',
          },
          { text: '', colSpan: 2 },
          '',
        ])
      }

      return {
        table: {
          headerRows: 1,
          widths: [50, 66, 34, 42, '*', 34, 60, 60, 62, 60],
          body,
        },
        layout: 'lightHorizontalLines',
      }
    }

    // Agrupar por proyecto combinando FACTURAS + ENTRADAS
    const facturasPorProyecto = new Map(this.groupByProyecto(data.facturas))
    const entradasPorProyecto = new Map(this.groupByProyecto(data.entradas))
    const proyectos = Array.from(
      new Set([
        ...Array.from(facturasPorProyecto.keys()),
        ...Array.from(entradasPorProyecto.keys()),
      ]),
    ).sort((a, b) => a.localeCompare(b))

    for (const proy of proyectos) {
      const rowsFact = facturasPorProyecto.get(proy) ?? []
      const rowsEnt = entradasPorProyecto.get(proy) ?? []

      const proyectoLabel =
        (rowsFact[0] as any)?.proyectoDisplay ||
        (rowsEnt[0] as any)?.proyectoDisplay ||
        proy

      content.push({ text: `PROYECTO: ${proyectoLabel}`, style: 'section' })

      content.push({ text: 'ENTRADAS', style: 'groupTitle' })
      if (rowsEnt.length === 0) {
        content.push({
          text: 'Sin datos',
          italics: true,
          margin: [0, 0, 0, 12],
        })
      } else {
        content.push(renderEntradasGrupo(proy, rowsEnt))
        content.push({ text: '', margin: [0, 0, 0, 12] })
      }

      content.push({ text: 'SALIDAS', style: 'groupTitle' })
      if (rowsFact.length === 0) {
        content.push({ text: 'Sin datos', italics: true, margin: [0, 0, 0, 8] })
      } else {
        content.push(renderFacturasGrupo(proy, rowsFact))
        content.push({ text: '', margin: [0, 0, 0, 8] })
      }
    }

    // Resumen general final
    const totalEgresosLocal = data.facturas.reduce(
      (acc, r: any) => acc + Number(r.totalLocal ?? 0),
      0,
    )
    const totalEgresosUsd = data.facturas.reduce(
      (acc, r: any) => acc + Number(r.totalUsd ?? 0),
      0,
    )
    const totalIngresosLocal = data.entradas.reduce(
      (acc, r: any) => acc + Number(r.montoLocal ?? 0),
      0,
    )
    const totalIngresosUsd = data.entradas.reduce(
      (acc, r: any) => acc + Number(r.montoUsd ?? 0),
      0,
    )

    content.push({ text: 'RESUMEN GENERAL', style: 'section' })
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 90, 90],
        body: [
          [
            { text: 'Concepto', style: 'th' },
            { text: 'Total Local', style: 'th', alignment: 'right' },
            { text: 'Total USD', style: 'th', alignment: 'right' },
          ],
          [
            'EGRESOS (FACTURAS)',
            {
              text: this.formatMoney(totalEgresosLocal, 'NIO'),
              alignment: 'right',
            },
            {
              text: this.formatMoney(totalEgresosUsd, 'USD'),
              alignment: 'right',
            },
          ],
          [
            'INGRESOS (ENTRADAS)',
            {
              text: this.formatMoney(totalIngresosLocal, 'NIO'),
              alignment: 'right',
            },
            {
              text: this.formatMoney(totalIngresosUsd, 'USD'),
              alignment: 'right',
            },
          ],
          [
            { text: 'NETO', bold: true },
            {
              text: this.formatMoney(
                totalIngresosLocal - totalEgresosLocal,
                'NIO',
              ),
              alignment: 'right',
              bold: true,
            },
            {
              text: this.formatMoney(totalIngresosUsd - totalEgresosUsd, 'USD'),
              alignment: 'right',
              bold: true,
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    })

    const docDef: TDocumentDefinitions = {
      content,
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [30, 22, 30, 30],
      defaultStyle: { font: 'Helvetica', fontSize: 8 },
      styles: {
        title: { fontSize: 14, bold: true },
        subtitle: { fontSize: 9, color: '#444' },
        section: {
          fontSize: 11,
          bold: true,
          color: '#0F2A4A',
          margin: [0, 10, 0, 6],
        },
        groupTitle: {
          fontSize: 9,
          bold: true,
          margin: [0, 6, 0, 4],
          color: '#222',
        },
        th: { bold: true, fillColor: '#F2F5F9', color: '#111' },
        tfoot: { bold: true, fillColor: '#FAFAFA' },
      },
    }

    const pdfDoc = await printer.createPdfKitDocument(docDef)

    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      pdfDoc.on('data', (chunk: Buffer | Uint8Array) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
      )
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
      pdfDoc.on('error', reject)
      pdfDoc.end()
    })
  }
}

