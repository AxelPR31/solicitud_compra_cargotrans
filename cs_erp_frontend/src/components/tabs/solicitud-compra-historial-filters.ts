import type { SolicitudOcEstado, SolicitudOcPrioridad } from "@/lib/types";

export const ALL_PRIORIDADES: SolicitudOcPrioridad[] = ["A", "M", "Z"];
export const ALL_ESTADOS: SolicitudOcEstado[] = ["A", "E", "I", "O"];

export interface HistorialFilters {
  solicitudDesde: string;
  solicitudHasta: string;
  departamentoDesde: string;
  departamentoHasta: string;
  fechaSolicitudDesde: string;
  fechaSolicitudHasta: string;
  fechaRequeridaDesde: string;
  fechaRequeridaHasta: string;
  prioridades: SolicitudOcPrioridad[];
  estados: SolicitudOcEstado[];
}

export const defaultHistorialFilters = (): HistorialFilters => ({
  solicitudDesde: "",
  solicitudHasta: "",
  departamentoDesde: "",
  departamentoHasta: "",
  fechaSolicitudDesde: "",
  fechaSolicitudHasta: "",
  fechaRequeridaDesde: "",
  fechaRequeridaHasta: "",
  prioridades: [...ALL_PRIORIDADES],
  estados: [...ALL_ESTADOS],
});

function swapRangePair(desde: string, hasta: string): [string, string] {
  const a = desde.trim();
  const b = hasta.trim();
  if (a && b && a > b) return [b, a];
  return [a, b];
}

/** Alinea rangos Desde/Hasta (como Softland) y recorta espacios en textos. */
export function normalizeHistorialFilters(filters: HistorialFilters): HistorialFilters {
  const [solicitudDesde, solicitudHasta] = swapRangePair(
    filters.solicitudDesde,
    filters.solicitudHasta,
  );
  const [departamentoDesde, departamentoHasta] = swapRangePair(
    filters.departamentoDesde,
    filters.departamentoHasta,
  );
  const [fechaSolicitudDesde, fechaSolicitudHasta] = swapRangePair(
    filters.fechaSolicitudDesde,
    filters.fechaSolicitudHasta,
  );
  const [fechaRequeridaDesde, fechaRequeridaHasta] = swapRangePair(
    filters.fechaRequeridaDesde,
    filters.fechaRequeridaHasta,
  );

  return {
    ...filters,
    solicitudDesde,
    solicitudHasta,
    departamentoDesde,
    departamentoHasta,
    fechaSolicitudDesde,
    fechaSolicitudHasta,
    fechaRequeridaDesde,
    fechaRequeridaHasta,
  };
}

export function validateHistorialFiltersForApply(filters: HistorialFilters): string | null {
  if (filters.prioridades.length === 0) {
    return "Seleccione al menos una prioridad.";
  }
  if (filters.estados.length === 0) {
    return "Seleccione al menos un estado.";
  }
  return null;
}

export function countActiveFilters(filters: HistorialFilters): number {
  const defaults = defaultHistorialFilters();
  let count = 0;
  if (filters.solicitudDesde) count++;
  if (filters.solicitudHasta) count++;
  if (filters.departamentoDesde) count++;
  if (filters.departamentoHasta) count++;
  if (filters.fechaSolicitudDesde) count++;
  if (filters.fechaSolicitudHasta) count++;
  if (filters.fechaRequeridaDesde) count++;
  if (filters.fechaRequeridaHasta) count++;
  if (filters.prioridades.length !== defaults.prioridades.length) count++;
  if (filters.estados.length !== defaults.estados.length) count++;
  return count;
}

export const HISTORIAL_PAGE_SIZE = 25;

export function buildHistorialQueryParams(
  filters: HistorialFilters,
  page = 1,
  pageSize = HISTORIAL_PAGE_SIZE,
): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (filters.solicitudDesde) params.set("solicitudDesde", filters.solicitudDesde);
  if (filters.solicitudHasta) params.set("solicitudHasta", filters.solicitudHasta);
  if (filters.departamentoDesde) params.set("departamentoDesde", filters.departamentoDesde);
  if (filters.departamentoHasta) params.set("departamentoHasta", filters.departamentoHasta);
  if (filters.fechaSolicitudDesde) params.set("fechaSolicitudDesde", filters.fechaSolicitudDesde);
  if (filters.fechaSolicitudHasta) params.set("fechaSolicitudHasta", filters.fechaSolicitudHasta);
  if (filters.fechaRequeridaDesde) params.set("fechaRequeridaDesde", filters.fechaRequeridaDesde);
  if (filters.fechaRequeridaHasta) params.set("fechaRequeridaHasta", filters.fechaRequeridaHasta);
  if (filters.prioridades.length > 0 && filters.prioridades.length < ALL_PRIORIDADES.length) {
    params.set("prioridades", filters.prioridades.join(","));
  }
  if (filters.estados.length > 0 && filters.estados.length < ALL_ESTADOS.length) {
    params.set("estados", filters.estados.join(","));
  }
  return params;
}
