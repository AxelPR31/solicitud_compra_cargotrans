"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  RefreshCw,
  Eye,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { OrdenCompra, OrdenCompraEstado } from "@/lib/types";
import { ORDEN_COMPRA_ESTADOS } from "@/lib/types";
import {
  ORDEN_COMPRA_PAGE_SIZE,
  buildOrdenCompraQueryParams,
  countActiveOrdenCompraFilters,
  defaultOrdenCompraFilters,
  estadosToQuickValue,
  normalizeOrdenCompraFilters,
  quickValueToEstados,
  type OrdenCompraFilters,
  type OrdenCompraQuickEstado,
} from "./orden-compra-filters";
import { useCanAprobarOrdenCompraQuery } from "@/lib/permisos/use-permisos";

const fetch = (input: RequestInfo | URL, init?: RequestInit) =>
  globalThis.fetch(input, { ...init, credentials: "include" });

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (value?: number | string | null, decimals = 2) => {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("es-CR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const estadoLabel = (estado: OrdenCompraEstado) =>
  ORDEN_COMPRA_ESTADOS.find(e => e.value === estado)?.label ?? estado;

const estadoBadge = (estado: OrdenCompraEstado) => {
  if (estado === "A") return <Badge variant="warning">{estadoLabel(estado)}</Badge>;
  if (estado === "E" || estado === "R") return <Badge variant="success">{estadoLabel(estado)}</Badge>;
  return <Badge variant="outline" className="text-slate-500">{estadoLabel(estado)}</Badge>;
};

const parseApiError = (errText: string): string => {
  try {
    const parsed = JSON.parse(errText);
    const msg = parsed?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.join(", ");
    return errText;
  } catch {
    return errText;
  }
};

const proveedorText = (row: OrdenCompra) =>
  row.proveedorNombre?.trim() ? `${row.proveedor.trim()} - ${row.proveedorNombre.trim()}` : row.proveedor;

type Props = {
  serverOnline: boolean;
  API_BASE_URL: string;
};

export function OrdenCompraTab({ serverOnline, API_BASE_URL }: Props) {
  const { canAprobarOrdenCompra } = useCanAprobarOrdenCompraQuery();
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [items, setItems] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<OrdenCompraFilters>(() => defaultOrdenCompraFilters());
  const [appliedFilters, setAppliedFilters] = useState<OrdenCompraFilters>(() => defaultOrdenCompraFilters());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrdenCompra | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [pendingAprobar, setPendingAprobar] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!serverOnline) return;
    setLoading(true);
    try {
      const params = buildOrdenCompraQueryParams(appliedFilters, page);
      const res = await fetch(`${API_BASE_URL}/orden-compra?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setTotalRecords(data.total ?? 0);
      } else {
        toast.error("No se pudieron cargar las órdenes de compra");
      }
    } catch {
      toast.error("No se pudieron cargar las órdenes de compra");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, serverOnline, appliedFilters, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / ORDEN_COMPRA_PAGE_SIZE));
  const rangeFrom = totalRecords === 0 ? 0 : (page - 1) * ORDEN_COMPRA_PAGE_SIZE + 1;
  const rangeTo = Math.min(page * ORDEN_COMPRA_PAGE_SIZE, totalRecords);
  const activeFilterCount = countActiveOrdenCompraFilters(appliedFilters);
  const quickEstado = estadosToQuickValue(appliedFilters.estados);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const applyFilters = () => {
    const normalized = normalizeOrdenCompraFilters(draftFilters);
    setDraftFilters(normalized);
    setAppliedFilters(normalized);
    setPage(1);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    const defaults = defaultOrdenCompraFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setPage(1);
  };

  const applyQuickEstado = (value: OrdenCompraQuickEstado) => {
    const estados = quickValueToEstados(value);
    setAppliedFilters(prev => ({ ...prev, estados }));
    setDraftFilters(prev => ({ ...prev, estados }));
    setPage(1);
  };

  const openDetail = async (ordenCompra: string) => {
    setDetailId(ordenCompra);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orden-compra/${encodeURIComponent(ordenCompra)}`);
      if (res.ok) setDetail(await res.json());
      else toast.error("No se pudo cargar la orden de compra");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  const runAprobar = async (ordenCompra: string) => {
    setBusyId(ordenCompra);
    try {
      const res = await fetch(
        `${API_BASE_URL}/orden-compra/${encodeURIComponent(ordenCompra)}/aprobar`,
        { method: "POST" },
      );
      if (res.ok) {
        toast.success(`Orden ${ordenCompra.trim()} aprobada`);
        if (detailId === ordenCompra) closeDetail();
        fetchList();
      } else {
        const errText = await res.text();
        toast.error(parseApiError(errText) || "No se pudo aprobar la orden de compra");
      }
    } catch {
      toast.error("Error de red al aprobar");
    } finally {
      setBusyId(null);
    }
  };

  const confirmAprobar = async () => {
    if (!pendingAprobar) return;
    const id = pendingAprobar;
    setPendingAprobar(null);
    await runAprobar(id);
  };

  const renderRowActions = (row: OrdenCompra, layout: "card" | "table") => {
    const fullWidth = layout === "card";
    const rowBusy = busyId === row.ordenCompra;
    return (
      <div className={cn(fullWidth ? "grid grid-cols-2 gap-2" : "flex flex-wrap justify-end gap-1.5")}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "gap-1",
            fullWidth && "w-full",
            fullWidth && (row.estado !== "A" || !canAprobarOrdenCompra) && "col-span-2",
          )}
          onClick={() => openDetail(row.ordenCompra)}
        >
          <Eye className="h-4 w-4 shrink-0" />
          {fullWidth ? "Ver detalle" : "Ver"}
        </Button>
        {row.estado === "A" && canAprobarOrdenCompra && (
          <Button
            type="button"
            size="sm"
            className={cn("gap-1", fullWidth && "w-full")}
            disabled={rowBusy}
            onClick={() => setPendingAprobar(row.ordenCompra)}
          >
            {rowBusy ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Check className="h-4 w-4 shrink-0" />
            )}
            Aprobar
          </Button>
        )}
      </div>
    );
  };

  const thClass = "px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 whitespace-nowrap";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">Órdenes de compra</CardTitle>
              <p className="mt-1 text-xs text-slate-500 break-words">
                {totalRecords} registro{totalRecords === 1 ? "" : "s"}
                {activeFilterCount > 0
                  ? ` · ${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} activo${activeFilterCount === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <div className="relative w-full min-w-0 sm:w-auto">
                <NativeSelect
                  className="h-9 w-full min-w-[10.5rem] pr-9 text-sm shadow-none sm:w-auto"
                  value={quickEstado}
                  onChange={e => applyQuickEstado(e.target.value as OrdenCompraQuickEstado)}
                  aria-label="Filtrar por estado"
                >
                  {ORDEN_COMPRA_ESTADOS.map(e => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                  <option value="ALL">Todas</option>
                </NativeSelect>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant={filtersOpen ? "default" : "outline"}
                onClick={() => setFiltersOpen(prev => !prev)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                    {activeFilterCount}
                  </span>
                )}
                {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={fetchList} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {filtersOpen && (
          <div className="border-b border-border bg-slate-50/60 px-4 py-5 sm:px-6">
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
              <div className="space-y-2.5">
                <Label className="text-xs font-medium text-slate-700" optional>Buscar</Label>
                <Input
                  value={draftFilters.q}
                  onChange={e => setDraftFilters(prev => ({ ...prev, q: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyFilters();
                    }
                  }}
                  placeholder="Orden, proveedor o departamento"
                  className="h-9 text-sm"
                />
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-2.5">
                  <Label className="text-xs font-medium text-slate-700" optional>Orden de compra</Label>
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    <div className="min-w-0 space-y-1">
                      <span className="text-[11px] text-slate-400">Desde</span>
                      <Input
                        value={draftFilters.ordenDesde}
                        onChange={e => setDraftFilters(prev => ({ ...prev, ordenDesde: e.target.value }))}
                        className="h-9 font-mono text-sm"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <span className="text-[11px] text-slate-400">Hasta</span>
                      <Input
                        value={draftFilters.ordenHasta}
                        onChange={e => setDraftFilters(prev => ({ ...prev, ordenHasta: e.target.value }))}
                        className="h-9 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-xs font-medium text-slate-700" optional>Fecha</Label>
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    <div className="min-w-0 space-y-1">
                      <span className="text-[11px] text-slate-400">Desde</span>
                      <DateInput
                        value={draftFilters.fechaDesde}
                        onChange={v => setDraftFilters(prev => ({ ...prev, fechaDesde: v }))}
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <span className="text-[11px] text-slate-400">Hasta</span>
                      <DateInput
                        value={draftFilters.fechaHasta}
                        onChange={v => setDraftFilters(prev => ({ ...prev, fechaHasta: v }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-border/80 pt-4 sm:flex-row sm:flex-wrap">
              <Button type="button" size="sm" className="w-full sm:w-auto" onClick={applyFilters} disabled={loading}>
                Aplicar filtros
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={resetFilters}
                disabled={loading}
              >
                Limpiar todo
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-8">
              <EmptyState message="Sin órdenes de compra" description="No hay registros con los filtros actuales." />
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-border">
                {items.map(row => (
                  <div key={row.ordenCompra} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-medium text-slate-900">{row.ordenCompra}</span>
                      {estadoBadge(row.estado)}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div className="col-span-2">
                        <dt className="text-slate-400">Proveedor</dt>
                        <dd className="text-slate-700 break-words">{proveedorText(row)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Fecha</dt>
                        <dd className="text-slate-700">{formatDate(row.fecha)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">F. requerida</dt>
                        <dd className="text-slate-700">{formatDate(row.fechaRequerida)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-slate-400">Total a comprar</dt>
                        <dd className="font-medium text-slate-900">
                          {row.moneda} {formatNumber(row.totalAComprar)}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-3">{renderRowActions(row, "card")}</div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="border-b border-border bg-slate-50/80">
                    <tr>
                      <th className={thClass}>Orden</th>
                      <th className={thClass}>Proveedor</th>
                      <th className={thClass}>Fecha</th>
                      <th className={thClass}>F. requerida</th>
                      <th className={thClass}>Moneda</th>
                      <th className={cn(thClass, "text-right")}>Total a comprar</th>
                      <th className={thClass}>Estado</th>
                      <th className={cn(thClass, "text-right")}>Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map(row => (
                      <tr key={row.ordenCompra} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">{row.ordenCompra}</td>
                        <td className="px-4 py-3 text-sm">{proveedorText(row)}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row.fecha)}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row.fechaRequerida)}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{row.moneda}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                          {formatNumber(row.totalAComprar)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{estadoBadge(row.estado)}</td>
                        <td className="px-4 py-3">{renderRowActions(row, "table")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {!loading && totalRecords > 0 && (
            <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-center text-xs text-slate-500 sm:text-left">
                Mostrando {rangeFrom}–{rangeTo} de {totalRecords}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="min-w-[100px] text-center text-xs text-slate-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {busyId && (
          <motion.div
            key="oc-busy"
            role="status"
            aria-live="polite"
            aria-busy="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 4 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-white px-6 py-8 text-center shadow-elevated"
            >
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand/15" aria-hidden="true" />
                <span className="absolute inset-1 animate-pulse rounded-full bg-brand/10" aria-hidden="true" />
                <Loader2 className="relative h-9 w-9 animate-spin text-brand" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-900">Aprobando orden de compra</p>
              <p className="mt-1.5 text-xs text-slate-500">{busyId.trim()} — por favor espere…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {pendingAprobar && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setPendingAprobar(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="oc-aprobar-title"
            className="w-full max-w-md rounded-t-2xl border border-border bg-white shadow-xl sm:rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b px-4 py-4 sm:px-6">
              <h2 id="oc-aprobar-title" className="text-base font-semibold text-slate-900">
                Aprobar orden de compra
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                La orden {pendingAprobar.trim()} pasará a Tránsito y se actualizarán las cantidades en
                tránsito de bodega y los datos de última compra de los artículos.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setPendingAprobar(null)}
              >
                Cancelar
              </Button>
              <Button type="button" className="w-full gap-1 sm:w-auto" onClick={confirmAprobar}>
                <Check className="h-4 w-4 shrink-0" />
                Aprobar
              </Button>
            </div>
          </div>
        </div>
      )}

      {detailId !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-white shadow-xl sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
              <h2 className="min-w-0 truncate font-semibold text-slate-900">
                Orden de compra {detailId.trim()}
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={closeDetail}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:px-6">
              {loadingDetail || !detail ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">{estadoBadge(detail.estado)}</div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2"><dt className="text-xs text-slate-400">Proveedor</dt><dd>{proveedorText(detail)}</dd></div>
                    <div><dt className="text-xs text-slate-400">Bodega</dt><dd>{detail.bodega}</dd></div>
                    <div><dt className="text-xs text-slate-400">Fecha</dt><dd>{formatDate(detail.fecha)}</dd></div>
                    <div><dt className="text-xs text-slate-400">Fecha requerida</dt><dd>{formatDate(detail.fechaRequerida)}</dd></div>
                    <div><dt className="text-xs text-slate-400">Departamento</dt><dd>{detail.departamento ?? "—"}</dd></div>
                    <div><dt className="text-xs text-slate-400">Condición de pago</dt><dd>{detail.condicionPago}</dd></div>
                    <div><dt className="text-xs text-slate-400">Moneda</dt><dd>{detail.moneda}</dd></div>
                    <div><dt className="text-xs text-slate-400">Usuario</dt><dd>{detail.usuario ?? "—"}</dd></div>
                    {detail.usuarioConfirma && (
                      <div><dt className="text-xs text-slate-400">Aprobada por</dt><dd>{detail.usuarioConfirma}</dd></div>
                    )}
                    {detail.fechaHoraConfir && (
                      <div><dt className="text-xs text-slate-400">Fecha aprobación</dt><dd>{formatDateTime(detail.fechaHoraConfir)}</dd></div>
                    )}
                  </dl>

                  <div className="grid gap-3 rounded-lg border border-border bg-slate-50/60 p-3 text-sm sm:grid-cols-3">
                    <div><p className="text-xs text-slate-400">Mercadería</p><p className="font-medium">{formatNumber(detail.totalMercaderia)}</p></div>
                    <div><p className="text-xs text-slate-400">Impuesto</p><p className="font-medium">{formatNumber(detail.totalImpuesto1)}</p></div>
                    <div><p className="text-xs text-slate-400">Total a comprar</p><p className="font-semibold text-slate-900">{detail.moneda} {formatNumber(detail.totalAComprar)}</p></div>
                  </div>

                  {(detail.instrucciones?.trim() || detail.observaciones?.trim()) && (
                    <div className="space-y-2 text-sm">
                      {detail.instrucciones?.trim() && (
                        <p className="rounded-lg bg-slate-50 p-3 text-slate-700">{detail.instrucciones}</p>
                      )}
                      {detail.observaciones?.trim() && (
                        <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">{detail.observaciones}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Líneas</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead className="border-b border-border bg-slate-50/80">
                          <tr>
                            <th className={thClass}>#</th>
                            <th className={thClass}>Artículo</th>
                            <th className={thClass}>Bodega</th>
                            <th className={cn(thClass, "text-right")}>Cantidad</th>
                            <th className={cn(thClass, "text-right")}>Precio</th>
                            <th className={cn(thClass, "text-right")}>Impuesto</th>
                            <th className={thClass}>Centro costo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(detail.lineas ?? []).map(l => (
                            <tr key={l.ordenCompraLinea}>
                              <td className="px-4 py-2 text-slate-500">{l.ordenCompraLinea}</td>
                              <td className="px-4 py-2">
                                <span className="font-mono">{l.articulo}</span>
                                {l.descripcion && <span className="block text-xs text-slate-500">{l.descripcion}</span>}
                              </td>
                              <td className="px-4 py-2">{l.bodega}</td>
                              <td className="px-4 py-2 text-right">{formatNumber(l.cantidadOrdenada)}</td>
                              <td className="px-4 py-2 text-right">{formatNumber(l.precioUnitario)}</td>
                              <td className="px-4 py-2 text-right">{formatNumber(l.impuesto1)}</td>
                              <td className="px-4 py-2">{l.centroCosto ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
            {detail && (
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-white p-4 sm:flex-row sm:justify-end sm:px-6">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={closeDetail}>
                  Cerrar
                </Button>
                {detail.estado === "A" && canAprobarOrdenCompra && (
                  <Button
                    type="button"
                    className="w-full gap-1 sm:w-auto"
                    disabled={busyId === detail.ordenCompra}
                    onClick={() => setPendingAprobar(detail.ordenCompra)}
                  >
                    <Check className="h-4 w-4 shrink-0" />
                    Aprobar
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
