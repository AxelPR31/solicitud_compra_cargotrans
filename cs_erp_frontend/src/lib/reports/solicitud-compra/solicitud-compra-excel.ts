import ExcelJS from "exceljs";
import {
  CS_REPORT_EMPRESA,
  CS_REPORT_HEADER_BLUE,
  CS_REPORT_MIN_LINE_ROWS,
} from "./solicitud-compra-report-constants";
import type { CS_ReportSolicitudCompraModel } from "./solicitud-compra-report-data";

const ARGB = (hex: string) => `FF${hex.replace("#", "").toUpperCase()}`;

const headerFillStyle = (): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: ARGB(CS_REPORT_HEADER_BLUE) },
});

const excelColWidthToPx = (width: number) => Math.max(1, Math.floor(width * 7 + 5));
const excelRowHeightToPx = (heightPt: number) => Math.max(1, Math.floor((heightPt * 96) / 72));

async function loadLogoPngBase64ForCell(
  cellWidthPx: number,
  cellHeightPx: number,
): Promise<string | undefined> {
  if (typeof document === "undefined") return undefined;
  const pad = 4;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo cargar el logo"));
      image.src = "/cargotrans.ico";
    });
    const srcW = img.naturalWidth || 64;
    const srcH = img.naturalHeight || 64;
    const canvas = document.createElement("canvas");
    canvas.width = cellWidthPx;
    canvas.height = cellHeightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = CS_REPORT_HEADER_BLUE;
    ctx.fillRect(0, 0, cellWidthPx, cellHeightPx);
    const innerW = Math.max(1, cellWidthPx - pad * 2);
    const innerH = Math.max(1, cellHeightPx - pad * 2);
    const scale = Math.min(innerW / srcW, innerH / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    ctx.drawImage(
      img,
      pad + (innerW - drawW) / 2,
      pad + (innerH - drawH) / 2,
      drawW,
      drawH,
    );
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    return base64 || undefined;
  } catch {
    return undefined;
  }
}

function padLineas(model: CS_ReportSolicitudCompraModel) {
  const rows = [...model.lineas];
  while (rows.length < CS_REPORT_MIN_LINE_ROWS) {
    rows.push({
      item: rows.length + 1,
      codigo: "",
      descripcion: "",
      numeroParte: "",
      um: "",
      cantidad: "",
      centroCosto: "",
    });
  }
  return rows;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell(cell => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: ARGB(CS_REPORT_HEADER_BLUE) },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

export async function downloadSolicitudCompraExcel(
  model: CS_ReportSolicitudCompraModel,
  fileName: string,
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Solicitud", {
    pageSetup: { orientation: "portrait", fitToPage: true },
  });

  const logoColWidth = 15;
  const logoRowHeightPt = 58;

  ws.columns = [
    { width: logoColWidth },
    { width: 34 },
    { width: 24 },
    { width: 32 },
    { width: 18 },
    { width: 18 },
    { width: 26 },
    { width: 8 },
    { width: 16 },
    { width: 16 },
  ];

  const mergeStyle = (r: number, c1: number, c2: number, value: string, opts?: Partial<ExcelJS.Cell>) => {
    ws.mergeCells(r, c1, r, c2);
    const cell = ws.getCell(r, c1);
    cell.value = value;
    if (opts?.font) cell.font = opts.font;
    if (opts?.alignment) cell.alignment = opts.alignment;
    if (opts?.fill) cell.fill = opts.fill;
  };

  const empresaHeaderText = `${CS_REPORT_EMPRESA.nombre}\n${CS_REPORT_EMPRESA.actividad}\n${CS_REPORT_EMPRESA.direccion}\n${CS_REPORT_EMPRESA.tels}\n${CS_REPORT_EMPRESA.ciudad}\nRUC: ${CS_REPORT_EMPRESA.ruc}`;

  ws.getCell(1, 1).fill = headerFillStyle();
  ws.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" };
  mergeStyle(1, 2, 10, empresaHeaderText, {
    font: { bold: true, size: 10, color: { argb: "FFFFFFFF" } },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    fill: headerFillStyle(),
  });
  ws.getRow(1).height = logoRowHeightPt;

  const logoCellW = excelColWidthToPx(logoColWidth);
  const logoCellH = excelRowHeightToPx(logoRowHeightPt);
  const logoBase64 = await loadLogoPngBase64ForCell(logoCellW, logoCellH);
  if (logoBase64) {
    const imageId = wb.addImage({
      base64: logoBase64,
      extension: "png",
    });
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: logoCellW, height: logoCellH },
    });
  } else {
    ws.getCell(1, 1).value = "CARGOTRANS";
    ws.getCell(1, 1).font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
  }

  ws.mergeCells(2, 1, 2, 7);
  ws.getCell(2, 1).value = "SOLICITUD DE COMPRAS BIENES / SERVICIOS";
  ws.getCell(2, 1).font = { bold: true, size: 12 };
  ws.getCell(2, 1).alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(2, 8, 2, 10);
  ws.getCell(2, 8).value = `No ${model.numeroDocumento}`;
  ws.getCell(2, 8).font = { bold: true, size: 12 };
  ws.getCell(2, 8).alignment = { horizontal: "center", vertical: "middle", wrapText: false, shrinkToFit: true };
  ws.getRow(2).height = 22;

  const datosHeader = 4;
  const headers = ["Datos", "", "N. PLACA", "CHASIS", "MARCA", "MODELO"];
  headers.forEach((h, i) => {
    ws.getCell(datosHeader, i + 1).value = h;
  });
  styleHeaderRow(ws.getRow(datosHeader));

  const datosRows = [
    ["SOLICITADO:", model.solicitado],
    ["REQUERIDO:", model.requerido],
    ["FECHA DE SOLICITUD:", model.fechaSolicitud],
    ["GERENCIA:", model.gerencia],
    ["PRIORIDAD:", model.prioridad],
  ];
  const datosStart = datosHeader + 1;
  ws.mergeCells(datosStart, 3, datosStart + datosRows.length - 1, 3);
  ws.mergeCells(datosStart, 4, datosStart + datosRows.length - 1, 4);
  ws.mergeCells(datosStart, 5, datosStart + datosRows.length - 1, 5);
  ws.mergeCells(datosStart, 6, datosStart + datosRows.length - 1, 6);
  ws.getCell(datosStart, 3).value = model.vehiculo.placa;
  ws.getCell(datosStart, 4).value = model.vehiculo.chasis;
  ws.getCell(datosStart, 5).value = model.vehiculo.marca;
  ws.getCell(datosStart, 6).value = model.vehiculo.modelo;
  for (const col of [3, 4, 5, 6]) {
    ws.getCell(datosStart, col).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    ws.getCell(datosStart, col).font = { size: 9 };
  }

  datosRows.forEach((row, idx) => {
    const r = datosStart + idx;
    ws.getCell(r, 1).value = row[0];
    ws.getCell(r, 1).font = { bold: true, size: 9 };
    ws.getCell(r, 2).value = row[1];
    ws.getCell(r, 2).alignment = { vertical: "middle", wrapText: true };
    for (let c = 1; c <= 6; c++) {
      ws.getCell(r, c).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  });

  const itemsStart = datosHeader + datosRows.length + 2;
  const itemHeaders = [
    "ITEMS",
    "CODIGO",
    "Descripción",
    "NUMERO DE PARTE / ESPECIFICACIÓN",
    "UM",
    "CANTIDAD",
    "CENTRO DE COSTO",
  ];
  itemHeaders.forEach((h, i) => {
    ws.getCell(itemsStart, i + 1).value = h;
  });
  styleHeaderRow(ws.getRow(itemsStart));

  const lineRows = padLineas(model);
  lineRows.forEach((l, idx) => {
    const r = itemsStart + 1 + idx;
    ws.getCell(r, 1).value = l.cantidad ? `${l.item}.00` : "";
    ws.getCell(r, 2).value = l.codigo;
    ws.getCell(r, 3).value = l.descripcion;
    ws.getCell(r, 4).value = l.numeroParte;
    ws.getCell(r, 5).value = l.um;
    ws.getCell(r, 6).value = l.cantidad;
    ws.getCell(r, 7).value = l.centroCosto;
    for (let c = 1; c <= 7; c++) {
      ws.getCell(r, c).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      ws.getCell(r, c).alignment = { vertical: "top", wrapText: true };
      ws.getCell(r, c).font = { size: 9 };
    }
  });

  const obsRow = itemsStart + lineRows.length + 2;
  ws.getCell(obsRow, 1).value = "OBSERVACIONES";
  ws.getCell(obsRow, 1).font = { bold: true };
  ws.mergeCells(obsRow + 1, 1, obsRow + 1, 7);
  ws.getCell(obsRow + 1, 1).value = model.observaciones;
  ws.getRow(obsRow + 1).height = 48;
  ws.getCell(obsRow + 1, 1).alignment = { wrapText: true, vertical: "top" };

  const sigRow = obsRow + 3;
  ws.mergeCells(sigRow, 1, sigRow, 2);
  ws.getCell(sigRow, 1).value = "ELABORADO";
  ws.mergeCells(sigRow, 3, sigRow, 4);
  ws.mergeCells(sigRow, 5, sigRow, 7);
  ws.getCell(sigRow, 5).value = "AUTORIZADO";
  [1, 5].forEach(c => {
    ws.getCell(sigRow, c).font = { bold: true };
    ws.getCell(sigRow, c).alignment = { horizontal: "center", vertical: "bottom" };
  });
  ws.getRow(sigRow).height = 36;

  const footRow = sigRow + 2;
  ws.mergeCells(footRow, 1, footRow, 7);
  ws.getCell(footRow, 1).value = [
    CS_REPORT_EMPRESA.nombre,
    `RUC : ${CS_REPORT_EMPRESA.ruc}`,
    CS_REPORT_EMPRESA.actividad,
    CS_REPORT_EMPRESA.direccion,
    CS_REPORT_EMPRESA.tels,
    CS_REPORT_EMPRESA.ciudad,
    CS_REPORT_EMPRESA.email,
  ].join("\n");
  ws.getCell(footRow, 1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: ARGB(CS_REPORT_HEADER_BLUE) },
  };
  ws.getCell(footRow, 1).font = { color: { argb: "FFFFFFFF" }, size: 8 };
  ws.getCell(footRow, 1).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  ws.getRow(footRow).height = 64;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
