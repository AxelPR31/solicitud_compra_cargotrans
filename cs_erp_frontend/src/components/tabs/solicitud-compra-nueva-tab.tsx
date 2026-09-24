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
import {
  CS_ENCABEZADO_VEHICULO_HABILITADO,
  CS_LINEAS_CENTRO_COSTO_HABILITADO,
  CS_LINEAS_CUENTA_CONTABLE_HABILITADO,
  type LineaForm,
  type SolicitudCompraTabBaseProps,
} from "./solicitud-compra-shared";

interface SolicitudCompraNuevaTabProps extends SolicitudCompraTabBaseProps {
  editSolicitudId: string | null;
  onSaved: () => void;
  onClearEdit: () => void;
}

const MSG_CUENTA_NO_MOVIMIENTO = "La cuenta seleccionada no acepta movimiento.";

const cuentaAceptaMovimiento = (aceptadatos?: string | null) =>
  (aceptadatos?.trim().toUpperCase() ?? "") === "S";

const parseApiError = (errText: string): string => {
  try {
    const parsed = JSON.parse(errText);
    const msg = parsed?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.join(", ");
    if (msg && typeof msg === "object" && typeof msg.message === "string") return msg.message;
    return errText;
  } catch {
    return errText;
  }
};

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
  const [cuentasPorLinea, setCuentasPorLinea] = useState<Record<number, any[]>>({});

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
  const [placa, setPlaca] = useState("");
  const [chasis, setChasis] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [lineas, setLineas] = useState<LineaForm[]>([
    { articulo: "", descripcion: "", cantidad: 1, comentario: "", especificacion: "", centroCosto: "", cuentaContable: "", fechaRequerida: new Date().toISOString().split("T")[0] },
  ]);

  useEffect(() => {
    async function loadCatalogs() {
      if (!serverOnline) return;
      try {
        const catalogFetches: Promise<Response>[] = [
          fetch(`${API_BASE_URL}/departamento?activo=S&limit=200`),
          fetch(`${API_BASE_URL}/globales-co`),
          fetch(`${API_BASE_URL}/globales-co/siguiente-solicitud`),
        ];
        if (CS_LINEAS_CENTRO_COSTO_HABILITADO) {
          catalogFetches.push(fetch(`${API_BASE_URL}/centrocosto?limit=1000`));
        }
        const results = await Promise.all(catalogFetches);
        const [depRes, globRes, consRes, ccRes] = [
          results[0],
          results[1],
          results[2],
          CS_LINEAS_CENTRO_COSTO_HABILITADO ? results[3] : null,
        ];

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
        if (ccRes?.ok) setCentroCostos(await ccRes.json());
      } catch (err) {
        console.error("Error cargando catálogos", err);
      }
    }
    loadCatalogs();
  }, [serverOnline, API_BASE_URL]);

  useEffect(() => {
    setLineas(prev => prev.map(linea => ({ ...linea, fechaRequerida })));
  }, [fechaRequerida]);

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
      setPlaca(detail.placa || "");
      setChasis(detail.chasis || "");
      setMarca(detail.marca || "");
      setModelo(detail.modelo || "");
      const lineasEdit = (detail.lineas || []).map((l: SolicitudOcLinea) => ({
        articulo: l.articulo,
        descripcion: l.descripcion,
        cantidad: Number(l.cantidad),
        comentario: l.comentario || "",
        especificacion: l.especificacion || "",
        centroCosto: l.centroCosto || "",
        cuentaContable: l.cuentaContable || "",
        fechaRequerida: l.fechaRequerida ? new Date(l.fechaRequerida).toISOString().split("T")[0] : fechaRequerida,
      }));
      setLineas(lineasEdit);

      if (CS_LINEAS_CUENTA_CONTABLE_HABILITADO) {
        const cuentasMap: Record<number, any[]> = {};
        await Promise.all(
          lineasEdit.map(async (linea, idx) => {
            if (!linea.centroCosto) return;
            const params = new URLSearchParams({ limit: "50" });
            const ccRes = await fetch(
              `${API_BASE_URL}/centro-cuenta/cuentas-por-centro/${encodeURIComponent(linea.centroCosto)}?${params.toString()}`
            );
            if (ccRes.ok) cuentasMap[idx] = await ccRes.json();
          })
        );
        setCuentasPorLinea(cuentasMap);
      }
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

  const getCentroCostoOptions = (selectedValue: string) => {
    const list = [...centroCostos];
    if (selectedValue && !list.some(cc => cc.centrocosto === selectedValue)) {
      list.push({ centrocosto: selectedValue, descripcion: selectedValue });
    }
    return list;
  };

  const resolverCuentaDetalle = async (cuentaCode: string) => {
    const local = cuentasContables.find(c => c.cuentacontable === cuentaCode);
    if (local) return local;
    try {
      const res = await fetch(`${API_BASE_URL}/cuentacontable/${encodeURIComponent(cuentaCode)}`);
      if (res.ok) {
        const data = await res.json();
        mergeCuentasContables([data]);
        return data;
      }
    } catch {}
    return null;
  };

  const validarRelacionCentroCuenta = async (centroCosto: string, cuentaContable: string) => {
    if (!centroCosto || !cuentaContable) return true;
    try {
      const params = new URLSearchParams({ centroCosto, cuentaContable });
      const res = await fetch(`${API_BASE_URL}/centro-cuenta/validar?${params.toString()}`);
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.valido);
    } catch {
      return false;
    }
  };

  const fetchCuentasPorCentro = async (centroCosto: string, q = "") => {
    const params = new URLSearchParams({ limit: "50" });
    if (q) params.set("q", q);
    const res = await fetch(
      `${API_BASE_URL}/centro-cuenta/cuentas-por-centro/${encodeURIComponent(centroCosto)}?${params.toString()}`
    );
    if (!res.ok) return [];
    const list = await res.json();
    mergeCuentasContables(list);
    return list;
  };

  const loadCuentasParaLinea = async (idx: number, centroCosto: string) => {
    if (!centroCosto) {
      setCuentasPorLinea(prev => ({ ...prev, [idx]: [] }));
      return;
    }
    const list = await fetchCuentasPorCentro(centroCosto);
    setCuentasPorLinea(prev => ({ ...prev, [idx]: list }));
  };

  const getCuentaOptions = (idx: number, centroCosto: string, selectedCuenta: string) => {
    const list = [...(cuentasPorLinea[idx] || [])];
    if (selectedCuenta && !list.some(a => a.cuentacontable === selectedCuenta)) {
      const found = cuentasContables.find(a => a.cuentacontable === selectedCuenta);
      list.push(found || { cuentacontable: selectedCuenta, descripcion: selectedCuenta });
    }
    return list;
  };

  const mergeCentroCostos = (list: { centrocosto: string; descripcion?: string }[]) => {
    setCentroCostos(prev => {
      const next = [...prev];
      list.forEach(item => {
        if (!next.some(x => x.centrocosto === item.centrocosto)) next.push(item);
      });
      return next;
    });
  };

  const mergeCuentasContables = (list: { cuentacontable: string; descripcion?: string }[]) => {
    setCuentasContables(prev => {
      const next = [...prev];
      list.forEach(item => {
        if (!next.some(x => x.cuentacontable === item.cuentacontable)) next.push(item);
      });
      return next;
    });
  };

  const handleCuentaContableChange = async (index: number, cuentaCode: string) => {
    if (!cuentaCode) {
      setLineas(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], cuentaContable: "" };
        return copy;
      });
      return;
    }

    const cuenta = await resolverCuentaDetalle(cuentaCode);
    if (cuenta && !cuentaAceptaMovimiento(cuenta.aceptadatos)) {
      toast.error(MSG_CUENTA_NO_MOVIMIENTO);
      return;
    }

    setLineas(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], cuentaContable: cuentaCode };
      return copy;
    });
  };

  const handleCentroCostoChange = async (index: number, centroCosto: string) => {
    const cuentaActual = lineas[index]?.cuentaContable || "";

    setLineas(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], centroCosto };
      if (!centroCosto) copy[index].cuentaContable = "";
      return copy;
    });

    if (!centroCosto) {
      setCuentasPorLinea(prev => ({ ...prev, [index]: [] }));
      return;
    }

    await loadCuentasParaLinea(index, centroCosto);

    if (cuentaActual) {
      const valido = await validarRelacionCentroCuenta(centroCosto, cuentaActual);
      if (!valido) {
        setLineas(prev => {
          const copy = [...prev];
          copy[index] = { ...copy[index], cuentaContable: "" };
          return copy;
        });
        toast.warning("La cuenta contable no pertenece al centro de costo seleccionado.");
      }
    }
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
    if (art && CS_LINEAS_CUENTA_CONTABLE_HABILITADO) {
      const resuelto = await resolveCuentasPorArticulo(art.articulo);
      if (resuelto?.cuentaContable) {
        const cuentaCode = resuelto.cuentaContable;
        const centroActual = lineas[index]?.centroCosto || "";
        const cuenta = await resolverCuentaDetalle(cuentaCode);

        if (cuenta && !cuentaAceptaMovimiento(cuenta.aceptadatos)) {
          toast.error(MSG_CUENTA_NO_MOVIMIENTO);
          return;
        }

        if (centroActual) {
          const valido = await validarRelacionCentroCuenta(centroActual, cuentaCode);
          if (valido) {
            setLineas(prev => {
              const copy = [...prev];
              if (!copy[index].cuentaContable) {
                copy[index] = { ...copy[index], cuentaContable: cuentaCode };
              }
              return copy;
            });
          }
        } else {
          setLineas(prev => {
            const copy = [...prev];
            if (!copy[index].cuentaContable) {
              copy[index] = { ...copy[index], cuentaContable: cuentaCode };
            }
            return copy;
          });
        }
      }
    }
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
    setPlaca(""); setChasis(""); setMarca(""); setModelo("");
    setLineas([{ articulo: "", descripcion: "", cantidad: 1, comentario: "", especificacion: "", centroCosto: "", cuentaContable: "", fechaRequerida: new Date().toISOString().split("T")[0] }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lineasValidas = lineas.filter(l => l.articulo && Number(l.cantidad) > 0);
    if (!departamento) { toast.error("Seleccione un departamento"); return; }
    if (lineasValidas.length === 0) { toast.error("Agregue al menos una línea con artículo y cantidad"); return; }

    if (CS_LINEAS_CUENTA_CONTABLE_HABILITADO) {
      for (const linea of lineasValidas) {
        if (linea.cuentaContable) {
          const cuenta = await resolverCuentaDetalle(linea.cuentaContable);
          if (!cuenta || !cuentaAceptaMovimiento(cuenta.aceptadatos)) {
            toast.error(MSG_CUENTA_NO_MOVIMIENTO);
            return;
          }
        }
        if (linea.centroCosto && linea.cuentaContable) {
          const valido = await validarRelacionCentroCuenta(linea.centroCosto, linea.cuentaContable);
          if (!valido) {
            toast.error(`La cuenta ${linea.cuentaContable} no pertenece al centro ${linea.centroCosto}.`);
            return;
          }
        }
      }
    }

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
        ...(CS_ENCABEZADO_VEHICULO_HABILITADO
          ? {
              placa: placa || null,
              chasis: chasis || null,
              marca: marca || null,
              modelo: modelo || null,
            }
          : {}),
        lineas: lineasValidas.map(l => ({
          articulo: l.articulo,
          descripcion: l.descripcion,
          cantidad: Number(l.cantidad),
          comentario: l.comentario || null,
          especificacion: l.especificacion || null,
          centroCosto: CS_LINEAS_CENTRO_COSTO_HABILITADO ? l.centroCosto || null : null,
          cuentaContable: CS_LINEAS_CUENTA_CONTABLE_HABILITADO ? l.cuentaContable || null : null,
          fechaRequerida,
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
        toast.error(parseApiError(errText) || "Error al guardar");
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
              <Label required>Departamento</Label>
              <NativeSelect value={departamento} onChange={e => setDepartamento(e.target.value)} required>
                <option value="">Seleccione...</option>
                {departamentos.map(d => (
                  <option key={d.departamento} value={d.departamento}>{d.departamento} - {d.descripcion}</option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label optional>Fecha Solicitud</Label>
              <Input type="date" value={fechaSolicitud} onChange={e => setFechaSolicitud(e.target.value)} />
            </div>
            <div>
              <Label required>Fecha Requerida</Label>
              <Input type="date" value={fechaRequerida} onChange={e => setFechaRequerida(e.target.value)} required />
            </div>
            <div>
              <Label optional>Prioridad</Label>
              <NativeSelect value={prioridad} onChange={e => setPrioridad(e.target.value as SolicitudOcPrioridad)}>
                {SOLICITUD_OC_PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </NativeSelect>
            </div>
            {CS_ENCABEZADO_VEHICULO_HABILITADO && (
              <>
                <div>
                  <Label optional>N. Placa</Label>
                  <Input value={placa} maxLength={150} onChange={e => setPlaca(e.target.value)} />
                </div>
                <div>
                  <Label optional>Chasis</Label>
                  <Input value={chasis} maxLength={150} onChange={e => setChasis(e.target.value)} />
                </div>
                <div>
                  <Label optional>Marca</Label>
                  <Input value={marca} maxLength={150} onChange={e => setMarca(e.target.value)} />
                </div>
                <div>
                  <Label optional>Modelo</Label>
                  <Input value={modelo} maxLength={150} onChange={e => setModelo(e.target.value)} />
                </div>
              </>
            )}
            <div className="md:col-span-2 lg:col-span-3">
              <Label optional>Comentario</Label>
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
                <div><Label optional>{globalesCo?.rubro1SolNom || "Rubro 1"}</Label><Input value={rubro1} onChange={e => setRubro1(e.target.value)} /></div>
                <div><Label optional>{globalesCo?.rubro2SolNom || "Rubro 2"}</Label><Input value={rubro2} onChange={e => setRubro2(e.target.value)} /></div>
                <div><Label optional>{globalesCo?.rubro3SolNom || "Rubro 3"}</Label><Input value={rubro3} onChange={e => setRubro3(e.target.value)} /></div>
                <div><Label optional>{globalesCo?.rubro4SolNom || "Rubro 4"}</Label><Input value={rubro4} onChange={e => setRubro4(e.target.value)} /></div>
                <div><Label optional>{globalesCo?.rubro5SolNom || "Rubro 5"}</Label><Input value={rubro5} onChange={e => setRubro5(e.target.value)} /></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Líneas de Solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineas.map((linea, idx) => (
              <div key={idx} className="rounded-lg border bg-slate-50/50 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_2.5rem] md:items-end">
                  <div className="min-w-0 sm:col-span-1 md:col-span-1">
                    <Label className="mb-1.5 block" required>Artículo</Label>
                    <SelectorRelacionalComboBox
                      label=""
                      value={linea.articulo}
                      options={getSelectOptions(linea.articulo, articulos)}
                      displayKey="descripcion"
                      valueKey="articulo"
                      formatOptionParts={(item) => ({
                        code: item.articulo,
                        description: item.descripcion,
                      })}
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
                  <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 sm:contents">
                    <div>
                      <Label className="mb-1.5 block" required>Cantidad</Label>
                      <Input
                        type="number"
                        min="0.0001"
                        step="any"
                        className="px-2 text-center"
                        value={linea.cantidad}
                        onChange={e => setLineas(prev => {
                          const c = [...prev];
                          c[idx] = { ...c[idx], cantidad: Number(e.target.value) };
                          return c;
                        })}
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Saldo</Label>
                      <Input
                        type="number"
                        value={linea.cantidad}
                        readOnly
                        className="cursor-not-allowed bg-slate-100 px-2 text-center text-slate-600"
                        tabIndex={-1}
                      />
                    </div>
                    <div className="flex items-end justify-end sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => setLineas(prev => prev.filter((_, i) => i !== idx))}
                        disabled={lineas.length <= 1}
                        aria-label="Eliminar línea"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                {(CS_LINEAS_CENTRO_COSTO_HABILITADO || CS_LINEAS_CUENTA_CONTABLE_HABILITADO) && (
                <div className={cn(
                  "mt-3 grid grid-cols-1 gap-3",
                  CS_LINEAS_CENTRO_COSTO_HABILITADO && CS_LINEAS_CUENTA_CONTABLE_HABILITADO && "md:grid-cols-2",
                )}>
                  {CS_LINEAS_CENTRO_COSTO_HABILITADO && (
                  <div className="min-w-0">
                    <Label className="mb-1.5 block" optional>Centro costo</Label>
                    <SelectorRelacionalComboBox
                      label=""
                      value={linea.centroCosto}
                      options={getCentroCostoOptions(linea.centroCosto)}
                      displayKey="descripcion"
                      valueKey="centrocosto"
                      formatOptionParts={(item) => ({
                        code: item.centrocosto,
                        description: item.descripcion,
                      })}
                      onChange={val => handleCentroCostoChange(idx, String(val))}
                      onSearch={async (q) => {
                        if (linea.cuentaContable) {
                          const params = new URLSearchParams({ limit: "50" });
                          if (q) params.set("q", q);
                          const res = await fetch(
                            `${API_BASE_URL}/centro-cuenta/centros-por-cuenta/${encodeURIComponent(linea.cuentaContable)}?${params.toString()}`
                          );
                          if (res.ok) {
                            const list = await res.json();
                            mergeCentroCostos(list);
                            return list;
                          }
                          return [];
                        }
                        const res = await fetch(`${API_BASE_URL}/centrocosto/search/${encodeURIComponent(q)}`);
                        if (res.ok) {
                          const list = await res.json();
                          mergeCentroCostos(list);
                          return list;
                        }
                        return [];
                      }}
                      placeholder="Buscar centro de costo..."
                    />
                  </div>
                  )}
                  {CS_LINEAS_CUENTA_CONTABLE_HABILITADO && (
                  <div className="min-w-0">
                    <Label className="mb-1.5 block" optional>Cuenta contable</Label>
                    <SelectorRelacionalComboBox
                      label=""
                      value={linea.cuentaContable}
                      disabled={!linea.centroCosto}
                      options={getCuentaOptions(idx, linea.centroCosto, linea.cuentaContable)}
                      displayKey="descripcion"
                      valueKey="cuentacontable"
                      formatOptionParts={(item) => ({
                        code: item.cuentacontable,
                        description: item.descripcion,
                      })}
                      onChange={val => handleCuentaContableChange(idx, String(val))}
                      onSearch={async (q) => {
                        if (!linea.centroCosto) return [];
                        return fetchCuentasPorCentro(linea.centroCosto, q);
                      }}
                      placeholder={linea.centroCosto ? "Buscar cuenta contable..." : "Seleccione centro de costo primero"}
                    />
                  </div>
                  )}
                </div>
                )}

                <div className="mt-3">
                  <Label className="mb-1.5 block" optional>Número de parte / especificación</Label>
                  <Input
                    value={linea.especificacion}
                    maxLength={150}
                    onChange={e => setLineas(prev => {
                      const c = [...prev];
                      c[idx] = { ...c[idx], especificacion: e.target.value };
                      return c;
                    })}
                  />
                </div>

                <div className="mt-3">
                  <Label className="mb-1.5 block" optional>Comentario línea</Label>
                  <Input
                    value={linea.comentario}
                    onChange={e => setLineas(prev => {
                      const c = [...prev];
                      c[idx] = { ...c[idx], comentario: e.target.value };
                      return c;
                    })}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-start border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLineas(prev => [...prev, { articulo: "", descripcion: "", cantidad: 1, comentario: "", especificacion: "", centroCosto: "", cuentaContable: "", fechaRequerida }])}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar línea
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || !serverOnline}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
            {editingId ? "Actualizar Solicitud" : "Crear Solicitud"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={resetForm}>
              Cancelar edición
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
