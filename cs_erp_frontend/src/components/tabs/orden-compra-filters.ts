import type { OrdenCompraEstado } from "@/lib/types";
import { ORDEN_COMPRA_ESTADOS } from "@/lib/types";

export const ORDEN_COMPRA_PAGE_SIZE = 25;

export const ALL_ORDEN_COMPRA_ESTADOS: OrdenCompraEstado[] = ORDEN_COMPRA_ESTADOS.map(e => e.value);

export type OrdenCompraQuickEstado = OrdenCompraEstado | "ALL";

export interface OrdenCompraFilters {
  q: string;
  ordenDesde: string;
  ordenHasta: string;
  fechaDesde: string;
  fechaHasta: string;
  estados: OrdenCompraEstado[];
}

export const defaultOrdenCompraFilters = (): OrdenCompraFilters => ({
  q: "",
  ordenDesde: "",
  ordenHasta: "",
  fechaDesde: "",
  fechaHasta: "",
  estados: ["A"],
});

function swapRange(desde: string, hasta: string): [string, string] {
  const a = desde.trim();
  const b = hasta.trim();
  if (a && b && a > b) return [b, a];
  return [a, b];
}

export function normalizeOrdenCompraFilters(filters: OrdenCompraFilters): OrdenCompraFilters {
  const [ordenDesde, ordenHasta] = swapRange(filters.ordenDesde, filters.ordenHasta);
  const [fechaDesde, fechaHasta] = swapRange(filters.fechaDesde, filters.fechaHasta);
  return { ...filters, q: filters.q.trim(), ordenDesde, ordenHasta, fechaDesde, fechaHasta };
}

export function estadosToQuickValue(estados: OrdenCompraEstado[]): OrdenCompraQuickEstado {
  if (estados.length === 1) return estados[0];
  return "ALL";
}

export function quickValueToEstados(value: OrdenCompraQuickEstado): OrdenCompraEstado[] {
  return value === "ALL" ? [...ALL_ORDEN_COMPRA_ESTADOS] : [value];
}

export function countActiveOrdenCompraFilters(filters: OrdenCompraFilters): number {
  let count = 0;
  if (filters.q) count++;
  if (filters.ordenDesde) count++;
  if (filters.ordenHasta) count++;
  if (filters.fechaDesde) count++;
  if (filters.fechaHasta) count++;
  return count;
}

export function buildOrdenCompraQueryParams(
  filters: OrdenCompraFilters,
  page = 1,
  pageSize = ORDEN_COMPRA_PAGE_SIZE,
): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
    estados: (filters.estados.length ? filters.estados : ALL_ORDEN_COMPRA_ESTADOS).join(","),
  });
  if (filters.q) params.set("q", filters.q);
  if (filters.ordenDesde) params.set("ordenDesde", filters.ordenDesde);
  if (filters.ordenHasta) params.set("ordenHasta", filters.ordenHasta);
  if (filters.fechaDesde) params.set("fechaDesde", filters.fechaDesde);
  if (filters.fechaHasta) params.set("fechaHasta", filters.fechaHasta);
  return params;
}
