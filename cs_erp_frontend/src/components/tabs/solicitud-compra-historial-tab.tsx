"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Loader2, ChevronUp, ChevronDown, SlidersHorizontal } from "lucide-react";
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
import type { SolicitudCompraTabBaseProps } from "./solicitud-compra-shared";
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

const estadoBadge = (estado: SolicitudOcEstado) => {
  const label = estadoLabel(estado);
  if (estado === "A") return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">{label}</Badge>;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, SolicitudOc>>({});
  const [sortKey, setSortKey] = useState<SortKey>("solicitudOc");
  const [sortAsc, setSortAsc] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    setSelectedId(null);
    setPage(1);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    const defaults = defaultHistorialFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setSelectedId(null);
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

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    if (!detailCache[id]) await fetchDetail(id);
  };

  const handleCancel = async () => {
    if (!selectedId) return;
    if (!confirm("¿Cancelar esta solicitud?")) return;
    const res = await fetch(`${API_BASE_URL}/solicitud-oc/${encodeURIComponent(selectedId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: user?.usuario?.toUpperCase() || "ERPADMIN" }),
    });
    if (res.ok) {
      toast.success("Solicitud cancelada");
      setSelectedId(null);
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

  const selected = sortedHistory.find(s => s.solicitudOc === selectedId);
  const selectedDetail = selectedId ? detailCache[selectedId] : null;
  const canEdit = selected?.estado === "A" && !selected?.autorizadaPor;

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
      <Label className="text-xs font-medium text-slate-700">{label}</Label>
      <div className="grid grid-cols-2 gap-3">
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
        <CardHeader className="border-b border-border bg-white py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Solicitudes</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                {totalRecords} registro{totalRecords === 1 ? "" : "s"}
                {selectedId ? ` · seleccionada: ${selectedId}` : ""}
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
              <Button type="button" size="sm" disabled={!canEdit} onClick={() => selectedId && onEdit(selectedId)}>
                Editar
              </Button>
              <Button type="button" size="sm" variant="destructive" disabled={!canEdit} onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        </CardHeader>

        {filtersOpen && (
          <div className="border-b border-border bg-slate-50/60 px-6 py-5">
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
                title="Sin solicitudes"
                description="No hay solicitudes que coincidan con los filtros seleccionados."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedHistory.map((sol) => {
                    const isSelected = selectedId === sol.solicitudOc;
                    return (
                      <tr
                        key={sol.solicitudOc}
                        onClick={() => handleSelect(sol.solicitudOc)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isSelected
                            ? "bg-brand/5 ring-1 ring-inset ring-brand/20"
                            : "hover:bg-slate-50"
                        )}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loadingHistory && totalRecords > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
              <p className="text-xs text-slate-500">
                Mostrando {rangeFrom}–{rangeTo} de {totalRecords}
              </p>
              <div className="flex items-center gap-2">
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

      {selectedId && selectedDetail && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-slate-50/50 py-4">
            <CardTitle className="text-base">Líneas de {selectedId}</CardTitle>
            {selectedDetail.comentario && (
              <p className="text-sm text-slate-500">{selectedDetail.comentario}</p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-border bg-slate-50/80">
                  <tr>
                    <th className={thClass}>#</th>
                    <th className={thClass}>Artículo</th>
                    <th className={thClass}>Descripción</th>
                    <th className={cn(thClass, "text-right")}>Cantidad</th>
                    <th className={thClass}>Centro costo</th>
                    <th className={thClass}>Cuenta contable</th>
                    <th className={thClass}>Comentario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(selectedDetail.lineas || []).map((l: SolicitudOcLinea) => (
                    <tr key={l.solicitudOcLinea} className="hover:bg-slate-50 transition-colors">
                      <td className={tdClass}>{l.solicitudOcLinea}</td>
                      <td className={cn(tdClass, "font-mono text-slate-900")}>{l.articulo}</td>
                      <td className={tdClass}>{l.descripcion}</td>
                      <td className={cn(tdClass, "text-right tabular-nums")}>{l.cantidad}</td>
                      <td className={tdClass}>{l.centroCosto || "—"}</td>
                      <td className={tdClass}>{l.cuentaContable || "—"}</td>
                      <td className={cn(tdClass, "text-slate-500")}>{l.comentario || "—"}</td>
                    </tr>
                  ))}
                  {(selectedDetail.lineas || []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Sin líneas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
