import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import {
  CS_REPORT_EMPRESA,
  CS_REPORT_HEADER_BLUE,
  CS_REPORT_MIN_LINE_ROWS,
} from "./solicitud-compra-report-constants";
import type { CS_ReportSolicitudCompraModel } from "./solicitud-compra-report-data";

async function loadPdfMake() {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
  const pdfMake = pdfMakeModule.default;
  const vfs =
    (pdfFontsModule as { default?: { pdfMake?: { vfs: unknown } }; pdfMake?: { vfs: unknown } })
      .default?.pdfMake?.vfs ??
    (pdfFontsModule as { pdfMake?: { vfs: unknown } }).pdfMake?.vfs;
  if (vfs) (pdfMake as { vfs?: Record<string, string> }).vfs = vfs as Record<string, string>;
  return pdfMake;
}

async function loadLogoDataUrl(): Promise<string | undefined> {
  if (typeof document === "undefined") return undefined;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo cargar el logo"));
      image.src = "/cargotrans.ico";
    });
    const width = img.naturalWidth || 64;
    const height = img.naturalHeight || 64;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, width, height);
    const png = canvas.toDataURL("image/png");
    if (!png.startsWith("data:image/png")) return undefined;
    return png;
  } catch {
    return undefined;
  }
}

const headerFill = () => CS_REPORT_HEADER_BLUE;
const headerText = () => "#ffffff";
const border = () => CS_REPORT_HEADER_BLUE;

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

function buildDatosRows(model: CS_ReportSolicitudCompraModel): Content[][] {
  const v = model.vehiculo;
  const rows: { label: string; value: string }[] = [
    { label: "SOLICITADO:", value: model.solicitado },
    { label: "REQUERIDO:", value: model.requerido },
    { label: "FECHA DE SOLICITUD:", value: model.fechaSolicitud },
    { label: "GERENCIA:", value: model.gerencia },
    { label: "PRIORIDAD:", value: model.prioridad },
  ];
  return rows.map((r, index) => [
    { text: r.label, bold: true, fontSize: 8, margin: [2, 2, 2, 2] },
    { text: r.value, fontSize: 8, margin: [2, 2, 2, 2] },
    { text: index === 0 ? v.placa : "", fontSize: 8, margin: [2, 2, 2, 2] },
    { text: index === 0 ? v.chasis : "", fontSize: 8, margin: [2, 2, 2, 2] },
    { text: index === 0 ? v.marca : "", fontSize: 8, margin: [2, 2, 2, 2] },
    { text: index === 0 ? v.modelo : "", fontSize: 8, margin: [2, 2, 2, 2] },
  ]);
}

function buildDocDefinition(model: CS_ReportSolicitudCompraModel, logo?: string): TDocumentDefinitions {
  const lineRows = padLineas(model);
  const itemBody: Content[][] = [
    [
      { text: "ITEMS", style: "tableHeader", alignment: "center" },
      { text: "CODIGO", style: "tableHeader", alignment: "center" },
      { text: "Descripción", style: "tableHeader", alignment: "center" },
      { text: "NUMERO DE PARTE / ESPECIFICACIÓN", style: "tableHeader", alignment: "center" },
      { text: "UM", style: "tableHeader", alignment: "center" },
      { text: "CANTIDAD", style: "tableHeader", alignment: "center" },
      { text: "CENTRO DE COSTO", style: "tableHeader", alignment: "center" },
    ],
    ...lineRows.map(l => [
      { text: l.cantidad ? `${l.item}.00` : "", fontSize: 7, margin: [2, 2, 2, 2] as [number, number, number, number] },
      { text: l.codigo, fontSize: 7, margin: [2, 2, 2, 2] as [number, number, number, number] },
      { text: l.descripcion, fontSize: 7, margin: [2, 2, 2, 2] as [number, number, number, number] },
      { text: l.numeroParte, fontSize: 7, margin: [2, 2, 2, 2] as [number, number, number, number] },
      { text: l.um, fontSize: 7, margin: [2, 2, 2, 2] as [number, number, number, number], alignment: "center" as const },
      { text: l.cantidad, fontSize: 7, margin: [2, 2, 2, 2] as [number, number, number, number], alignment: "right" as const },
      { text: l.centroCosto, fontSize: 7, margin: [2, 2, 2, 2] as [number, number, number, number] },
    ]),
  ] as Content[][];

  const empresaBlock = {
    text: [
      { text: `${CS_REPORT_EMPRESA.nombre}\n`, bold: true, fontSize: 11 },
      { text: `${CS_REPORT_EMPRESA.actividad}\n`, fontSize: 8 },
      { text: `${CS_REPORT_EMPRESA.direccion}\n`, fontSize: 8 },
      { text: `${CS_REPORT_EMPRESA.tels}\n`, fontSize: 8 },
      { text: `${CS_REPORT_EMPRESA.ciudad}\n`, fontSize: 8 },
      { text: `RUC: ${CS_REPORT_EMPRESA.ruc}`, fontSize: 8 },
    ],
    alignment: "center" as const,
    color: headerText(),
    margin: [4, 6, 4, 6] as [number, number, number, number],
  };

  return {
    pageSize: "LETTER",
    pageMargins: [28, 28, 28, 28],
    defaultStyle: { font: "Roboto", fontSize: 9 },
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 7,
        color: headerText(),
        fillColor: headerFill(),
      },
      title: { fontSize: 12, bold: true, alignment: "center" },
      footerBlue: { fontSize: 7, color: headerText(), alignment: "center" },
    },
    content: [
      {
        table: {
          widths: [70, "*"],
          body: [
            [
              logo
                ? { image: logo, width: 58, margin: [4, 8, 4, 4] }
                : { text: "CARGOTRANS", bold: true, fontSize: 10, margin: [4, 12, 4, 4] },
              {
                table: {
                  widths: ["*"],
                  body: [[empresaBlock]],
                },
                layout: {
                  fillColor: () => headerFill(),
                  hLineWidth: () => 0,
                  vLineWidth: () => 0,
                },
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => border(),
          vLineColor: () => border(),
        },
        margin: [0, 0, 0, 0],
      },
      {
        table: {
          widths: ["*", 130],
          body: [
            [
              {
                text: "SOLICITUD DE COMPRAS BIENES / SERVICIOS",
                style: "title",
                margin: [0, 6, 0, 6],
              },
              {
                table: {
                  widths: ["*"],
                  body: [
                    [
                      {
                        text: `No ${model.numeroDocumento}`,
                        bold: true,
                        fontSize: 11,
                        alignment: "center",
                        noWrap: true,
                        margin: [2, 8, 2, 8],
                      },
                    ],
                  ],
                },
                layout: {
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                  hLineColor: () => border(),
                  vLineColor: () => border(),
                },
              },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 4],
      },
      {
        table: {
          widths: [95, "*", 52, 52, 52, 52],
          body: [
            [
              { text: "Datos", style: "tableHeader", alignment: "center" },
              { text: "", style: "tableHeader" },
              { text: "N. PLACA", style: "tableHeader", alignment: "center" },
              { text: "CHASIS", style: "tableHeader", alignment: "center" },
              { text: "MARCA", style: "tableHeader", alignment: "center" },
              { text: "MODELO", style: "tableHeader", alignment: "center" },
            ],
            ...buildDatosRows(model),
          ],
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => border(),
          vLineColor: () => border(),
        },
        margin: [0, 0, 0, 6],
      },
      {
        table: {
          widths: [32, 42, "*", 90, 28, 48, 78],
          body: itemBody,
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => border(),
          vLineColor: () => border(),
        },
        margin: [0, 0, 0, 6],
      },
      {
        text: "OBSERVACIONES",
        bold: true,
        fontSize: 9,
        margin: [0, 0, 0, 2],
      },
      {
        table: {
          widths: ["*"],
          heights: 48,
          body: [[{ text: model.observaciones, fontSize: 8, margin: [4, 4, 4, 4] }]],
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => border(),
          vLineColor: () => border(),
        },
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              {
                text: "ELABORADO",
                bold: true,
                fontSize: 8,
                alignment: "center",
                margin: [0, 28, 0, 4],
              },
              { text: "", margin: [0, 28, 0, 4] },
              {
                text: "AUTORIZADO",
                bold: true,
                fontSize: 8,
                alignment: "center",
                margin: [0, 28, 0, 4],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => border(),
          vLineColor: () => border(),
        },
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: [
                  { text: `${CS_REPORT_EMPRESA.nombre}\n`, bold: true },
                  { text: `RUC : ${CS_REPORT_EMPRESA.ruc}\n` },
                  { text: `${CS_REPORT_EMPRESA.actividad}\n` },
                  { text: `${CS_REPORT_EMPRESA.direccion}\n` },
                  { text: `${CS_REPORT_EMPRESA.tels}\n` },
                  { text: `${CS_REPORT_EMPRESA.ciudad}\n` },
                  { text: CS_REPORT_EMPRESA.email, decoration: "underline" },
                ],
                style: "footerBlue",
                margin: [4, 6, 4, 6],
              },
            ],
          ],
        },
        layout: {
          fillColor: () => headerFill(),
          hLineWidth: () => 0,
          vLineWidth: () => 0,
        },
      },
    ],
  };
}

export async function downloadSolicitudCompraPdf(
  model: CS_ReportSolicitudCompraModel,
  fileName: string,
) {
  const pdfMake = await loadPdfMake();
  const logo = await loadLogoDataUrl();
  const doc = buildDocDefinition(model, logo);
  pdfMake.createPdf(doc).download(fileName);
}

export async function openSolicitudCompraPdfPrint(model: CS_ReportSolicitudCompraModel) {
  const pdfMake = await loadPdfMake();
  const logo = await loadLogoDataUrl();
  const doc = buildDocDefinition(model, logo);
  pdfMake.createPdf(doc).open();
}
