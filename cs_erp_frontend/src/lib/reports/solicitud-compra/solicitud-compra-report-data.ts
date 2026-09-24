import type { Articulo, Departamento, SolicitudOc, SolicitudOcPrioridad } from "@/lib/types";
import { SOLICITUD_OC_PRIORIDADES } from "@/lib/types";

export interface CS_ReportLineaSolicitud {
  item: number;
  codigo: string;
  descripcion: string;
  numeroParte: string;
  um: string;
  cantidad: string;
  centroCosto: string;
}

export interface CS_ReportVehiculoPlaceholder {
  placa: string;
  chasis: string;
  marca: string;
  modelo: string;
}

export interface CS_ReportSolicitudCompraModel {
  numeroDocumento: string;
  solicitado: string;
  requerido: string;
  fechaSolicitud: string;
  gerencia: string;
  prioridad: string;
  vehiculo: CS_ReportVehiculoPlaceholder;
  lineas: CS_ReportLineaSolicitud[];
  observaciones: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const prioridadLabel = (prioridad: SolicitudOcPrioridad) =>
  SOLICITUD_OC_PRIORIDADES.find(p => p.value === prioridad)?.label?.toUpperCase() ?? prioridad;

export const csFormatNumeroReporte = (solicitudOc: string) => {
  const digits = solicitudOc.replace(/\D/g, "");
  return digits || solicitudOc;
};

const formatCantidad = (value: number) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n.toFixed(2);
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function buildCSReportSolicitudCompraModel(
  detail: SolicitudOc,
  API_BASE_URL: string,
  departamentosCache?: Departamento[],
): Promise<CS_ReportSolicitudCompraModel> {
  let gerencia = detail.departamento;
  const fromCache = departamentosCache?.find(d => d.departamento === detail.departamento);
  if (fromCache?.descripcion) {
    gerencia = fromCache.descripcion;
  } else {
    const dep = await fetchJson<Departamento>(
      `${API_BASE_URL}/departamento/${encodeURIComponent(detail.departamento)}`,
    );
    if (dep?.descripcion) gerencia = dep.descripcion;
  }

  const centroDesc = new Map<string, string>();
  const articuloUm = new Map<string, string>();

  const lineasRaw = [...(detail.lineas || [])].sort(
    (a, b) => a.solicitudOcLinea - b.solicitudOcLinea,
  );

  await Promise.all(
    lineasRaw.map(async linea => {
      if (linea.centroCosto && !centroDesc.has(linea.centroCosto)) {
        const cc = await fetchJson<{ centrocosto: string; descripcion?: string }>(
          `${API_BASE_URL}/centrocosto/${encodeURIComponent(linea.centroCosto.trim())}`,
        );
        const label = cc?.descripcion?.trim()
          ? `${cc.centrocosto?.trim()} - ${cc.descripcion.trim()}`
          : linea.centroCosto.trim();
        centroDesc.set(linea.centroCosto, label);
      }
      if (linea.articulo && !articuloUm.has(linea.articulo)) {
        const art = await fetchJson<Articulo>(
          `${API_BASE_URL}/articulo/${encodeURIComponent(linea.articulo.trim())}`,
        );
        articuloUm.set(linea.articulo, art?.unidadAlmacen?.trim() || art?.unidadVenta?.trim() || "");
      }
    }),
  );

  const lineas: CS_ReportLineaSolicitud[] = lineasRaw.map((linea, idx) => {
    const centroKey = linea.centroCosto?.trim() || "";
    const centroLabel = centroKey ? centroDesc.get(linea.centroCosto!) || centroKey : "";
    return {
      item: idx + 1,
      codigo: linea.articulo,
      descripcion: linea.descripcion || "",
      numeroParte: linea.especificacion?.trim() || "",
      um: articuloUm.get(linea.articulo) || "",
      cantidad: formatCantidad(linea.cantidad),
      centroCosto: centroLabel,
    };
  });

  const usuarioCode = detail.usuario?.trim() || "";
  let solicitado = usuarioCode;
  if (usuarioCode) {
    const usuarioSoftland = await fetchJson<{ usuario: string; nombre?: string }>(
      `${API_BASE_URL}/usuario-softland/${encodeURIComponent(usuarioCode)}`,
    );
    if (usuarioSoftland?.nombre?.trim()) solicitado = usuarioSoftland.nombre.trim();
  }

  return {
    numeroDocumento: csFormatNumeroReporte(detail.solicitudOc),
    solicitado,
    requerido: detail.rubro1?.trim() || "",
    fechaSolicitud: formatDate(detail.fechaSolicitud),
    gerencia,
    prioridad: prioridadLabel(detail.prioridad),
    vehiculo: {
      placa: detail.placa?.trim() || "",
      chasis: detail.chasis?.trim() || "",
      marca: detail.marca?.trim() || "",
      modelo: detail.modelo?.trim() || "",
    },
    lineas,
    observaciones: detail.comentario?.trim() || "",
  };
}
