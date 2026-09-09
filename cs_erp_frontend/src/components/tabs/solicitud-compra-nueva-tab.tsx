"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SelectorRelacionalComboBox } from "@/components/ui/selector-relacional-combobox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Articulo, Departamento, GlobalesCo, SolicitudOcLinea, SolicitudOcPrioridad } from "@/lib/types";
import { SOLICITUD_OC_PRIORIDADES } from "@/lib/types";
import type { LineaForm, SolicitudCompraTabBaseProps } from "./solicitud-compra-shared";

interface SolicitudCompraNuevaTabProps extends SolicitudCompraTabBaseProps {
  editSolicitudId: string | null;
  onSaved: () => void;
  onClearEdit: () => void;
}

export function SolicitudCompraNuevaTab({
  articulos,
  serverOnline,
  API_BASE_URL,
  user,
  getSelectOptions,
  mergeToGlobalArticulos,
  editSolicitudId,
  onSaved,
  onClearEdit,
}: SolicitudCompraNuevaTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [globalesCo, setGlobalesCo] = useState<GlobalesCo | null>(null);
  const [previewConsecutivo, setPreviewConsecutivo] = useState("SC00000001");
  const [centroCostos, setCentroCostos] = useState<any[]>([]);
  const [cuentasContables, setCuentasContables] = useState<any[]>([]);

  const [departamento, setDepartamento] = useState("");
  const [fechaSolicitud, setFechaSolicitud] = useState(new Date().toISOString().split("T")[0]);
  const [fechaRequerida, setFechaRequerida] = useState(new Date().toISOString().split("T")[0]);
  const [prioridad, setPrioridad] = useState<SolicitudOcPrioridad>("M");
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
        const [depRes, globRes, consRes, ccRes, accRes] = await Promise.all([
          fetch(`${API_BASE_URL}/departamento?activo=S&limit=200`),
          fetch(`${API_BASE_URL}/globales-co`),
          fetch(`${API_BASE_URL}/globales-co/siguiente-solicitud`),
          fetch(`${API_BASE_URL}/centrocosto?limit=1000`),
          fetch(`${API_BASE_URL}/cuentacontable?limit=10000`),
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
      } catch (err) {
        console.error("Error cargando catálogos", err);
      }
    }
    loadCatalogs();
  }, [serverOnline, API_BASE_URL]);

  useEffect(() => {
    if (!editSolicitudId || !serverOnline) return;
    async function loadForEdit() {
      const res = await fetch(`${API_BASE_URL}/solicitud-oc/${encodeURIComponent(editSolicitudId)}`);
      if (!res.ok) return;
      const detail = await res.json();
      setEditingId(detail.solicitudOc);
      setDepartamento(detail.departamento);
      setFechaSolicitud(detail.fechaSolicitud ? new Date(detail.fechaSolicitud).toISOString().split("T")[0] : "");
      setFechaRequerida(detail.fechaRequerida ? new Date(detail.fechaRequerida).toISOString().split("T")[0] : "");
      setPrioridad(detail.prioridad ?? "M");
      setComentario(detail.comentario || "");
      setRubro1(detail.rubro1 || "");
      setRubro2(detail.rubro2 || "");
      setRubro3(detail.rubro3 || "");
      setRubro4(detail.rubro4 || "");
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
    }
    loadForEdit();
  }, [editSolicitudId, serverOnline, API_BASE_URL]);

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
      if (resuelto?.cuentaContable) {
        setLineas(prev => {
          const copy = [...prev];
          if (!copy[index].cuentaContable) {
            copy[index] = { ...copy[index], cuentaContable: resuelto.cuentaContable };
          }
          return copy;
        });
      }
    }
  };

  const getCuentaOptions = (selectedCuenta: string) => {
    const list = [...cuentasContables];
    if (selectedCuenta && !list.some(a => a.cuentacontable === selectedCuenta)) {
      list.push({ cuentacontable: selectedCuenta, descripcion: selectedCuenta });
    }
    return list;
  };

  const resetForm = () => {
    setEditingId(null);
    onClearEdit();
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
        const consRes = await fetch(`${API_BASE_URL}/globales-co/siguiente-solicitud`);
        if (consRes.ok) {
          const data = await consRes.json();
          setPreviewConsecutivo(data.siguiente);
        }
        onSaved();
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

  const mostrarRubros = globalesCo?.usarRubros === "S";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
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
              <NativeSelect value={prioridad} onChange={e => setPrioridad(e.target.value as SolicitudOcPrioridad)}>
                {SOLICITUD_OC_PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </NativeSelect>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Label>Comentario</Label>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Comentario general"
                rows={4}
                className={cn(
                  "flex min-h-[100px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
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
                  <Label>Cuenta contable</Label>
                  <p className="mb-1 text-[11px] text-slate-500">Sugerida desde inventario; puede cambiarla o dejarla vacía.</p>
                  <NativeSelect value={linea.cuentaContable} onChange={e => setLineas(prev => { const c = [...prev]; c[idx] = { ...c[idx], cuentaContable: e.target.value }; return c; })}>
                    <option value="">—</option>
                    {getCuentaOptions(linea.cuentaContable).map(acc => <option key={acc.cuentacontable} value={acc.cuentacontable}>{acc.cuentacontable}</option>)}
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
    </motion.div>
  );
}
