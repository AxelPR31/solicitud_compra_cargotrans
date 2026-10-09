"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  RefreshCw,
  Eye,
  X,
  Check,
  Ban,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { NativeSelect } from "@/components/ui/native-select";
import { SelectorRelacionalComboBox } from "@/components/ui/selector-relacional-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CsSolicitudOc, CsWorkflowEstado, Departamento, SolicitudOcPrioridad } from "@/lib/types";
import { CS_WORKFLOW_ESTADOS, SOLICITUD_OC_PRIORIDADES } from "@/lib/types";
import {
  buildCsPlaneadasQueryParams,
  countActiveCsPlaneadasFilters,
  defaultCsPlaneadasFilters,
  normalizeCsPlaneadasFilters,
  quickValueToWorkflowEstados,
  validateCsPlaneadasFiltersForApply,
  workflowEstadosToQuickValue,
  type CsPlaneadasFilters,
  type CsQuickWorkflowFilter,
} from "./solicitud-compra-historial-cs-filters";
import { HISTORIAL_PAGE_SIZE } from "./solicitud-compra-historial-filters";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const workflowLabel = (estado: CsWorkflowEstado) =>
  CS_WORKFLOW_ESTADOS.find(e => e.value === estado)?.label ?? estado;

const workflowBadge = (estado: CsWorkflowEstado) => {
  if (estado === "PLANEADA") {
    return <Badge variant="warning">{workflowLabel(estado)}</Badge>;
  }
  if (estado === "APROBADA") {
    return <Badge variant="success">{workflowLabel(estado)}</Badge>;
  }
  return <Badge variant="outline" className="text-slate-500">{workflowLabel(estado)}</Badge>;
};

const prioridadLabel = (prioridad: string) =>
  SOLICITUD_OC_PRIORIDADES.find(p => p.value === prioridad)?.label ?? prioridad;

type Props = {
  serverOnline: boolean;
  API_BASE_URL: string;
  refreshKey?: number;
  onEdit: (csId: number) => void;
};

type PendingWorkflowAction =
  | { kind: "aprobar"; id: number }
  | { kind: "rechazar"; id: number };

type WorkflowBusy = { kind: "aprobar" | "rechazar"; id: number };

export function SolicitudCompraHistorialCsPanel({
  serverOnline,
  API_BASE_URL,
  refreshKey = 0,
  onEdit,
}: Props) {
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [items, setItems] = useState<CsSolicitudOc[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<CsPlaneadasFilters>(() => defaultCsPlaneadasFilters());
  const [appliedFilters, setAppliedFilters] = useState<CsPlaneadasFilters>(() => defaultCsPlaneadasFilters());
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [solicitudCatalog, setSolicitudCatalog] = useState<CsSolicitudOc[]>([]);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CsSolicitudOc | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [workflowBusy, setWorkflowBusy] = useState<WorkflowBusy | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingWorkflowAction | null>(null);
  const [rechazoMotivo, setRechazoMotivo] = useState("");

  useEffect(() => {
    if (!serverOnline) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/departamento?activo=S&limit=500`);
        if (res.ok) {
          const data = await res.json();
          setDepartamentos(Array.isArray(data) ? data : []);
        }
      } catch {
        /* catálogo departamentos */
      }
    })();
  }, [serverOnline, API_BASE_URL]);

  useEffect(() => {
    if (!serverOnline) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/cs-solicitud-oc?limit=100&offset=0&workflowEstado=PLANEADA,APROBADA,RECHAZADA`,
        );
        if (res.ok) {
          const data = await res.json();
          setSolicitudCatalog(data.items ?? []);
        }
      } catch {
        /* catálogo solicitudes */
      }
    })();
  }, [serverOnline, API_BASE_URL]);

  const solicitudFilterDescription = (item: CsSolicitudOc) => {
    const parts = [item.departamento, item.comentario?.trim()].filter(Boolean);
    return parts.join(" · ") || "—";
  };

  const fetchCsFilterOptions = useCallback(
    async (search: string) => {
      const params = new URLSearchParams({
        limit: "50",
        offset: "0",
        workflowEstado: "PLANEADA,APROBADA,RECHAZADA",
      });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`${API_BASE_URL}/cs-solicitud-oc?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items ?? []) as CsSolicitudOc[];
    },
    [API_BASE_URL],
  );

  const softlandCatalog = useMemo(
    () => solicitudCatalog.filter(item => item.solicitudOcSoftland?.trim()),
    [solicitudCatalog],
  );

  const fetchList = useCallback(async () => {
    if (!serverOnline) return;
    setLoading(true);
    try {
      const params = buildCsPlaneadasQueryParams(appliedFilters, page);
      const res = await fetch(`${API_BASE_URL}/cs-solicitud-oc?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setTotalRecords(data.total ?? 0);
      }
    } catch {
      toast.error("No se pudo cargar solicitudes planeadas");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, serverOnline, appliedFilters, page]);

  const activeFilterCount = countActiveCsPlaneadasFilters(appliedFilters);
  const totalPages = Math.max(1, Math.ceil(totalRecords / HISTORIAL_PAGE_SIZE));
  const rangeFrom = totalRecords === 0 ? 0 : (page - 1) * HISTORIAL_PAGE_SIZE + 1;
  const rangeTo = Math.min(page * HISTORIAL_PAGE_SIZE, totalRecords);

  const applyFilters = () => {
    const validationError = validateCsPlaneadasFiltersForApply(draftFilters);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const normalized = normalizeCsPlaneadasFilters(draftFilters);
    setDraftFilters(normalized);
    setAppliedFilters(normalized);
    setPage(1);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    const defaults = defaultCsPlaneadasFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setPage(1);
  };

  const togglePrioridad = (value: SolicitudOcPrioridad) => {
    setDraftFilters(prev => ({
      ...prev,
      prioridades: prev.prioridades.includes(value)
        ? prev.prioridades.length > 1
          ? prev.prioridades.filter(p => p !== value)
          : prev.prioridades
        : [...prev.prioridades, value],
    }));
  };

  const toggleWorkflowEstado = (value: CsWorkflowEstado) => {
    setDraftFilters(prev => ({
      ...prev,
      workflowEstados: prev.workflowEstados.includes(value)
        ? prev.workflowEstados.length > 1
          ? prev.workflowEstados.filter(e => e !== value)
          : prev.workflowEstados
        : [...prev.workflowEstados, value],
    }));
  };

  const quickWorkflowValue = workflowEstadosToQuickValue(appliedFilters.workflowEstados);

  const applyQuickWorkflowFilter = (value: CsQuickWorkflowFilter) => {
    const workflowEstados = quickValueToWorkflowEstados(value);
    setAppliedFilters(prev => ({ ...prev, workflowEstados }));
    setDraftFilters(prev => ({ ...prev, workflowEstados }));
    setPage(1);
  };

  useEffect(() => {
    fetchList();
  }, [fetchList, refreshKey]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalRecords / HISTORIAL_PAGE_SIZE));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [totalRecords, page]);

  const openDetail = async (id: number) => {
    setDetailId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cs-solicitud-oc/${id}`);
      if (res.ok) setDetail(await res.json());
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  const closePendingAction = () => {
    setPendingAction(null);
    setRechazoMotivo("");
  };

  const openAprobarConfirm = (id: number) => {
    setPendingAction({ kind: "aprobar", id });
  };

  const openRechazarConfirm = (id: number) => {
    setRechazoMotivo("");
    setPendingAction({ kind: "rechazar", id });
  };

  const runAprobar = async (id: number) => {
    setWorkflowBusy({ id, kind: "aprobar" });
    try {
      const res = await fetch(`${API_BASE_URL}/cs-solicitud-oc/${id}/aprobar`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Aprobada en Softland: ${data.solicitudOc}`);
        if (detailId === id) closeDetail();
        fetchList();
      } else {
        toast.error("No se pudo aprobar");
      }
    } finally {
      setWorkflowBusy(null);
    }
  };

  const runRechazar = async (id: number, motivo: string) => {
    setWorkflowBusy({ id, kind: "rechazar" });
    try {
      const res = await fetch(`${API_BASE_URL}/cs-solicitud-oc/${id}/rechazar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      });
      if (res.ok) {
        toast.success("Solicitud rechazada");
        if (detailId === id) closeDetail();
        fetchList();
      } else {
        toast.error("No se pudo rechazar");
      }
    } finally {
      setWorkflowBusy(null);
    }
  };

  const isWorkflowBusy = (id: number) => workflowBusy?.id === id;

  const submitPendingAction = async () => {
    if (!pendingAction) return;
    const { id } = pendingAction;
    if (pendingAction.kind === "aprobar") {
      closePendingAction();
      await runAprobar(id);
    } else {
      const motivo = rechazoMotivo.trim();
      closePendingAction();
      await runRechazar(id, motivo);
    }
  };

  const canEdit = detail?.workflowEstado === "PLANEADA";

  const departamentoComboProps = {
    options: departamentos,
    displayKey: "descripcion" as const,
    valueKey: "departamento" as const,
    formatOptionParts: (item: Departamento) => ({
      code: item.departamento,
      description: item.descripcion,
    }),
    placeholder: "Buscar código o descripción...",
  };

  const refComboProps = {
    options: solicitudCatalog,
    displayKey: "id" as const,
    valueKey: "id" as const,
    formatOptionParts: (item: CsSolicitudOc) => ({
      code: String(item.id),
      description: solicitudFilterDescription(item),
    }),
    placeholder: "Buscar por número de ref....",
    onSearch: fetchCsFilterOptions,
  };

  const softlandComboProps = {
    options: softlandCatalog,
    displayKey: "solicitudOcSoftland" as const,
    valueKey: "solicitudOcSoftland" as const,
    formatOptionParts: (item: CsSolicitudOc) => ({
      code: item.solicitudOcSoftland?.trim() ?? "",
      description: solicitudFilterDescription(item),
    }),
    placeholder: "Buscar consecutivo Softland...",
    onSearch: async (search: string) => {
      const items = await fetchCsFilterOptions(search);
      return items.filter(item => item.solicitudOcSoftland?.trim());
    },
  };

  const RangeField = ({
    label,
    desdeKey,
    hastaKey,
    isDate = false,
    isDepartamento = false,
    isRef = false,
    isSoftland = false,
  }: {
    label: string;
    desdeKey: keyof CsPlaneadasFilters;
    hastaKey: keyof CsPlaneadasFilters;
    isDate?: boolean;
    isDepartamento?: boolean;
    isRef?: boolean;
    isSoftland?: boolean;
  }) => (
    <div className="space-y-2.5">
      <Label className="text-xs font-medium text-slate-700" optional>{label}</Label>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <div className="min-w-0 space-y-1">
          <span className="text-[11px] text-slate-400">Desde</span>
          {isRef ? (
            <SelectorRelacionalComboBox
              label=""
              value={draftFilters.idDesde}
              {...refComboProps}
              preferCodeInTrigger
              onChange={val =>
                setDraftFilters(prev => ({ ...prev, idDesde: String(val) }))
              }
            />
          ) : isSoftland ? (
            <SelectorRelacionalComboBox
              label=""
              value={draftFilters.solicitudDesde}
              {...softlandComboProps}
              preferCodeInTrigger
              onChange={val =>
                setDraftFilters(prev => ({ ...prev, solicitudDesde: String(val) }))
              }
            />
          ) : isDepartamento ? (
            <SelectorRelacionalComboBox
              label=""
              value={draftFilters.departamentoDesde}
              {...departamentoComboProps}
              preferCodeInTrigger
              onChange={val =>
                setDraftFilters(prev => ({ ...prev, departamentoDesde: String(val) }))
              }
            />
          ) : isDate ? (
            <DateInput
              value={String(draftFilters[desdeKey])}
              onChange={v => setDraftFilters(prev => ({ ...prev, [desdeKey]: v }))}
            />
          ) : null}
        </div>
        <div className="min-w-0 space-y-1">
          <span className="text-[11px] text-slate-400">Hasta</span>
          {isRef ? (
            <SelectorRelacionalComboBox
              label=""
              value={draftFilters.idHasta}
              {...refComboProps}
              preferCodeInTrigger
              onChange={val =>
                setDraftFilters(prev => ({ ...prev, idHasta: String(val) }))
              }
            />
          ) : isSoftland ? (
            <SelectorRelacionalComboBox
              label=""
              value={draftFilters.solicitudHasta}
              {...softlandComboProps}
              preferCodeInTrigger
              onChange={val =>
                setDraftFilters(prev => ({ ...prev, solicitudHasta: String(val) }))
              }
            />
          ) : isDepartamento ? (
            <SelectorRelacionalComboBox
              label=""
              value={draftFilters.departamentoHasta}
              {...departamentoComboProps}
              preferCodeInTrigger
              onChange={val =>
                setDraftFilters(prev => ({ ...prev, departamentoHasta: String(val) }))
              }
            />
          ) : isDate ? (
            <DateInput
              value={String(draftFilters[hastaKey])}
              onChange={v => setDraftFilters(prev => ({ ...prev, [hastaKey]: v }))}
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderRowActions = (row: CsSolicitudOc, layout: "card" | "table") => {
    const isPlaneada = row.workflowEstado === "PLANEADA";
    const rowLoading = isWorkflowBusy(row.id);
    const fullWidth = layout === "card";

    return (
      <div
        className={cn(
          fullWidth ? "flex flex-col gap-2" : "flex flex-wrap justify-end gap-1.5",
        )}
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("gap-1", fullWidth && "w-full gap-1.5")}
          onClick={() => openDetail(row.id)}
        >
          <Eye className="h-4 w-4 shrink-0" />
          {fullWidth ? "Ver detalle" : "Ver"}
        </Button>
        {isPlaneada && (
          <div
            className={cn(
              fullWidth ? "grid grid-cols-2 gap-2" : "contents",
            )}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={cn(
                "gap-1 text-red-700 border-red-200 hover:bg-red-50",
                fullWidth && "w-full",
              )}
              disabled={rowLoading}
              onClick={() => openRechazarConfirm(row.id)}
            >
              {rowLoading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 shrink-0" />
              )}
              Rechazar
            </Button>
            <Button
              type="button"
              size="sm"
              className={cn("gap-1", fullWidth && "w-full")}
              disabled={rowLoading}
              onClick={() => openAprobarConfirm(row.id)}
            >
              {rowLoading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Check className="h-4 w-4 shrink-0" />
              )}
              Aprobar
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">Solicitudes planeadas</CardTitle>
              <p className="mt-1 text-xs text-slate-500 break-words">
                {totalRecords} registro{totalRecords === 1 ? "" : "s"}
                {activeFilterCount > 0
                  ? ` · ${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} activo${activeFilterCount === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
                <span className="text-[11px] font-medium text-slate-500 sm:sr-only">Estado</span>
                <div className="relative w-full min-w-0 sm:w-auto">
                  <NativeSelect
                    className="h-9 w-full min-w-[10.5rem] pr-9 text-sm shadow-none sm:w-auto"
                    value={quickWorkflowValue}
                    onChange={e =>
                      applyQuickWorkflowFilter(e.target.value as CsQuickWorkflowFilter)
                    }
                    aria-label="Filtrar por estado"
                  >
                    <option value="PLANEADA">Planeada</option>
                    <option value="APROBADA">Aprobada</option>
                    <option value="RECHAZADA">Rechazada</option>
                    <option value="ALL">Todas</option>
                  </NativeSelect>
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
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
            <p className="mb-4 text-sm font-medium text-slate-800">Selección de registros</p>

            <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Rangos
              </p>
              <div className="grid gap-6 lg:grid-cols-2">
                <RangeField
                  label="Ref."
                  desdeKey="idDesde"
                  hastaKey="idHasta"
                  isRef
                />
                <RangeField
                  label="Softland"
                  desdeKey="solicitudDesde"
                  hastaKey="solicitudHasta"
                  isSoftland
                />
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <RangeField
                  label="Departamento"
                  desdeKey="departamentoDesde"
                  hastaKey="departamentoHasta"
                  isDepartamento
                />
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <RangeField
                  label="Fecha solicitud"
                  desdeKey="fechaSolicitudDesde"
                  hastaKey="fechaSolicitudHasta"
                  isDate
                />
                <RangeField
                  label="Fecha requerida"
                  desdeKey="fechaRequeridaDesde"
                  hastaKey="fechaRequeridaHasta"
                  isDate
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
                  {CS_WORKFLOW_ESTADOS.map(e => (
                    <label key={e.value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={draftFilters.workflowEstados.includes(e.value)}
                        onChange={() => toggleWorkflowEstado(e.value)}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                      />
                      {e.label}
                    </label>
                  ))}
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
              <EmptyState message="Sin solicitudes" description="No hay registros en esta bandeja." />
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-border">
                {items.map(row => (
                  <div key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-medium text-slate-900">#{row.id}</span>
                      {workflowBadge(row.workflowEstado)}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div>
                        <dt className="text-slate-400">Departamento</dt>
                        <dd className="text-slate-700 break-words">{row.departamento}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">F. solicitud</dt>
                        <dd className="text-slate-700">{formatDate(row.fechaSolicitud)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-slate-400">Softland</dt>
                        <dd className="font-mono text-slate-700">{row.solicitudOcSoftland ?? "—"}</dd>
                      </div>
                    </dl>
                    <div className="mt-3">{renderRowActions(row, "card")}</div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead className="border-b border-border bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 whitespace-nowrap">Ref.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 whitespace-nowrap">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 whitespace-nowrap">Depto.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 whitespace-nowrap">F. solicitud</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 whitespace-nowrap">Softland</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500 whitespace-nowrap">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">{row.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{workflowBadge(row.workflowEstado)}</td>
                        <td className="px-4 py-3 text-sm">{row.departamento}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row.fechaSolicitud)}</td>
                        <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">{row.solicitudOcSoftland ?? "—"}</td>
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
        {workflowBusy && (
          <motion.div
            key="workflow-busy"
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
                <span
                  className="absolute inset-0 animate-ping rounded-full bg-brand/15"
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-1 animate-pulse rounded-full bg-brand/10"
                  aria-hidden="true"
                />
                <Loader2 className="relative h-9 w-9 animate-spin text-brand" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-900">
                {workflowBusy.kind === "aprobar"
                  ? "Aprobando y enviando a Softland"
                  : "Rechazando solicitud"}
              </p>
              <p className="mt-1.5 text-xs text-slate-500">
                Solicitud #{workflowBusy.id} — por favor espere…
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {pendingAction && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={closePendingAction}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="workflow-action-title"
            className="w-full max-w-md rounded-t-2xl border border-border bg-white shadow-xl sm:rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b px-4 py-4 sm:px-6">
              <h2 id="workflow-action-title" className="text-base font-semibold text-slate-900">
                {pendingAction.kind === "aprobar" ? "Aprobar solicitud" : "Rechazar solicitud"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {pendingAction.kind === "aprobar"
                  ? `¿Enviar la solicitud #${pendingAction.id} a Softland? Quedará registrada en el ERP.`
                  : `La solicitud #${pendingAction.id} no se enviará a Softland.`}
              </p>
            </div>
            <div className="px-4 py-4 sm:px-6">
              {pendingAction.kind === "rechazar" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700" optional>
                    Motivo de rechazo
                  </Label>
                  <Input
                    value={rechazoMotivo}
                    onChange={e => setRechazoMotivo(e.target.value)}
                    placeholder="Opcional"
                    className="h-9 text-sm"
                    autoFocus
                  />
                </div>
              )}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={isWorkflowBusy(pendingAction.id)}
                  onClick={closePendingAction}
                >
                  Cancelar
                </Button>
                {pendingAction.kind === "aprobar" ? (
                  <Button
                    type="button"
                    className="w-full gap-1 sm:w-auto"
                    disabled={isWorkflowBusy(pendingAction.id)}
                    onClick={submitPendingAction}
                  >
                    <Check className="h-4 w-4 shrink-0" />
                    Aprobar y enviar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-1 border-red-200 text-red-700 hover:bg-red-50 sm:w-auto"
                    disabled={isWorkflowBusy(pendingAction.id)}
                    onClick={submitPendingAction}
                  >
                    <Ban className="h-4 w-4 shrink-0" />
                    Confirmar rechazo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {detailId !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[min(92vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-white shadow-xl sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
              <h2 className="min-w-0 truncate font-semibold text-slate-900">Solicitud #{detailId}</h2>
              <Button type="button" variant="ghost" size="sm" onClick={closeDetail}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4 sm:px-6">
              {loadingDetail || !detail ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 items-center">
                    {workflowBadge(detail.workflowEstado)}
                    <span className="text-sm text-slate-600">Prioridad: {prioridadLabel(detail.prioridad)}</span>
                  </div>
                  <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div><dt className="text-slate-400 text-xs">Departamento</dt><dd>{detail.departamento}</dd></div>
                    <div><dt className="text-slate-400 text-xs">Solicitante</dt><dd>{detail.usuarioSolicita ?? "—"}</dd></div>
                    <div><dt className="text-slate-400 text-xs">Fecha solicitud</dt><dd>{formatDate(detail.fechaSolicitud)}</dd></div>
                    <div><dt className="text-slate-400 text-xs">Fecha requerida</dt><dd>{formatDate(detail.fechaRequerida)}</dd></div>
                    {detail.solicitudOcSoftland && (
                      <div><dt className="text-slate-400 text-xs">Softland</dt><dd className="font-mono">{detail.solicitudOcSoftland}</dd></div>
                    )}
                    {detail.motivoRechazo && (
                      <div className="sm:col-span-2"><dt className="text-slate-400 text-xs">Motivo rechazo</dt><dd>{detail.motivoRechazo}</dd></div>
                    )}
                  </dl>
                  {detail.comentario && (
                    <p className="text-sm text-slate-700 rounded-lg bg-slate-50 p-3">{detail.comentario}</p>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Líneas</h3>
                    <ul className="text-sm space-y-2">
                      {(detail.lineas ?? []).map(l => (
                        <li key={l.linea} className="border rounded-md p-2">
                          <span className="font-mono">{l.articulo}</span> — {l.descripcion} × {l.cantidad}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
            {detail && (
              <div className="shrink-0 border-t bg-white p-4 sm:px-6">
                {canEdit ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => onEdit(detail.id)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-1 text-red-700 sm:w-auto"
                      disabled={isWorkflowBusy(detail.id)}
                      onClick={() => openRechazarConfirm(detail.id)}
                    >
                      <Ban className="h-4 w-4 shrink-0" />
                      Rechazar
                    </Button>
                    <Button
                      type="button"
                      className="w-full gap-1 sm:w-auto"
                      disabled={isWorkflowBusy(detail.id)}
                      onClick={() => openAprobarConfirm(detail.id)}
                    >
                      <Check className="h-4 w-4 shrink-0" />
                      Aprobar
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={closeDetail}>
                      Cerrar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
