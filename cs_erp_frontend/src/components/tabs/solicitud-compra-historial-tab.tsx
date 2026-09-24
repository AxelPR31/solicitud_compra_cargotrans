"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Loader2,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  FileDown,
  FileSpreadsheet,
  Printer,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SolicitudOc, SolicitudOcLinea, SolicitudOcEstado, SolicitudOcPrioridad } from "@/lib/types";
import { SOLICITUD_OC_ESTADOS, SOLICITUD_OC_PRIORIDADES } from "@/lib/types";
import {
  CS_ENCABEZADO_VEHICULO_HABILITADO,
  CS_LINEAS_CENTRO_COSTO_HABILITADO,
  CS_LINEAS_CUENTA_CONTABLE_HABILITADO,
  type SolicitudCompraTabBaseProps,
} from "./solicitud-compra-shared";
import { exportSolicitudCompraExcel, exportSolicitudCompraPdf } from "@/lib/reports/solicitud-compra";
import {
  buildHistorialQueryParams,
  countActiveFilters,
  defaultHistorialFilters,
  HISTORIAL_PAGE_SIZE,
  type HistorialFilters,
} from "./solicitud-compra-historial-filters";

interface SolicitudCompraHistorialTabProps extends SolicitudCompraTabBaseProps {
  onEdit: (solicitudOc: string) => void;
  refreshKey?: number;
}

type SortKey = "solicitudOc" | "departamento" | "fechaSolicitud" | "fechaRequerida" | "estado";

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

const prioridadLabel = (prioridad: SolicitudOcPrioridad) =>
  SOLICITUD_OC_PRIORIDADES.find(p => p.value === prioridad)?.label ?? prioridad;

const estadoLabel = (estado: SolicitudOcEstado) =>
  SOLICITUD_OC_ESTADOS.find(e => e.value === estado)?.label ?? estado;

const thClass =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 whitespace-nowrap";
const tdClass = "px-4 py-3 text-sm text-slate-700 whitespace-nowrap";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 break-words">{empty ? "—" : value}</dd>
    </div>
  );
};

const estadoBadge = (estado: SolicitudOcEstado) => {
  const label = estadoLabel(estado);
  if (estado === "A") return <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/20">{label}</Badge>;
  if (estado === "E") return <Badge variant="warning">{label}</Badge>;
  if (estado === "I") return <Badge variant="success">{label}</Badge>;
  if (estado === "O") return <Badge variant="outline" className="text-slate-500">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
};

export function SolicitudCompraHistorialTab({
  serverOnline,
  API_BASE_URL,
  user,
  onEdit,
  refreshKey = 0,
}: SolicitudCompraHistorialTabProps) {
  const [history, setHistory] = useState<SolicitudOc[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [draftFilters, setDraftFilters] = useState<HistorialFilters>(defaultHistorialFilters);
  const [appliedFilters, setAppliedFilters] = useState<HistorialFilters>(defaultHistorialFilters);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailCache, setDetailCache] = useState<Record<string, SolicitudOc>>({});
  const [sortKey, setSortKey] = useState<SortKey>("solicitudOc");
  const [sortAsc, setSortAsc] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exportingReport, setExportingReport] = useState<"pdf" | "excel" | "print" | null>(null);

  const fetchHistory = useCallback(async (filters = appliedFilters, pageNum = page) => {
    if (!serverOnline) return;
    setLoadingHistory(true);
    try {
      const params = buildHistorialQueryParams(filters, pageNum);
      const res = await fetch(`${API_BASE_URL}/solicitud-oc?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setHistory(data);
          setTotalRecords(data.length);
        } else {
          setHistory(data.items ?? []);
          setTotalRecords(data.total ?? 0);
        }
      }
    } catch {
      toast.error("No se pudo cargar el historial");
    } finally {
      setLoadingHistory(false);
    }
  }, [serverOnline, API_BASE_URL, appliedFilters, page]);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setDetailId(null);
    setPage(1);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    const defaults = defaultHistorialFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setDetailId(null);
    setPage(1);
  };

  const activeFilterCount = countActiveFilters(appliedFilters);
  const totalPages = Math.max(1, Math.ceil(totalRecords / HISTORIAL_PAGE_SIZE));
  const rangeFrom = totalRecords === 0 ? 0 : (page - 1) * HISTORIAL_PAGE_SIZE + 1;
  const rangeTo = Math.min(page * HISTORIAL_PAGE_SIZE, totalRecords);

  const togglePrioridad = (value: SolicitudOcPrioridad) => {
    setDraftFilters(prev => ({
      ...prev,
      prioridades: prev.prioridades.includes(value)
        ? prev.prioridades.filter(p => p !== value)
        : [...prev.prioridades, value],
    }));
  };

  const toggleEstado = (value: SolicitudOcEstado) => {
    setDraftFilters(prev => ({
      ...prev,
      estados: prev.estados.includes(value)
        ? prev.estados.filter(e => e !== value)
        : [...prev.estados, value],
    }));
  };

  useEffect(() => {
    fetchHistory(appliedFilters, page);
  }, [fetchHistory, refreshKey, page]);

  const fetchDetail = useCallback(async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/solicitud-oc/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      setDetailCache(prev => ({ ...prev, [id]: data }));
      return data;
    }
    return null;
  }, [API_BASE_URL]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    if (!detailCache[id]) {
      setLoadingDetail(true);
      try {
        await fetchDetail(id);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const closeDetail = () => setDetailId(null);

  useEffect(() => {
    if (!detailId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailId]);

  const handleCancel = async () => {
    if (!detailId) return;
    if (!confirm("¿Cancelar esta solicitud?")) return;
    const res = await fetch(`${API_BASE_URL}/solicitud-oc/${encodeURIComponent(detailId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: user?.usuario?.toUpperCase() || "ERPADMIN" }),
    });
    if (res.ok) {
      toast.success("Solicitud cancelada");
      setDetailId(null);
      fetchHistory();
    } else {
      toast.error("No se pudo cancelar");
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(prev => !prev);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedHistory = useMemo(() => {
    const list = [...history];
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "solicitudOc") { av = a.solicitudOc; bv = b.solicitudOc; }
      else if (sortKey === "departamento") { av = a.departamento; bv = b.departamento; }
      else if (sortKey === "fechaSolicitud") { av = a.fechaSolicitud; bv = b.fechaSolicitud; }
      else if (sortKey === "fechaRequerida") { av = a.fechaRequerida; bv = b.fechaRequerida; }
      else if (sortKey === "estado") { av = a.estado; bv = b.estado; }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [history, sortKey, sortAsc]);

  const detailSummary = detailId ? sortedHistory.find(s => s.solicitudOc === detailId) : null;
  const selectedDetail = detailId ? detailCache[detailId] : null;
  const detailData = selectedDetail ?? detailSummary;

  const trimDetailField = (value?: string | null) => {
    const trimmed = value?.trim();
    return trimmed || undefined;
  };

  const handleExportReport = async (kind: "pdf" | "excel" | "print") => {
    if (!detailId || !serverOnline) return;
    setExportingReport(kind);
    try {
      let detail = detailCache[detailId];
      if (!detail?.lineas?.length) {
        detail = await fetchDetail(detailId);
      }
      if (!detail) {
        toast.error("No se pudo cargar la solicitud para el reporte");
        return;
      }
      if (kind === "excel") {
        await exportSolicitudCompraExcel(detail, API_BASE_URL);
        toast.success("Excel generado");
      } else {
        await exportSolicitudCompraPdf(detail, API_BASE_URL, kind === "print" ? "print" : "download");
        toast.success(kind === "print" ? "Abriendo vista de impresión" : "PDF generado");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el reporte");
    } finally {
      setExportingReport(null);
    }
  };
  const canEdit = detailSummary?.estado === "A" && !detailSummary?.autorizadaPor;

  const reportButtons = (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={!!exportingReport || loadingDetail || !selectedDetail}
        onClick={() => handleExportReport("print")}
      >
        {exportingReport === "print" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        Imprimir
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={!!exportingReport || loadingDetail || !selectedDetail}
        onClick={() => handleExportReport("pdf")}
      >
        {exportingReport === "pdf" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        PDF
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={!!exportingReport || loadingDetail || !selectedDetail}
        onClick={() => handleExportReport("excel")}
      >
        {exportingReport === "excel" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Excel
      </Button>
    </div>
  );

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortAsc
      ? <ChevronUp className="inline h-3 w-3" />
      : <ChevronDown className="inline h-3 w-3" />;
  };

  const RangeField = ({
    label,
    desdeKey,
    hastaKey,
    isDate = false,
  }: {
    label: string;
    desdeKey: keyof HistorialFilters;
    hastaKey: keyof HistorialFilters;
    isDate?: boolean;
  }) => (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-slate-700" optional>{label}</Label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400">Desde</span>
          {isDate ? (
            <DateInput
              value={String(draftFilters[desdeKey])}
              onChange={v => setDraftFilters(prev => ({ ...prev, [desdeKey]: v }))}
            />
          ) : (
            <Input
              value={String(draftFilters[desdeKey])}
              onChange={e => setDraftFilters(prev => ({ ...prev, [desdeKey]: e.target.value }))}
              className="h-9 text-sm"
            />
          )}
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400">Hasta</span>
          {isDate ? (
            <DateInput
              value={String(draftFilters[hastaKey])}
              onChange={v => setDraftFilters(prev => ({ ...prev, [hastaKey]: v }))}
            />
          ) : (
            <Input
              value={String(draftFilters[hastaKey])}
              onChange={e => setDraftFilters(prev => ({ ...prev, [hastaKey]: e.target.value }))}
              className="h-9 text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">Solicitudes</CardTitle>
              <p className="mt-1 text-xs text-slate-500 break-words">
                {totalRecords} registro{totalRecords === 1 ? "" : "s"}
                {activeFilterCount > 0 ? ` · ${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} activo${activeFilterCount === 1 ? "" : "s"}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              <Button type="button" variant="outline" size="sm" onClick={() => fetchHistory(appliedFilters, page)} disabled={loadingHistory}>
                <RefreshCw className={cn("h-4 w-4", loadingHistory && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {filtersOpen && (
          <div className="border-b border-border bg-slate-50/60 px-4 py-5 sm:px-6">
            <p className="mb-4 text-sm font-medium text-slate-800">Selección de registros</p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <RangeField label="Solicitud" desdeKey="solicitudDesde" hastaKey="solicitudHasta" />
              <RangeField label="Departamento" desdeKey="departamentoDesde" hastaKey="departamentoHasta" />
              <RangeField label="Fecha solicitud" desdeKey="fechaSolicitudDesde" hastaKey="fechaSolicitudHasta" isDate />
              <RangeField label="Fecha requerida" desdeKey="fechaRequeridaDesde" hastaKey="fechaRequeridaHasta" isDate />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Prioridad</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {SOLICITUD_OC_PRIORIDADES.map(p => (
                    <label key={p.value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={draftFilters.prioridades.includes(p.value)}
                        onChange={() => togglePrioridad(p.value)}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {SOLICITUD_OC_ESTADOS.map(e => (
                    <label key={e.value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={draftFilters.estados.includes(e.value)}
                        onChange={() => toggleEstado(e.value)}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                      />
                      {e.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={applyFilters} disabled={loadingHistory}>
                Aplicar filtros
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={resetFilters} disabled={loadingHistory}>
                Limpiar todo
              </Button>
            </div>
          </div>
        )}
        <CardContent className="p-0">
          {loadingHistory ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="p-8">
              <EmptyState
                message="Sin solicitudes"
                description="No hay solicitudes que coincidan con los filtros seleccionados."
              />
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-border">
                {sortedHistory.map((sol) => (
                  <div key={sol.solicitudOc} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-medium text-slate-900">{sol.solicitudOc}</span>
                      {estadoBadge(sol.estado)}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div>
                        <dt className="text-slate-400">Departamento</dt>
                        <dd className="text-slate-700">{sol.departamento}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Prioridad</dt>
                        <dd className="text-slate-700">{prioridadLabel(sol.prioridad)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Fecha solicitud</dt>
                        <dd className="text-slate-700">{formatDate(sol.fechaSolicitud)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Fecha requerida</dt>
                        <dd className="text-slate-700">{formatDate(sol.fechaRequerida)}</dd>
                      </div>
                    </dl>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full gap-1.5"
                      onClick={() => openDetail(sol.solicitudOc)}
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalle
                    </Button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[960px]">
                  <thead className="border-b border-border bg-slate-50/80">
                    <tr>
                      <th className={cn(thClass, "cursor-pointer hover:text-slate-700")} onClick={() => toggleSort("solicitudOc")}>
                        Solicitud <SortIcon column="solicitudOc" />
                      </th>
                      <th className={cn(thClass, "cursor-pointer hover:text-slate-700")} onClick={() => toggleSort("departamento")}>
                        Departamento <SortIcon column="departamento" />
                      </th>
                      <th className={cn(thClass, "cursor-pointer hover:text-slate-700")} onClick={() => toggleSort("fechaSolicitud")}>
                        Fecha solicitud <SortIcon column="fechaSolicitud" />
                      </th>
                      <th className={cn(thClass, "cursor-pointer hover:text-slate-700")} onClick={() => toggleSort("fechaRequerida")}>
                        Fecha requerida <SortIcon column="fechaRequerida" />
                      </th>
                      <th className={thClass}>Usuario aprobación</th>
                      <th className={thClass}>Prioridad</th>
                      <th className={cn(thClass, "text-right")}>Líneas no asig.</th>
                      <th className={cn(thClass, "cursor-pointer hover:text-slate-700")} onClick={() => toggleSort("estado")}>
                        Estado <SortIcon column="estado" />
                      </th>
                      <th className={thClass}>Usuario cancelación</th>
                      <th className={thClass}>Fecha cancelación</th>
                      <th className={cn(thClass, "text-right")}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedHistory.map((sol) => (
                        <tr
                          key={sol.solicitudOc}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          <td className={cn(tdClass, "font-mono font-medium text-slate-900")}>{sol.solicitudOc}</td>
                          <td className={tdClass}>{sol.departamento}</td>
                          <td className={tdClass}>{formatDate(sol.fechaSolicitud)}</td>
                          <td className={tdClass}>{formatDate(sol.fechaRequerida)}</td>
                          <td className={cn(tdClass, "text-slate-500")}>{sol.autorizadaPor || "—"}</td>
                          <td className={tdClass}>{prioridadLabel(sol.prioridad)}</td>
                          <td className={cn(tdClass, "text-right tabular-nums")}>{sol.lineasNoAsig ?? "—"}</td>
                          <td className={tdClass}>{estadoBadge(sol.estado)}</td>
                          <td className={cn(tdClass, "text-slate-500")}>{sol.usuarioCancela || "—"}</td>
                          <td className={cn(tdClass, "text-slate-500")}>{formatDateTime(sol.fechaHoraCancela) || "—"}</td>
                          <td className={cn(tdClass, "text-right")}>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => openDetail(sol.solicitudOc)}
                            >
                              <Eye className="h-4 w-4" />
                              Detalle
                            </Button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {!loadingHistory && totalRecords > 0 && (
            <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-center text-xs text-slate-500 sm:text-left">
                Mostrando {rangeFrom}–{rangeTo} de {totalRecords}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || loadingHistory}
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
                  disabled={page >= totalPages || loadingHistory}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {detailId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Cerrar detalle"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            onClick={closeDetail}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="solicitud-detail-title"
            className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-white shadow-elevated sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-slate-50/80 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-light">Detalle de solicitud</p>
                <h2 id="solicitud-detail-title" className="mt-1 font-mono text-lg font-semibold text-brand sm:text-xl">
                  {detailId}
                </h2>
                {detailData && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {estadoBadge(detailData.estado)}
                    <span className="text-xs text-slate-500">
                      {prioridadLabel(detailData.prioridad)}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-800"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {loadingDetail && !selectedDetail ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-brand" />
                </div>
              ) : detailData ? (
                <div className="space-y-6">
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">Información general</h3>
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailItem label="Departamento" value={detailData.departamento} />
                      <DetailItem label="Fecha solicitud" value={formatDate(detailData.fechaSolicitud)} />
                      <DetailItem label="Fecha requerida" value={formatDate(detailData.fechaRequerida)} />
                      <DetailItem label="Usuario" value={detailData.usuario} />
                      <DetailItem label="Registrado" value={formatDateTime(detailData.fechaHora)} />
                      <DetailItem label="Líneas no asignadas" value={detailData.lineasNoAsig} />
                      <DetailItem label="Aprobado por" value={detailData.autorizadaPor} />
                      <DetailItem label="Fecha aprobación" value={formatDateTime(detailData.fechaAutorizada)} />
                      <DetailItem label="Cancelado por" value={detailData.usuarioCancela} />
                      <DetailItem label="Fecha cancelación" value={formatDateTime(detailData.fechaHoraCancela)} />
                      {CS_ENCABEZADO_VEHICULO_HABILITADO && (
                        <>
                          <DetailItem label="N. Placa" value={trimDetailField(detailData.placa)} />
                          <DetailItem label="Chasis" value={trimDetailField(detailData.chasis)} />
                          <DetailItem label="Marca" value={trimDetailField(detailData.marca)} />
                          <DetailItem label="Modelo" value={trimDetailField(detailData.modelo)} />
                        </>
                      )}
                    </dl>
                    {detailData.comentario && (
                      <div className="mt-4 rounded-lg border border-border bg-slate-50/60 p-3">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Comentario</p>
                        <p className="mt-1 text-sm text-slate-700 break-words">{detailData.comentario}</p>
                      </div>
                    )}
                  </section>

                  {(detailData.rubro1 || detailData.rubro2 || detailData.rubro3 || detailData.rubro4 || detailData.rubro5) && (
                    <section>
                      <h3 className="mb-3 text-sm font-semibold text-slate-800">Rubros</h3>
                      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem label="Rubro 1" value={detailData.rubro1} />
                        <DetailItem label="Rubro 2" value={detailData.rubro2} />
                        <DetailItem label="Rubro 3" value={detailData.rubro3} />
                        <DetailItem label="Rubro 4" value={detailData.rubro4} />
                        <DetailItem label="Rubro 5" value={detailData.rubro5} />
                      </dl>
                    </section>
                  )}

                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">Líneas</h3>
                    {!selectedDetail?.lineas?.length ? (
                      <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-slate-500">
                        {loadingDetail ? "Cargando líneas…" : "Sin líneas"}
                      </p>
                    ) : (
                      <>
                        <div className="space-y-3 md:hidden">
                          {selectedDetail.lineas.map((l: SolicitudOcLinea) => (
                            <div key={l.solicitudOcLinea} className="rounded-lg border border-border bg-slate-50/50 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium text-slate-400">Línea {l.solicitudOcLinea}</span>
                                <span className="text-sm font-medium tabular-nums">Cant: {l.cantidad}</span>
                              </div>
                              <p className="mt-1 font-mono text-sm text-slate-900">{l.articulo}</p>
                              <p className="text-sm text-slate-700">{l.descripcion}</p>
                              {l.especificacion && (
                                <p className="mt-1 text-xs text-slate-500">Espec.: {l.especificacion}</p>
                              )}
                              {CS_LINEAS_CENTRO_COSTO_HABILITADO && l.centroCosto && (
                                <p className="mt-1 text-xs text-slate-500">CC: {l.centroCosto}</p>
                              )}
                              {l.comentario && <p className="mt-1 text-xs text-slate-500">{l.comentario}</p>}
                            </div>
                          ))}
                        </div>
                        <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                          <table
                            className={cn(
                              "w-full",
                              CS_LINEAS_CENTRO_COSTO_HABILITADO || CS_LINEAS_CUENTA_CONTABLE_HABILITADO
                                ? "min-w-[720px]"
                                : "min-w-[560px]",
                            )}
                          >
                            <thead className="border-b border-border bg-slate-50/80">
                              <tr>
                                <th className={thClass}>#</th>
                                <th className={thClass}>Artículo</th>
                                <th className={thClass}>Descripción</th>
                                <th className={cn(thClass, "text-right")}>Cantidad</th>
                                <th className={cn(thClass, "text-right")}>Saldo</th>
                                {CS_LINEAS_CENTRO_COSTO_HABILITADO && <th className={thClass}>Centro costo</th>}
                                {CS_LINEAS_CUENTA_CONTABLE_HABILITADO && <th className={thClass}>Cuenta contable</th>}
                                <th className={thClass}>Especificación</th>
                                <th className={thClass}>Comentario</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {selectedDetail.lineas.map((l: SolicitudOcLinea) => (
                                <tr key={l.solicitudOcLinea}>
                                  <td className={tdClass}>{l.solicitudOcLinea}</td>
                                  <td className={cn(tdClass, "font-mono text-slate-900")}>{l.articulo}</td>
                                  <td className={tdClass}>{l.descripcion}</td>
                                  <td className={cn(tdClass, "text-right tabular-nums")}>{l.cantidad}</td>
                                  <td className={cn(tdClass, "text-right tabular-nums")}>{l.saldo}</td>
                                  {CS_LINEAS_CENTRO_COSTO_HABILITADO && (
                                    <td className={tdClass}>{l.centroCosto || "—"}</td>
                                  )}
                                  {CS_LINEAS_CUENTA_CONTABLE_HABILITADO && (
                                    <td className={tdClass}>{l.cuentaContable || "—"}</td>
                                  )}
                                  <td className={cn(tdClass, "text-slate-500")}>{l.especificacion || "—"}</td>
                                  <td className={cn(tdClass, "text-slate-500")}>{l.comentario || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </section>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">No se pudo cargar el detalle.</p>
              )}
            </div>

            <div className="shrink-0 space-y-3 border-t border-border bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Reportes</p>
                {reportButtons}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={!canEdit}
                  onClick={() => {
                    closeDetail();
                    onEdit(detailId);
                  }}
                >
                  Editar solicitud
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={!canEdit}
                  onClick={handleCancel}
                >
                  Cancelar solicitud
                </Button>
                <Button type="button" size="sm" variant="outline" className="w-full sm:ml-auto sm:w-auto" onClick={closeDetail}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
