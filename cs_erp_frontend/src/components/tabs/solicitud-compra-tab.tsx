"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  FileText,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SelectorRelacionalComboBox } from "@/components/ui/selector-relacional-combobox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Articulo, SolicitudOc, SolicitudOcLinea, Departamento, GlobalesCo } from "@/lib/types";

interface SolicitudCompraTabProps {
  articulos: Articulo[];
  serverOnline: boolean;
  API_BASE_URL: string;
  user: { usuario?: string } | null;
  getSelectOptions: (selectedValue: string, sourceList: Articulo[]) => Articulo[];
  mergeToGlobalArticulos: (list: Articulo[]) => void;
}

interface LineaForm {
  articulo: string;
  descripcion: string;
  cantidad: number;
  comentario: string;
  centroCosto: string;
  cuentaContable: string;
  fechaRequerida: string;
}

const PRIORIDADES = [
  { value: "A", label: "Alta" },
  { value: "M", label: "Media" },
  { value: "B", label: "Baja" },
];

export function SolicitudCompraTab({
  articulos,
  serverOnline,
  API_BASE_URL,
  user,
  getSelectOptions,
  mergeToGlobalArticulos,
}: SolicitudCompraTabProps) {
  const [subTab, setSubTab] = useState<"new" | "history">("new");
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<SolicitudOc[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, SolicitudOc>>({});

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [globalesCo, setGlobalesCo] = useState<GlobalesCo | null>(null);
  const [previewConsecutivo, setPreviewConsecutivo] = useState("SC00000001");
  const [centroCostos, setCentroCostos] = useState<any[]>([]);
  const [cuentasContables, setCuentasContables] = useState<any[]>([]);
  const [centroCuentas, setCentroCuentas] = useState<any[]>([]);

  const [departamento, setDepartamento] = useState("");
  const [fechaSolicitud, setFechaSolicitud] = useState(new Date().toISOString().split("T")[0]);
  const [fechaRequerida, setFechaRequerida] = useState(new Date().toISOString().split("T")[0]);
  const [prioridad, setPrioridad] = useState("M");
  const [comentario, setComentario] = useState("");
  const [rubro1, setRubro1] = useState("");
  const [rubro2, setRubro2] = useState("");
  const [rubro3, setRubro3] = useState("");
  const [rubro4, setRubro4] = useState("");
  const [rubro5, setRubro5] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [lineas, setLineas] = useState<LineaForm[]>([
    { articulo: "", descripcion: "", cantidad: 1, comentario: "", centroCosto: "", cuentaContable: "", fechaRequerida: new Date().toISOString().split("T")[0] },
  ]);

  useEffect(() => {
    async function loadCatalogs() {
      if (!serverOnline) return;
      try {
        const [depRes, globRes, consRes, ccRes, accRes, relRes] = await Promise.all([
          fetch(`${API_BASE_URL}/departamento?activo=S&limit=200`),
          fetch(`${API_BASE_URL}/globales-co`),
          fetch(`${API_BASE_URL}/globales-co/siguiente-solicitud`),
          fetch(`${API_BASE_URL}/centrocosto?limit=1000`),
          fetch(`${API_BASE_URL}/cuentacontable?limit=10000`),
          fetch(`${API_BASE_URL}/centro-cuenta?limit=10000`),
        ]);

        if (depRes.ok) {
          const deps = await depRes.json();
          setDepartamentos(deps);
          if (deps.length > 0 && !departamento) setDepartamento(deps[0].departamento);
        }
        if (globRes.ok) setGlobalesCo(await globRes.json());
        if (consRes.ok) {
          const data = await consRes.json();
          setPreviewConsecutivo(data.siguiente);
        }
        if (ccRes.ok) setCentroCostos(await ccRes.json());
        if (accRes.ok) setCuentasContables(await accRes.json());
        if (relRes.ok) setCentroCuentas(await relRes.json());
      } catch (err) {
        console.error("Error cargando catálogos", err);
      }
    }
    loadCatalogs();
  }, [serverOnline, API_BASE_URL]);

  const fetchHistory = useCallback(async () => {
    if (!serverOnline) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/solicitud-oc?limit=50`);
      if (res.ok) setHistory(await res.json());
    } catch {
      toast.error("No se pudo cargar el historial");
    } finally {
      setLoadingHistory(false);
    }
  }, [serverOnline, API_BASE_URL]);

  useEffect(() => {
    if (subTab === "history") fetchHistory();
  }, [subTab, fetchHistory]);

  const fetchDetail = async (id: string) => {
    if (detailCache[id]) return detailCache[id];
    const res = await fetch(`${API_BASE_URL}/solicitud-oc/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      setDetailCache(prev => ({ ...prev, [id]: data }));
      return data;
    }
    return null;
  };

  const handleToggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    await fetchDetail(id);
  };

  const resolveCuentasPorArticulo = async (articuloCodigo: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/articulo-cuenta/por-articulo/${encodeURIComponent(articuloCodigo)}`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  };

  const handleLineaArticuloChange = async (index: number, art: Articulo | null) => {
    setLineas(prev => {
      const copy = [...prev];
      if (!art) {
        copy[index] = { ...copy[index], articulo: "", descripcion: "" };
        return copy;
      }
      copy[index] = { ...copy[index], articulo: art.articulo, descripcion: art.descripcion };
      return copy;
    });
    if (art) {
      const resuelto = await resolveCuentasPorArticulo(art.articulo);
      if (resuelto) {
        setLineas(prev => {
          const copy = [...prev];
          copy[index] = {
            ...copy[index],
            cuentaContable: resuelto.cuentaContable || copy[index].cuentaContable,
          };
          return copy;
        });
      }
    }
  };

  const getAllowedCuentas = (centroCosto: string) => {
    if (!centroCosto) return cuentasContables;
    const codes = centroCuentas.filter(r => r.centroCosto === centroCosto).map(r => r.cuentaContable);
    return cuentasContables.filter(a => codes.includes(a.cuentacontable));
  };

  const resetForm = () => {
    setEditingId(null);
    setDepartamento(departamentos[0]?.departamento || "");
    setFechaSolicitud(new Date().toISOString().split("T")[0]);
    setFechaRequerida(new Date().toISOString().split("T")[0]);
    setPrioridad("M");
    setComentario("");
    setRubro1(""); setRubro2(""); setRubro3(""); setRubro4(""); setRubro5("");
    setLineas([{ articulo: "", descripcion: "", cantidad: 1, comentario: "", centroCosto: "", cuentaContable: "", fechaRequerida: new Date().toISOString().split("T")[0] }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lineasValidas = lineas.filter(l => l.articulo && Number(l.cantidad) > 0);
    if (!departamento) { toast.error("Seleccione un departamento"); return; }
    if (lineasValidas.length === 0) { toast.error("Agregue al menos una línea con artículo y cantidad"); return; }

    setIsSaving(true);
    try {
      const payload = {
        departamento,
        fechaSolicitud,
        fechaRequerida,
        prioridad,
        comentario,
        usuario: user?.usuario?.toUpperCase() || "ERPADMIN",
        rubro1: rubro1 || null,
        rubro2: rubro2 || null,
        rubro3: rubro3 || null,
        rubro4: rubro4 || null,
        rubro5: rubro5 || null,
        lineas: lineasValidas.map(l => ({
          articulo: l.articulo,
          descripcion: l.descripcion,
          cantidad: Number(l.cantidad),
          comentario: l.comentario || null,
          centroCosto: l.centroCosto || null,
          cuentaContable: l.cuentaContable || null,
          fechaRequerida: l.fechaRequerida || fechaRequerida,
        })),
      };

      const url = editingId
        ? `${API_BASE_URL}/solicitud-oc/${encodeURIComponent(editingId)}`
        : `${API_BASE_URL}/solicitud-oc`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? "Solicitud actualizada" : `Solicitud creada: ${previewConsecutivo}`);
        resetForm();
        setSubTab("history");
        const consRes = await fetch(`${API_BASE_URL}/globales-co/siguiente-solicitud`);
        if (consRes.ok) {
          const data = await consRes.json();
          setPreviewConsecutivo(data.siguiente);
        }
        fetchHistory();
      } else {
        const errText = await res.text();
        let msg = errText;
        try { const p = JSON.parse(errText); msg = p.message || msg; } catch {}
        toast.error(typeof msg === "string" ? msg : "Error al guardar");
      }
    } catch (err: any) {
      toast.error(err.message || "Error de red");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = async (solicitud: SolicitudOc) => {
    const detail = await fetchDetail(solicitud.solicitudOc);
    if (!detail) return;
    setEditingId(detail.solicitudOc);
    setDepartamento(detail.departamento);
    setFechaSolicitud(detail.fechaSolicitud ? new Date(detail.fechaSolicitud).toISOString().split("T")[0] : "");
    setFechaRequerida(detail.fechaRequerida ? new Date(detail.fechaRequerida).toISOString().split("T")[0] : "");
    setPrioridad(detail.prioridad || "M");
    setComentario(detail.comentario || "");
    setRubro1(detail.rubro1 || ""); setRubro2(detail.rubro2 || "");
    setRubro3(detail.rubro3 || ""); setRubro4(detail.rubro4 || "");
    setRubro5(detail.rubro5 || "");
    setLineas(
      (detail.lineas || []).map((l: SolicitudOcLinea) => ({
        articulo: l.articulo,
        descripcion: l.descripcion,
        cantidad: Number(l.cantidad),
        comentario: l.comentario || "",
        centroCosto: l.centroCosto || "",
        cuentaContable: l.cuentaContable || "",
        fechaRequerida: l.fechaRequerida ? new Date(l.fechaRequerida).toISOString().split("T")[0] : fechaRequerida,
      }))
    );
    setSubTab("new");
  };

  const handleCancel = async (id: string) => {
    if (!confirm("¿Cancelar esta solicitud?")) return;
    const res = await fetch(`${API_BASE_URL}/solicitud-oc/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: user?.usuario?.toUpperCase() || "ERPADMIN" }),
    });
    if (res.ok) { toast.success("Solicitud cancelada"); fetchHistory(); }
    else toast.error("No se pudo cancelar");
  };

  const estadoBadge = (estado: string) => {
    if (estado === "A") return <Badge className="bg-emerald-100 text-emerald-800">Activa</Badge>;
    if (estado === "I") return <Badge className="bg-slate-100 text-slate-600">Inactiva</Badge>;
    return <Badge>{estado}</Badge>;
  };

  const mostrarRubros = globalesCo?.usarRubros === "S";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex border-b border-slate-200">
        <button onClick={() => setSubTab("new")} className={cn("flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium", subTab === "new" ? "border-brand text-brand" : "border-transparent text-slate-500")}>
          <FileText className="h-4 w-4" /> Nueva Solicitud
        </button>
        <button onClick={() => setSubTab("history")} className={cn("flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium", subTab === "history" ? "border-brand text-brand" : "border-transparent text-slate-500")}>
          <History className="h-4 w-4" /> Historial
        </button>
      </div>

      {subTab === "new" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-brand" />
                {editingId ? `Editar ${editingId}` : "Nueva Solicitud de Compra"}
              </CardTitle>
              <CardDescription>
                Consecutivo: <span className="font-mono font-semibold text-brand">{editingId || previewConsecutivo}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Departamento</Label>
                <NativeSelect value={departamento} onChange={e => setDepartamento(e.target.value)} required>
                  <option value="">Seleccione...</option>
                  {departamentos.map(d => (
                    <option key={d.departamento} value={d.departamento}>{d.departamento} - {d.descripcion}</option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label>Fecha Solicitud</Label>
                <Input type="date" value={fechaSolicitud} onChange={e => setFechaSolicitud(e.target.value)} />
              </div>
              <div>
                <Label>Fecha Requerida</Label>
                <Input type="date" value={fechaRequerida} onChange={e => setFechaRequerida(e.target.value)} />
              </div>
              <div>
                <Label>Prioridad</Label>
                <NativeSelect value={prioridad} onChange={e => setPrioridad(e.target.value)}>
                  {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </NativeSelect>
              </div>
              <div className="md:col-span-2">
                <Label>Comentario</Label>
                <Input value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Comentario general" />
              </div>
              {mostrarRubros && (
                <>
                  <div><Label>{globalesCo?.rubro1SolNom || "Rubro 1"}</Label><Input value={rubro1} onChange={e => setRubro1(e.target.value)} /></div>
                  <div><Label>{globalesCo?.rubro2SolNom || "Rubro 2"}</Label><Input value={rubro2} onChange={e => setRubro2(e.target.value)} /></div>
                  <div><Label>{globalesCo?.rubro3SolNom || "Rubro 3"}</Label><Input value={rubro3} onChange={e => setRubro3(e.target.value)} /></div>
                  <div><Label>{globalesCo?.rubro4SolNom || "Rubro 4"}</Label><Input value={rubro4} onChange={e => setRubro4(e.target.value)} /></div>
                  <div><Label>{globalesCo?.rubro5SolNom || "Rubro 5"}</Label><Input value={rubro5} onChange={e => setRubro5(e.target.value)} /></div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Líneas de Solicitud</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setLineas(prev => [...prev, { articulo: "", descripcion: "", cantidad: 1, comentario: "", centroCosto: "", cuentaContable: "", fechaRequerida }])}>
                <Plus className="h-4 w-4 mr-1" /> Agregar línea
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineas.map((linea, idx) => (
                <div key={idx} className="grid gap-3 p-4 border rounded-lg bg-slate-50/50 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <Label>Artículo</Label>
                    <SelectorRelacionalComboBox
                      label=""
                      value={linea.articulo}
                      options={getSelectOptions(linea.articulo, articulos)}
                      displayKey="descripcion"
                      valueKey="articulo"
                      formatOptionLabel={(item) => `${item.articulo} - ${item.descripcion}`}
                      onChange={val => {
                        const art = articulos.find(a => a.articulo === String(val));
                        handleLineaArticuloChange(idx, art || null);
                      }}
                      onSearch={async (q) => {
                        const res = await fetch(`${API_BASE_URL}/articulo?limit=50&q=${encodeURIComponent(q)}`);
                        if (res.ok) {
                          const list = await res.json();
                          mergeToGlobalArticulos(list);
                          return list;
                        }
                        return [];
                      }}
                      placeholder="Buscar artículo..."
                    />
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <Input type="number" min="0.0001" step="any" value={linea.cantidad} onChange={e => setLineas(prev => { const c = [...prev]; c[idx] = { ...c[idx], cantidad: Number(e.target.value) }; return c; })} />
                  </div>
                  <div>
                    <Label>Centro Costo</Label>
                    <NativeSelect value={linea.centroCosto} onChange={e => setLineas(prev => { const c = [...prev]; c[idx] = { ...c[idx], centroCosto: e.target.value }; return c; })}>
                      <option value="">—</option>
                      {centroCostos.map(cc => <option key={cc.centrocosto} value={cc.centrocosto}>{cc.centrocosto}</option>)}
                    </NativeSelect>
                  </div>
                  <div>
                    <Label>Cuenta Contable</Label>
                    <NativeSelect value={linea.cuentaContable} onChange={e => setLineas(prev => { const c = [...prev]; c[idx] = { ...c[idx], cuentaContable: e.target.value }; return c; })}>
                      <option value="">—</option>
                      {getAllowedCuentas(linea.centroCosto).map(acc => <option key={acc.cuentacontable} value={acc.cuentacontable}>{acc.cuentacontable}</option>)}
                    </NativeSelect>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setLineas(prev => prev.filter((_, i) => i !== idx))} disabled={lineas.length <= 1}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="md:col-span-3">
                    <Label>Comentario línea</Label>
                    <Input value={linea.comentario} onChange={e => setLineas(prev => { const c = [...prev]; c[idx] = { ...c[idx], comentario: e.target.value }; return c; })} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving || !serverOnline}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
              {editingId ? "Actualizar Solicitud" : "Crear Solicitud"}
            </Button>
            {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancelar edición</Button>}
          </div>
        </form>
      )}

      {subTab === "history" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Historial de Solicitudes</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loadingHistory}>
              <RefreshCw className={cn("h-4 w-4", loadingHistory && "animate-spin")} />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
            ) : history.length === 0 ? (
              <EmptyState title="Sin solicitudes" description="Aún no hay solicitudes registradas." />
            ) : (
              <div className="space-y-2">
                {history.map(sol => (
                  <div key={sol.solicitudOc} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 cursor-pointer" onClick={() => handleToggleExpand(sol.solicitudOc)}>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-semibold">{sol.solicitudOc}</span>
                        {estadoBadge(sol.estado)}
                        <span className="text-sm text-slate-500">Dept: {sol.departamento}</span>
                        <span className="text-sm text-slate-500">{sol.usuario}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sol.estado === "A" && !sol.autorizadaPor && (
                          <>
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleStartEdit(sol); }}>Editar</Button>
                            <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); handleCancel(sol.solicitudOc); }}>Cancelar</Button>
                          </>
                        )}
                        {expandedId === sol.solicitudOc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    {expandedId === sol.solicitudOc && detailCache[sol.solicitudOc] && (
                      <div className="p-4 bg-slate-50 border-t text-sm space-y-2">
                        <p><strong>Comentario:</strong> {detailCache[sol.solicitudOc].comentario || "—"}</p>
                        <table className="w-full text-left">
                          <thead><tr className="border-b"><th className="py-1">#</th><th>Artículo</th><th>Descripción</th><th>Cant.</th><th>Centro</th><th>Cuenta</th></tr></thead>
                          <tbody>
                            {(detailCache[sol.solicitudOc].lineas || []).map((l: SolicitudOcLinea) => (
                              <tr key={l.solicitudOcLinea} className="border-b border-slate-100">
                                <td className="py-1">{l.solicitudOcLinea}</td>
                                <td>{l.articulo}</td>
                                <td>{l.descripcion}</td>
                                <td>{l.cantidad}</td>
                                <td>{l.centroCosto || "—"}</td>
                                <td>{l.cuentaContable || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
