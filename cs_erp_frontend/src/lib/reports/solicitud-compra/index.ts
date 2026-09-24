import type { SolicitudOc } from "@/lib/types";
import { buildCSReportSolicitudCompraModel } from "./solicitud-compra-report-data";
import { downloadSolicitudCompraExcel } from "./solicitud-compra-excel";
import { downloadSolicitudCompraPdf, openSolicitudCompraPdfPrint } from "./solicitud-compra-pdf";

export function csReportFileBaseName(solicitudOc: string) {
  const safe = solicitudOc.replace(/[^\w-]+/g, "_");
  return `Solicitud_Compra_${safe}`;
}

export async function exportSolicitudCompraPdf(
  detail: SolicitudOc,
  API_BASE_URL: string,
  mode: "download" | "print" = "download",
) {
  const model = await buildCSReportSolicitudCompraModel(detail, API_BASE_URL);
  const fileName = `${csReportFileBaseName(detail.solicitudOc)}.pdf`;
  if (mode === "print") {
    await openSolicitudCompraPdfPrint(model);
  } else {
    await downloadSolicitudCompraPdf(model, fileName);
  }
}

export async function exportSolicitudCompraExcel(detail: SolicitudOc, API_BASE_URL: string) {
  const model = await buildCSReportSolicitudCompraModel(detail, API_BASE_URL);
  const fileName = `${csReportFileBaseName(detail.solicitudOc)}.xlsx`;
  await downloadSolicitudCompraExcel(model, fileName);
}
