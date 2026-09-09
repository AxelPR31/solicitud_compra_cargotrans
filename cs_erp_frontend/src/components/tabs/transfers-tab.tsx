"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SelectorRelacionalComboBox } from "@/components/ui/selector-relacional-combobox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Articulo, Bodega, TrasladoInternoEncabezado, TrasladoInternoDetalle } from "@/lib/types";

interface TransfersTabProps {
  articulos: Articulo[];
  bodegas: Bodega[];
  serverOnline: boolean;
  API_BASE_URL: string;
  user: any;
  getSelectOptions: (selectedValue: string, sourceList: Articulo[]) => Articulo[];
  mergeToGlobalArticulos: (list: Articulo[]) => void;
}

export function TransfersTab({
  articulos,
  bodegas,
  serverOnline,
  API_BASE_URL,
  user,
  getSelectOptions,
  mergeToGlobalArticulos
}: TransfersTabProps) {
  const [subTab, setSubTab] = useState<"new" | "history">("new");
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<TrasladoInternoEncabezado[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);

  // Form Header States
  const [bodegaOrigen, setBodegaOrigen] = useState("");
  const [bodegaDestino, setBodegaDestino] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [useConsecutivo, setUseConsecutivo] = useState(true);
  const [previewConsecutivo, setPreviewConsecutivo] = useState("TR-######");

  useEffect(() => {
    async function fetchConsecutivo() {
      if (!serverOnline) return;
      try {
        const res = await fetch(`${API_BASE_URL}/consecutivo-app-consumo/TRASLADO_INTERNO/siguiente`);
        if (res.ok) {
          const data = await res.json();
          setPreviewConsecutivo(data.siguiente);
        }
      } catch (err) {
        console.error("Error fetching preview consecutivo for traslado", err);
      }
    }
    if (serverOnline && useConsecutivo) {
      fetchConsecutivo();
    }
  }, [serverOnline, API_BASE_URL, useConsecutivo]);

  // Accounting States
  const [centroCostos, setCentroCostos] = useState<any[]>([]);
  const [cuentasContables, setCuentasContables] = useState<any[]>([]);
  const [centroCuentas, setCentroCuentas] = useState<any[]>([]);
  const [centroCosto, setCentroCosto] = useState("");
  const [cuentaContable, setCuentaContable] = useState("");

  // Sync default values dynamically once bodegas prop is loaded from database API
  useEffect(() => {
    if (bodegas && bodegas.length > 0) {
      setBodegaOrigen(prev => prev || bodegas[0]?.bodega || "");
      setBodegaDestino(prev => prev || bodegas[1]?.bodega || bodegas[0]?.bodega || "");
    }
  }, [bodegas]);

  // Load accounting catalogs
  useEffect(() => {
    async function loadLookups() {
      try {
        const ccRes = await fetch(`${API_BASE_URL}/centrocosto?limit=1000`);
        if (ccRes.ok) {
          const data = await ccRes.json();
          setCentroCostos(data);
        }

        const accountsRes = await fetch(`${API_BASE_URL}/cuentacontable?limit=10000`);
        if (accountsRes.ok) {
          const data = await accountsRes.json();
          setCuentasContables(data);
        }

        const relsRes = await fetch(`${API_BASE_URL}/centro-cuenta?limit=10000`);
        if (relsRes.ok) {
          const data = await relsRes.json();
          setCentroCuentas(data);
        }

        const defaultsRes = await fetch(`${API_BASE_URL}/configuracion-defecto/TRASLADO_INTERNO`);
        if (defaultsRes.ok) {
          const defaults = await defaultsRes.json();
          if (defaults) {
            setCentroCosto(defaults.centroCosto || "");
            setCuentaContable(defaults.cuentaContable || "");
          }
        }
      } catch (err) {
        console.error("Error loading accounting lookups in TransfersTab", err);
      }
    }
    if (serverOnline) {
      loadLookups();
    }
  }, [serverOnline, API_BASE_URL]);

  const allowedCuentas = useMemo(() => {
    if (!centroCosto) return [];
    const matchedAccountCodes = centroCuentas
      .filter((rel) => rel.centroCosto === centroCosto)
      .map((rel) => rel.cuentaContable);
    
    return cuentasContables.filter((acc) => matchedAccountCodes.includes(acc.cuentacontable));
  }, [centroCosto, centroCuentas, cuentasContables]);

  // Catalog Modal States
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [selectedCatalogArticles, setSelectedCatalogArticles] = useState<Set<string>>(new Set());

  // Filter articles based on search query
  const filteredCatalogArticles = useMemo(() => {
    if (!articulos) return [];
    const query = catalogSearchQuery.toLowerCase().trim();
    if (!query) return articulos;
    return articulos.filter(
      (art) =>
        (art.articulo || "").toLowerCase().includes(query) ||
        (art.descripcion || "").toLowerCase().includes(query)
    );
  }, [articulos, catalogSearchQuery]);

  const handleToggleCatalogArticle = (code: string) => {
    setSelectedCatalogArticles((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedCatalogArticles((prev) => {
      const next = new Set(prev);
      filteredCatalogArticles.forEach((art) => next.add(art.articulo));
      return next;
    });
  };

  const handleClearCatalogSelection = () => {
    setSelectedCatalogArticles(new Set());
  };

  const handleAddArticlesBatch = (selectedList: Articulo[]) => {
    setFormItems(prev => {
      const existingCodes = new Set(prev.map(item => item.articulo).filter(Boolean));
      const filteredNew = selectedList.filter(art => !existingCodes.has(art.articulo));

      const newItems = filteredNew.map(art => ({
        articulo: art.articulo,
        descripcion: art.descripcion,
        unidad: 0,
        lb: 0,
        unidadMedida: art.unidadAlmacen,
        costoUnitario: Number(art.costoPromLoc ?? 0),
        costoTotal: 0
      }));

      const baseList = prev.filter(item => item.articulo !== "");

      return [...baseList, ...newItems];
    });
  };

  const handleConfirmCatalogSelection = () => {
    const selectedList = articulos.filter((art) => selectedCatalogArticles.has(art.articulo));
    handleAddArticlesBatch(selectedList);
    setIsCatalogModalOpen(false);
    setSelectedCatalogArticles(new Set());
    setCatalogSearchQuery("");
  };

  // Form Details State
  const [formItems, setFormItems] = useState<TrasladoInternoDetalle[]>([]);
  const [editingTransferId, setEditingTransferId] = useState<number | null>(null);

  // State to filter dropdown options inside the list search
  const [articulosListOptions, setArticulosListOptions] = useState<Record<number, Articulo[]>>({});

  // Logo Modal States for Printing
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [selectedPrintId, setSelectedPrintId] = useState<number | null>(null);
  const [printTitleSuffix, setPrintTitleSuffix] = useState("");

  const handlePrintRequest = (id: number) => {
    setSelectedPrintId(id);
    const req = history.find(h => h.id === id);
    if (req) {
      // Auto-populate suffix with the name of the destination warehouse (cleaned/trimmed)
      const wDest = bodegas.find(b => b.bodega.trim() === req.bodegaDestino.trim());
      setPrintTitleSuffix(wDest ? wDest.nombre.toUpperCase() : "");
    } else {
      setPrintTitleSuffix("");
    }
    setLogoModalOpen(true);
  };

  const triggerPrint = (logoType: string) => {
    if (!selectedPrintId) return;
    setLogoModalOpen(false);
    
    // Open standard endpoint in a new tab for download with selected logos and custom title
    const url = `${API_BASE_URL}/reportes/traslado-interno/${selectedPrintId}/pdf?logos=${logoType}&titulo=${encodeURIComponent(printTitleSuffix)}`;
    window.open(url, "_blank");
  };

  // Load history from backend
  const fetchHistory = useCallback(async () => {
    if (!serverOnline) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/traslado-interno?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Error loading transfer requests history:", err);
      toast.error("No se pudo cargar el historial de traslados");
    } finally {
      setLoadingHistory(false);
    }
  }, [serverOnline, API_BASE_URL]);

  useEffect(() => {
    if (subTab === "history") {
      fetchHistory();
    }
  }, [subTab, fetchHistory]);

  // Handle changes in item quantity/fields
  const handleItemChange = (index: number, field: keyof TrasladoInternoDetalle, val: any) => {
    setFormItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };

      // Calculate cost total based on whether it is weighed (lb) or unit-based (unidad)
      const uMedida = (item.unidadMedida || "").toUpperCase();
      const isLbs = uMedida === "LBS" || uMedida === "LB" || uMedida.includes("LIBRA");
      
      const qty = isLbs ? Number(item.lb || 0) : Number(item.unidad || 0);
      item.costoTotal = Number((qty * Number(item.costoUnitario || 0)).toFixed(4));

      copy[index] = item;
      return copy;
    });
  };

  // Handle mapping an article manually from search/dropdown
  const handleMapArticle = (index: number, selectedArt: Articulo | null) => {
    setFormItems(prev => {
      const copy = [...prev];
      if (selectedArt) {
        copy[index] = {
          ...copy[index],
          articulo: selectedArt.articulo,
          descripcion: selectedArt.descripcion,
          unidadMedida: selectedArt.unidadAlmacen,
          costoUnitario: Number(selectedArt.costoPromLoc ?? 0),
          costoTotal: Number((
            ((selectedArt.unidadAlmacen === "LBS" || selectedArt.unidadAlmacen === "LB" || selectedArt.unidadAlmacen?.toUpperCase().includes("LIBRA"))
              ? Number(copy[index].lb || 0)
              : Number(copy[index].unidad || 0)) * Number(selectedArt.costoPromLoc ?? 0)
          ).toFixed(4))
        };
      } else {
        copy[index] = {
          ...copy[index],
          articulo: "",
          descripcion: "",
          unidadMedida: "",
          costoUnitario: 0,
          costoTotal: 0
        };
      }
      return copy;
    });
  };

  // Add custom manual line item
  const handleAddCustomLine = () => {
    setFormItems(prev => [
      ...prev,
      {
        articulo: "",
        descripcion: "",
        unidad: 0,
        lb: 0,
        costoUnitario: 0,
        costoTotal: 0
      }
    ]);
  };

  // Remove item line
  const handleRemoveLine = (index: number) => {
    setFormItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Calculate overall total cost of the request
  const overallTotalCost = useMemo(() => {
    return formItems.reduce((sum, item) => sum + (item.costoTotal || 0), 0);
  }, [formItems]);

  const activeItemsCount = useMemo(() => {
    return formItems.filter(item => item.articulo !== "" && (Number(item.unidad || 0) > 0 || Number(item.lb || 0) > 0)).length;
  }, [formItems]);

  const handleStartEdit = (req: TrasladoInternoEncabezado) => {
    setEditingTransferId(req.id);
    setBodegaOrigen(req.bodegaOrigen ? req.bodegaOrigen.trim() : "");
    setBodegaDestino(req.bodegaDestino ? req.bodegaDestino.trim() : "");
    setFecha(req.fecha ? new Date(req.fecha).toISOString().split("T")[0] : "");
    setReferencia(req.referencia || "");
    setCentroCosto(req.centroCosto || "");
    setCuentaContable(req.cuentaContable || "");
    setUseConsecutivo(false);
    setNumeroDocumento(req.numeroDocumento || "");

    if (req.detalles && req.detalles.length > 0) {
      setFormItems(req.detalles.map(d => ({
        articulo: d.articulo,
        descripcion: d.descripcion,
        unidadMedida: d.unidadMedida || "",
        unidad: Number(d.unidad || 0),
        lb: Number(d.lb || 0),
        costoUnitario: Number(d.costoUnitario || 0),
        costoTotal: Number(d.costoTotal || 0)
      })));
    } else {
      setFormItems([]);
    }

    setSubTab("new");
  };

  const handleCancelEdit = () => {
    setEditingTransferId(null);
    setBodegaOrigen("");
    setBodegaDestino("");
    setFecha(new Date().toISOString().split("T")[0]);
    setReferencia("");
    setCentroCosto("");
    setCuentaContable("");
    setUseConsecutivo(true);
    setNumeroDocumento("");
    setFormItems([]);
  };

  // Submit transfer request to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bodegaOrigen === bodegaDestino) {
      toast.error("La bodega de origen y destino no pueden ser la misma.");
      return;
    }

    const payloadDetalles = formItems
      .filter(item => Number(item.unidad || 0) > 0 || Number(item.lb || 0) > 0)
      .map(item => {
        if (!item.articulo) {
          throw new Error(`El artículo "${item.descripcion}" no está enlazado con un código de Softland. Por favor enlácelo o remuévalo.`);
        }
        return {
          articulo: item.articulo,
          descripcion: item.descripcion,
          tmpVd: "0",
          oz: 0,
          unidad: Number(item.unidad || 0),
          lb: Number(item.lb || 0),
          unidadMedida: item.unidadMedida || "",
          costoUnitario: Number(item.costoUnitario),
          costoTotal: Number(item.costoTotal)
        };
      });

    if (payloadDetalles.length === 0) {
      toast.error("Debe ingresar cantidades en al menos un artículo.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        bodegaOrigen,
        bodegaDestino,
        fecha,
        referencia,
        centroCosto: centroCosto || null,
        cuentaContable: cuentaContable || null,
        numeroDocumento: useConsecutivo ? "AUTO" : (numeroDocumento || null),
        usuario: user?.usuario?.toUpperCase() || "WEB_RESTAURANTE",
        detalles: payloadDetalles
      };

      const url = editingTransferId
        ? `${API_BASE_URL}/traslado-interno/${editingTransferId}`
        : `${API_BASE_URL}/traslado-interno`;
      const method = editingTransferId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingTransferId
          ? "Solicitud de traslado modificada con éxito."
          : "Solicitud de traslado registrada como PENDIENTE con éxito."
        );
        handleCancelEdit();
        setSubTab("history");
        fetchHistory();
      } else {
        const errText = await res.text();
        let errorMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.message) {
            errorMsg = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
          }
        } catch {}
        toast.error(`Error al guardar traslado: ${errorMsg}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Error de red al registrar el traslado.");
    } finally {
      setIsSaving(false);
    }
  };

  // Approve Transfer Request and generate Softland Document
  const handleApprove = async (id: number) => {
    const loadingToast = toast.loading("Generando documento de Traslado en Softland...");
    try {
      const res = await fetch(`${API_BASE_URL}/traslado-interno/${id}/aprobar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: user?.usuario?.toUpperCase() || "ERPADMIN" })
      });

      if (res.ok) {
        const approvedData = await res.json();
        toast.success(`Traslado aprobado con éxito. Consecutivo generado: ${approvedData.documentoInvSoftland}`, {
          id: loadingToast
        });
        fetchHistory();
      } else {
        const errText = await res.text();
        let errorMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.message) {
            errorMsg = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
          }
        } catch {}
        toast.error(`Error al aprobar traslado: ${errorMsg}`, { id: loadingToast });
      }
    } catch (err) {
      toast.error("Error de red al intentar aprobar traslado.", { id: loadingToast });
    }
  };

  // Reject Transfer Request
  const handleReject = async (id: number) => {
    if (!confirm("¿Está seguro de que desea rechazar esta solicitud de traslado?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/traslado-interno/${id}/rechazar`, {
        method: "POST"
      });

      if (res.ok) {
        toast.success("Solicitud de traslado rechazada.");
        fetchHistory();
      } else {
        const errText = await res.text();
        let errorMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.message) {
            errorMsg = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
          }
        } catch {}
        toast.error(`Error al rechazar traslado: ${errorMsg}`);
      }
    } catch (err) {
      toast.error("Error de red al intentar rechazar el traslado.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Sub-tab navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab("new")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-all ${
            subTab === "new"
              ? "border-brand text-brand font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Truck className="h-4 w-4" />
          {editingTransferId ? "Editar Solicitud de Traslado" : "Nueva Solicitud de Traslado"}
        </button>
        <button
          onClick={() => setSubTab("history")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-all ${
            subTab === "history"
              ? "border-brand text-brand font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          Historial y Aprobación
        </button>
      </div>

      {subTab === "new" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Panel */}
          <Card className="border-slate-200/80 shadow-md bg-white">
            <CardHeader className="border-b border-slate-100 p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="font-serif text-xl font-normal text-brand">
                    {editingTransferId ? `Editando Solicitud N° ${numeroDocumento || editingTransferId}` : "Hoja de Pedido / Solicitud de Traslado"}
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-sans mt-1">
                    Cree una solicitud para reabastecer artículos y porciones desde la Casa Matriz.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Bodega Origen (Casa Matriz)
                  </Label>
                  <NativeSelect
                    value={bodegaOrigen}
                    onChange={(e) => setBodegaOrigen(e.target.value)}
                    className="bg-white border-slate-200"
                  >
                    {bodegas.map(b => (
                      <option key={b.bodega} value={b.bodega}>
                        {b.bodega} - {b.nombre}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Bodega Destino (Restaurante)
                  </Label>
                  <NativeSelect
                    value={bodegaDestino}
                    onChange={(e) => setBodegaDestino(e.target.value)}
                    className="bg-white border-slate-200"
                  >
                    {bodegas.map(b => (
                      <option key={b.bodega} value={b.bodega}>
                        {b.bodega} - {b.nombre}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Fecha de Solicitud
                  </Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="bg-white pl-10 border-slate-200"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      N° Documento
                    </Label>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Automático</span>
                      <Switch
                        checked={useConsecutivo}
                        disabled={!!editingTransferId}
                        onCheckedChange={(val) => {
                          setUseConsecutivo(val);
                          if (val) setNumeroDocumento("");
                        }}
                      />
                    </div>
                  </div>
                  <Input
                    type="text"
                    placeholder={useConsecutivo ? "Autogenerando..." : "Ej: TR-001"}
                    value={useConsecutivo ? previewConsecutivo : numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    disabled={useConsecutivo || !!editingTransferId}
                    className={cn(
                      "bg-white border-slate-200",
                      (useConsecutivo || !!editingTransferId) && "bg-slate-100 font-mono cursor-not-allowed text-slate-500"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Referencia / Comentarios
                  </Label>
                  <Input
                    type="text"
                    placeholder="Ej: Pedido diario Montoya"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="bg-white border-slate-200"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* List of transfer items in a single flat table */}
          <Card className="border-slate-200/80 shadow-sm overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead className="bg-slate-100/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 w-[350px]">Artículo de Softland</th>
                    <th className="px-4 py-3 text-center w-[120px]">Unidad (Cant)</th>
                    <th className="px-4 py-3 text-center w-[120px]">LB (Libras)</th>
                    <th className="px-4 py-3 text-right w-[130px]">C/U Costo Prom.</th>
                    <th className="px-6 py-3 text-right w-[130px]">Total Costo</th>
                    <th className="px-4 py-3 text-center w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-sans bg-slate-50/10">
                        Presiona "+ Agregar Artículo" abajo para comenzar su solicitud.
                      </td>
                    </tr>
                  ) : (
                    formItems.map((item, index) => {
                      const isWeighed = item.unidadMedida === "LBS" || item.unidadMedida === "LB" || (item.unidadMedida || "").toUpperCase().includes("LIBRA");

                      // Filter out duplicates by article code to prevent React console warnings
                      const comboOptions = (() => {
                        const list = getSelectOptions(item.articulo, articulosListOptions[index] || []).concat(articulos.slice(0, 50));
                        const seen = new Set();
                        return list.filter(a => {
                          if (!a || !a.articulo) return false;
                          if (seen.has(a.articulo)) return false;
                          seen.add(a.articulo);
                          return true;
                        });
                      })();

                      return (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="w-full max-w-[320px]">
                              <SelectorRelacionalComboBox
                                label=""
                                value={item.articulo}
                                onChange={(val) => {
                                  const selected = articulos.find(a => a.articulo === val) || null;
                                  handleMapArticle(index, selected);
                                }}
                                options={comboOptions}
                                displayKey="descripcion"
                                valueKey="articulo"
                                placeholder="Buscar artículo por código o descripción..."
                                formatOptionLabel={(a) => `${a.articulo} - ${a.descripcion}`}
                                onSearch={async (search) => {
                                  if (serverOnline) {
                                    const res = await fetch(`${API_BASE_URL}/articulo?q=${encodeURIComponent(search)}&limit=50`);
                                    if (res.ok) {
                                      const data = await res.json();
                                      mergeToGlobalArticulos(data);
                                      setArticulosListOptions(prev => ({
                                        ...prev,
                                        [index]: data
                                      }));
                                      return data;
                                    }
                                  }
                                  return [];
                                }}
                              />
                              {item.articulo && (
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold text-slate-500 uppercase">U.M. Softland:</span>
                                  <Badge className={`text-[10px] px-1.5 py-0 ${isWeighed ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : "bg-blue-100 text-blue-800 hover:bg-blue-100"}`}>
                                    {item.unidadMedida || "UN"}
                                  </Badge>
                                  <span className="text-[9px] text-slate-400 italic">
                                    (Se contabiliza en {isWeighed ? "Libras" : "Unidades"})
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unidad || ""}
                              onChange={(e) => handleItemChange(index, "unidad", e.target.value ? Number(e.target.value) : 0)}
                              className={`h-9 text-center bg-white border-slate-200 font-mono w-[100px] mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                !isWeighed 
                                  ? "border-blue-300 bg-blue-50/10 focus:border-blue-500 font-bold" 
                                  : "bg-slate-50 text-slate-400 opacity-60"
                              }`}
                              placeholder={isWeighed ? "No aplica" : "0.00"}
                            />
                            {!isWeighed && item.articulo && (
                              <span className="text-[9px] text-blue-600 block mt-1 font-semibold">Principal</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.lb || ""}
                              onChange={(e) => handleItemChange(index, "lb", e.target.value ? Number(e.target.value) : 0)}
                              className={`h-9 text-center bg-white border-slate-200 font-mono w-[100px] mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                isWeighed 
                                  ? "border-amber-300 bg-amber-50/10 focus:border-amber-500 font-bold" 
                                  : "bg-slate-50 text-slate-400 opacity-60"
                              }`}
                              placeholder={!isWeighed ? "No aplica" : "0.00"}
                            />
                            {isWeighed && item.articulo && (
                              <span className="text-[9px] text-amber-700 block mt-1 font-semibold">Principal</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-slate-600">
                            C$ {Number(item.costoUnitario || 0).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {item.unidadMedida && (
                              <span className="text-[10px] text-slate-400 block font-sans">
                                prom. por {item.unidadMedida}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900">
                            C$ {Number(item.costoTotal || 0).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLine(index)}
                              className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Action buttons and summary bar */}
          <div className="flex flex-col gap-4 bg-white border border-slate-200/80 rounded-xl p-6 shadow-md md:flex-row md:items-center md:justify-between sticky bottom-4 z-20">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Artículos Activos</span>
                <span className="text-xl font-bold text-slate-800">{activeItemsCount} para traslado</span>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Valor Estimado del Traslado</span>
                <span className="text-2xl font-bold text-brand font-serif">
                  C$ {overallTotalCost.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              {editingTransferId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="text-slate-600 hover:bg-slate-100 font-medium px-6"
                >
                  Cancelar Edición
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCatalogModalOpen(true)}
                className="border-slate-200 text-brand hover:bg-brand/5 font-semibold"
              >
                <Search className="h-4 w-4 mr-2" />
                Agregar por Catálogo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCustomLine}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Artículo
              </Button>
              <Button
                type="submit"
                className="bg-brand text-white hover:bg-brand/90 font-medium px-8"
                disabled={activeItemsCount === 0 || isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  editingTransferId ? "Guardar Cambios" : "Enviar Solicitud"
                )}
              </Button>
            </div>
          </div>
        </form>
      )}

      {subTab === "history" && (
        <Card className="border-slate-200/80 shadow-md">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-lg text-brand font-normal">
                  Historial de Traslados Internos
                </CardTitle>
                <CardDescription className="font-sans text-slate-500">
                  Visualice el estado de las solicitudes enviadas a la Casa Matriz.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
                <p className="text-sm font-medium text-slate-500 font-sans">Cargando traslados...</p>
              </div>
            ) : history.length === 0 ? (
              <EmptyState message="No hay solicitudes de traslados internos registradas." />
            ) : (
              <div className="space-y-4">
                {history.map((req) => {
                  const isExpanded = expandedRequestId === req.id;
                  
                  return (
                    <div
                      key={req.id}
                      className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition-all bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4 bg-slate-50/40">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha</span>
                            <span className="text-sm font-medium text-slate-600 font-mono">
                              {new Date(req.fecha).toLocaleDateString("es-NI")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">N° Documento</span>
                            <span className="text-sm font-semibold font-mono text-slate-800">
                              {req.numeroDocumento || "N/D"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ruta</span>
                            <span className="text-sm font-medium text-slate-700">
                              Bodega {req.bodegaOrigen} ➔ {req.bodegaDestino}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado</span>
                            {req.estado === "Aprobado" && (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Aprobado
                              </Badge>
                            )}
                            {req.estado === "Rechazado" && (
                              <Badge className="bg-rose-100 text-rose-800 border-rose-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Rechazado
                              </Badge>
                            )}
                            {req.estado === "Pendiente" && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendiente
                              </Badge>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Doc. Softland</span>
                            <span className="text-sm font-semibold font-mono text-slate-800">
                              {req.documentoInvSoftland || "-"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                            className="text-xs font-semibold text-slate-600"
                          >
                            {isExpanded ? "Ocultar Detalle" : "Ver Detalle"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintRequest(req.id)}
                            className="text-xs font-semibold text-brand border-brand/20 hover:bg-brand/5 flex items-center gap-1.5 h-8 px-2.5"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            PDF
                          </Button>

                          {req.estado === "Pendiente" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartEdit(req)}
                                className="border-brand text-brand hover:bg-brand/5 text-xs px-3 h-8"
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(req.id)}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-3 h-8"
                              >
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(req.id)}
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs px-3 h-8"
                              >
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Solicitud Details */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 p-5 bg-white">
                          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {req.referencia ? (
                              <div className="bg-slate-50 border-l-4 border-slate-300 p-3 rounded-r-lg">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Comentarios</p>
                                <p className="text-sm text-slate-700 mt-1">{req.referencia}</p>
                              </div>
                            ) : (
                              <div></div>
                            )}
                            {(req.centroCosto || req.cuentaContable) ? (
                              <div className="bg-slate-50 border-l-4 border-amber-600 p-3 rounded-r-lg">
                                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Información Contable</p>
                                <p className="text-sm text-slate-700 mt-1">
                                  {req.centroCosto && <span>Centro de Costo: <span className="font-mono font-bold text-brand">{req.centroCosto}</span></span>}
                                  {req.cuentaContable && <span className="ml-4">Cuenta Contable: <span className="font-mono font-bold text-brand">{req.cuentaContable}</span></span>}
                                </p>
                              </div>
                            ) : (
                              <div></div>
                            )}
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-100/50 uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-2">Código Art.</th>
                                  <th className="px-4 py-2">Descripción</th>
                                  <th className="px-3 py-2 text-center">Cant. Unidad</th>
                                  <th className="px-3 py-2 text-center">Cant. Lb</th>
                                  <th className="px-4 py-2 text-right">Costo Unit.</th>
                                  <th className="px-4 py-2 text-right">Costo Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {req.detalles && req.detalles.length > 0 ? (
                                  req.detalles.map((det) => (
                                    <tr key={det.id} className="hover:bg-slate-50/20">
                                      <td className="px-4 py-3 font-mono font-medium text-slate-700">{det.articulo}</td>
                                      <td className="px-4 py-3 font-medium text-slate-900">{det.descripcion}</td>
                                      <td className="px-3 py-3 text-center font-mono font-semibold text-slate-800">{det.unidad || "-"}</td>
                                      <td className="px-3 py-3 text-center font-mono font-semibold text-slate-800">{det.lb || "-"}</td>
                                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                                        C$ {Number(det.costoUnitario).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                                        C$ {Number(det.costoTotal).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  // Fallback request lines retrieval if details aren't populated directly
                                  <tr className="text-slate-400 italic">
                                    <td colSpan={6} className="px-4 py-6 text-center">
                                      Cargando líneas de la solicitud...
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Premium Logo Selection Modal */}
      <AnimatePresence>
        {logoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100"
            >
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand text-white p-5">
                <h3 className="font-serif text-lg font-normal">Exportar Solicitud a PDF</h3>
                <p className="text-xs text-slate-300 font-sans mt-1">
                  Seleccione la configuración de logotipos que desea mostrar en el membrete del documento.
                </p>
              </div>

              <div className="px-6 pt-5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Nombre del Restaurante / Destino (Título)
                </Label>
                <div className="mt-1.5 flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 items-center gap-1">
                  <span className="text-xs text-slate-400 font-mono font-bold select-none">HOJA DE PEDIDO -</span>
                  <input
                    type="text"
                    value={printTitleSuffix}
                    onChange={(e) => setPrintTitleSuffix(e.target.value)}
                    placeholder="Ej. Eskimo Montoya"
                    className="flex-1 bg-transparent text-xs text-slate-700 font-mono font-bold outline-none placeholder:text-slate-300 placeholder:font-normal uppercase"
                  />
                </div>
              </div>
              
              <div className="p-6 pt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => triggerPrint("eskimo")}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand hover:bg-slate-50/50 transition-all text-left group"
                >
                  <div className="pr-4">
                    <span className="text-sm font-semibold text-slate-800 block">Sólo Logo Eskimo</span>
                    <span className="text-xs text-slate-400">Inserta el logotipo de Eskimo en la esquina izquierda.</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-brand transition-colors flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => triggerPrint("crema")}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand hover:bg-slate-50/50 transition-all text-left group"
                >
                  <div className="pr-4">
                    <span className="text-sm font-semibold text-slate-800 block">Sólo Logo Crema Batida</span>
                    <span className="text-xs text-slate-400">Inserta el logotipo de Crema Batida en la esquina izquierda.</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-brand transition-colors flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => triggerPrint("both")}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand hover:bg-slate-50/50 transition-all text-left group"
                >
                  <div className="pr-4">
                    <span className="text-sm font-semibold text-slate-800 block">Ambos Logotipos</span>
                    <span className="text-xs text-slate-400">Eskimo en la esquina izquierda y Crema Batida en la derecha.</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-brand transition-colors flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => triggerPrint("none")}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-brand hover:bg-slate-50/50 transition-all text-left group"
                >
                  <div className="pr-4">
                    <span className="text-sm font-semibold text-slate-800 block">Sin Logotipo</span>
                    <span className="text-xs text-slate-400">Genera el reporte utilizando únicamente texto plano.</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-brand transition-colors flex-shrink-0" />
                </button>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLogoModalOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCatalogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="border-b border-slate-100 p-5 flex flex-col gap-3 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-normal text-brand">Catálogo de Artículos</h3>
                  <button 
                    type="button"
                    onClick={() => setIsCatalogModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                {/* Search Bar */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Buscar por código o descripción..."
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 pl-10 h-10 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Selection helper row */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {selectedCatalogArticles.size} artículos seleccionados
                </span>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-brand font-medium hover:underline"
                  >
                    Seleccionar todos los filtrados
                  </button>
                  <span className="text-slate-300">|</span>
                  <button 
                    type="button"
                    onClick={handleClearCatalogSelection}
                    className="text-slate-500 font-medium hover:underline"
                  >
                    Limpiar selección
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
                {filteredCatalogArticles.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 italic">
                    No se encontraron artículos con la búsqueda.
                  </div>
                ) : (
                  filteredCatalogArticles.map((art) => {
                    const isSelected = selectedCatalogArticles.has(art.articulo);
                    return (
                      <div
                        key={art.articulo}
                        onClick={() => handleToggleCatalogArticle(art.articulo)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-50 border-brand/50 shadow-sm"
                            : "border-slate-100 hover:bg-slate-50/50 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // toggled via parent div click
                            className="rounded border-slate-300 text-brand focus:ring-brand h-4 w-4"
                          />
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {art.articulo}
                            </span>
                            <p className="text-sm font-medium text-slate-950 mt-1">{art.descripcion}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>{art.unidadAlmacen || "UN"}</p>
                          <p className="font-mono text-[10px] mt-0.5">
                            C$ {Number(art.costoPromLoc ?? 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCatalogModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmCatalogSelection}
                  disabled={selectedCatalogArticles.size === 0}
                  className="bg-brand text-white hover:bg-brand/90"
                >
                  Cargar seleccionados ({selectedCatalogArticles.size})
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
