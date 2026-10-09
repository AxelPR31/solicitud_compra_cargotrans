import type { CsWorkflowEstado, SolicitudOcPrioridad } from "@/lib/types";
import { ALL_PRIORIDADES, HISTORIAL_PAGE_SIZE, normalizeHistorialFilters } from "./solicitud-compra-historial-filters";

function swapIdRange(desde: string, hasta: string): [string, string] {
  const a = desde.trim();
  const b = hasta.trim();
  if (a && b && /^\d+$/.test(a) && /^\d+$/.test(b) && Number(a) > Number(b)) {
    return [b, a];
  }
  return [a, b];
}

export const ALL_CS_WORKFLOW_ESTADOS: CsWorkflowEstado[] = ["PLANEADA", "APROBADA", "RECHAZADA"];

export type CsQuickWorkflowFilter = CsWorkflowEstado | "ALL";

export function workflowEstadosToQuickValue(states: CsWorkflowEstado[]): CsQuickWorkflowFilter {
  if (
    states.length === ALL_CS_WORKFLOW_ESTADOS.length &&
    ALL_CS_WORKFLOW_ESTADOS.every(e => states.includes(e))
  ) {
    return "ALL";
  }
  if (states.length === 1) {
    return states[0];
  }
  return "ALL";
}

export function quickValueToWorkflowEstados(value: CsQuickWorkflowFilter): CsWorkflowEstado[] {
  if (value === "ALL") {
    return [...ALL_CS_WORKFLOW_ESTADOS];
  }
  return [value];
}

export interface CsPlaneadasFilters {
  idDesde: string;
  idHasta: string;
  solicitudDesde: string;
  solicitudHasta: string;
  departamentoDesde: string;
  departamentoHasta: string;
  fechaSolicitudDesde: string;
  fechaSolicitudHasta: string;
  fechaRequeridaDesde: string;
  fechaRequeridaHasta: string;
  prioridades: SolicitudOcPrioridad[];
  workflowEstados: CsWorkflowEstado[];
}

export const defaultCsPlaneadasFilters = (): CsPlaneadasFilters => ({
  idDesde: "",
  idHasta: "",
  solicitudDesde: "",
  solicitudHasta: "",
  departamentoDesde: "",
  departamentoHasta: "",
  fechaSolicitudDesde: "",
  fechaSolicitudHasta: "",
  fechaRequeridaDesde: "",
  fechaRequeridaHasta: "",
  prioridades: [...ALL_PRIORIDADES],
  workflowEstados: ["PLANEADA"],
});

export function normalizeCsPlaneadasFilters(filters: CsPlaneadasFilters): CsPlaneadasFilters {
  const ranges = normalizeHistorialFilters({
    solicitudDesde: filters.solicitudDesde,
    solicitudHasta: filters.solicitudHasta,
    departamentoDesde: filters.departamentoDesde,
    departamentoHasta: filters.departamentoHasta,
    fechaSolicitudDesde: filters.fechaSolicitudDesde,
    fechaSolicitudHasta: filters.fechaSolicitudHasta,
    fechaRequeridaDesde: filters.fechaRequeridaDesde,
    fechaRequeridaHasta: filters.fechaRequeridaHasta,
    prioridades: filters.prioridades,
    estados: [],
  });
  const [idDesde, idHasta] = swapIdRange(filters.idDesde, filters.idHasta);

  return {
    ...filters,
    idDesde,
    idHasta,
    solicitudDesde: ranges.solicitudDesde,
    solicitudHasta: ranges.solicitudHasta,
    departamentoDesde: ranges.departamentoDesde,
    departamentoHasta: ranges.departamentoHasta,
    fechaSolicitudDesde: ranges.fechaSolicitudDesde,
    fechaSolicitudHasta: ranges.fechaSolicitudHasta,
    fechaRequeridaDesde: ranges.fechaRequeridaDesde,
    fechaRequeridaHasta: ranges.fechaRequeridaHasta,
  };
}

export function validateCsPlaneadasFiltersForApply(filters: CsPlaneadasFilters): string | null {
  if (filters.prioridades.length === 0) {
    return "Seleccione al menos una prioridad.";
  }
  if (filters.workflowEstados.length === 0) {
    return "Seleccione al menos un estado.";
  }
  return null;
}

export function countActiveCsPlaneadasFilters(filters: CsPlaneadasFilters): number {
  const defaults = defaultCsPlaneadasFilters();
  let count = 0;
  if (filters.idDesde) count++;
  if (filters.idHasta) count++;
  if (filters.solicitudDesde) count++;
  if (filters.solicitudHasta) count++;
  if (filters.departamentoDesde) count++;
  if (filters.departamentoHasta) count++;
  if (filters.fechaSolicitudDesde) count++;
  if (filters.fechaSolicitudHasta) count++;
  if (filters.fechaRequeridaDesde) count++;
  if (filters.fechaRequeridaHasta) count++;
  if (filters.prioridades.length !== defaults.prioridades.length) count++;
  if (filters.workflowEstados.length !== defaults.workflowEstados.length) count++;
  return count;
}

export function buildCsPlaneadasQueryParams(
  filters: CsPlaneadasFilters,
  page = 1,
  pageSize = HISTORIAL_PAGE_SIZE,
): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });

  if (filters.idDesde) params.set("idDesde", filters.idDesde);
  if (filters.idHasta) params.set("idHasta", filters.idHasta);
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

  if (
    filters.workflowEstados.length > 0 &&
    filters.workflowEstados.length < ALL_CS_WORKFLOW_ESTADOS.length
  ) {
    params.set("workflowEstado", filters.workflowEstados.join(","));
  } else if (filters.workflowEstados.length === ALL_CS_WORKFLOW_ESTADOS.length) {
    params.set("workflowEstado", ALL_CS_WORKFLOW_ESTADOS.join(","));
  }

  return params;
}
