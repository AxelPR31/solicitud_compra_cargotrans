"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Scale,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SelectorRelacionalComboBox } from "@/components/ui/selector-relacional-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stepper } from "@/components/ui/stepper";
import { DistributionChart } from "@/components/ui/distribution-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Articulo, RecetaEncabezado, FactorValuacion, Bodega } from "@/lib/types";
import { toast } from "sonner";

interface ManualProducto {
  articulo: string;
  nombre: string;
  cantidadUnitaria: number;
  cantidadLibra: number;
  esMermaRecorte: boolean;
  bodega?: string;
}

interface ManualCalculations {
  totalCostoMP: number;
  totalLibrasProducidas: number;
  totalLibrasMainProducts: number;
  totalCostoSubproducts: number;
  mermaLibras: number;
  mermaPorcentaje: number;
  nuevoCostoLibraMain: number;
  balance: number;
  sumCostoOutputs: number;
  productos: {
    costoTotal: number;
    asignacionCosto: number;
  }[];
}

interface ExtractorTabProps {
  recipes: RecetaEncabezado[];
  factors: FactorValuacion[];
  manualCabecera: any;
  setManualCabecera: (v: any) => void;
  manualMateriaPrima: {
    articulo: string;
    nombre: string;
    cantidad: number;
    costoUnitario: number;
  };
  setManualMateriaPrima: (v: {
    articulo: string;
    nombre: string;
    cantidad: number;
    costoUnitario: number;
  }) => void;
  manualMateriasPrimas: {
    articulo: string;
    nombre: string;
    cantidad: number;
    costoUnitario: number;
  }[];
  handleAddManualMPLine: () => void;
  handleRemoveManualMPLine: (index: number) => void;
  handleManualMPLineChange: (index: number, updates: any) => void;
  setManualMateriasPrimas: (v: any[]) => void;
  manualProductos: ManualProducto[];
  setManualProductos: (v: ManualProducto[]) => void;
  selectedRecipeTemplateId: string;
  handleApplyRecipeTemplate: (recipeIdStr: string) => void;
  articulos: Articulo[];
  articulosRecipesMP: Articulo[];
  articulosManualOutputs: Articulo[];
  serverOnline: boolean;
  API_BASE_URL: string;
  getSelectOptions: (selectedValue: string, sourceList: Articulo[]) => Articulo[];
  mergeToGlobalArticulos: (list: Articulo[]) => void;
  setArticulosRecipesMP: (list: Articulo[]) => void;
  setArticulosManualOutputs: (list: Articulo[]) => void;
  dynamicManualCalculations: ManualCalculations | null;
  handleSaveManualOrder: () => void;
  bodegas: Bodega[];
  unidadesMedida: any[];
  isValidated: boolean;
  setIsValidated: (v: boolean) => void;
  isSaving: boolean;
  editingOrderId?: number | null;
  handleCancelEditOrder?: () => void;
}

export function ExtractorTab({
  recipes,
  factors,
  manualCabecera,
  setManualCabecera,
  manualMateriaPrima,
  setManualMateriaPrima,
  manualMateriasPrimas,
  setManualMateriasPrimas,
  handleAddManualMPLine,
  handleRemoveManualMPLine,
  handleManualMPLineChange,
  manualProductos,
  setManualProductos,
  selectedRecipeTemplateId,
  handleApplyRecipeTemplate,
  articulos,
  articulosRecipesMP,
  articulosManualOutputs,
  serverOnline,
  API_BASE_URL,
  getSelectOptions,
  mergeToGlobalArticulos,
  setArticulosRecipesMP,
  setArticulosManualOutputs,
  dynamicManualCalculations,
  handleSaveManualOrder,
  bodegas,
  unidadesMedida,
  isValidated,
  setIsValidated,
  isSaving,
  editingOrderId,
  handleCancelEditOrder,
}: ExtractorTabProps) {
  const [centroCostos, setCentroCostos] = useState<any[]>([]);
  const [cuentasContables, setCuentasContables] = useState<any[]>([]);
  const [centroCuentas, setCentroCuentas] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(8.5);

  // Estados y lógica de validación
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [previewConsecutivo, setPreviewConsecutivo] = useState("OP-######");

  useEffect(() => {
    async function fetchConsecutivo() {
      if (!serverOnline) return;
      try {
        const res = await fetch(`${API_BASE_URL}/consecutivo-app-consumo/ORDEN_PRODUCCION/siguiente`);
        if (res.ok) {
          const data = await res.json();
          setPreviewConsecutivo(data.siguiente);
        }
      } catch (err) {
        console.error("Error fetching preview consecutivo", err);
      }
    }
    if (serverOnline && manualCabecera.useConsecutivo) {
      fetchConsecutivo();
    }
  }, [serverOnline, API_BASE_URL, manualCabecera.useConsecutivo]);

  const sumMateriasPrimasLbs = useMemo(() => {
    return manualMateriasPrimas.reduce((sum, mp) => sum + Number(mp.cantidad || 0), 0);
  }, [manualMateriasPrimas]);

  const sumSubproductsLbs = useMemo(() => {
    return manualProductos
      .filter((p) => p.esMermaRecorte)
      .reduce((sum, p) => sum + Number(p.cantidadLibra || 0), 0);
  }, [manualProductos]);

  const sumAllOutputsLbs = useMemo(() => {
    return manualProductos.reduce((sum, p) => sum + Number(p.cantidadLibra || 0), 0);
  }, [manualProductos]);

  const isSubproductsWeightValid = useMemo(() => {
    return sumSubproductsLbs <= sumMateriasPrimasLbs;
  }, [sumSubproductsLbs, sumMateriasPrimasLbs]);

  const isTotalWeightValid = useMemo(() => {
    return sumAllOutputsLbs <= sumMateriasPrimasLbs;
  }, [sumAllOutputsLbs, sumMateriasPrimasLbs]);

  useEffect(() => {
    setIsValidated(false);
  }, [
    manualMateriasPrimas,
    manualCabecera.bodega,
    manualProductos,
    setIsValidated,
  ]);

  const handleValidateOrder = async () => {
    if (manualMateriasPrimas.length === 0) {
      toast.error("Debe agregar al menos una materia prima");
      return;
    }
    for (let i = 0; i < manualMateriasPrimas.length; i++) {
      const mp = manualMateriasPrimas[i];
      if (!mp.articulo) {
        toast.error(`Seleccione el artículo de materia prima en la fila ${i + 1}`);
        return;
      }
      if (!mp.cantidad || Number(mp.cantidad) <= 0) {
        toast.error(`Ingrese una cantidad de materia prima mayor a cero en la fila ${i + 1}`);
        return;
      }
    }

    setIsValidating(true);
    try {
      // 1. Validar la suma de libras de subproductos
      if (!isSubproductsWeightValid) {
        toast.error(
          `La suma de las libras de subproductos (${sumSubproductsLbs.toFixed(2)} lb) supera la cantidad de materia prima (${sumMateriasPrimasLbs.toFixed(2)} lb).`
        );
        setIsValidating(false);
        return;
      }

      // 1.1 Validar que la cantidad de materia prima sea mayor o igual a la suma de los productos resultantes
      if (!isTotalWeightValid) {
        toast.error(
          `La suma de libras de los productos resultantes (${sumAllOutputsLbs.toFixed(2)} lb) no puede ser mayor que la cantidad de materia prima (${sumMateriasPrimasLbs.toFixed(2)} lb).`
        );
        setIsValidating(false);
        return;
      }

      // 2. Validar existencia física en el backend para cada materia prima
      const bodega = manualCabecera.bodega || "01";
      for (const mp of manualMateriasPrimas) {
        const res = await fetch(
          `${API_BASE_URL}/existencia-bodega/${encodeURIComponent(
            mp.articulo
          )}/${encodeURIComponent(bodega)}`
        );

        let stock = 0;
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 0) {
            const data = JSON.parse(text);
            if (data) {
              stock = Number(data.cantDisponible || 0);
            }
          }
        }

        if (stock < Number(mp.cantidad)) {
          toast.error(
            `No hay suficiente existencia de la materia prima ${mp.articulo} (${mp.nombre || 'N/A'}) en la bodega seleccionada. Disponible: ${stock.toFixed(2)} lb, Requerido: ${Number(mp.cantidad).toFixed(2)} lb.`
          );
          setIsValidated(false);
          setIsValidating(false);
          return;
        }
      }

      setIsValidated(true);
      toast.success(
        `Validación exitosa. Materias primas disponibles y subproductos correctos.`
      );
    } catch (err) {
      console.error("Error al validar la orden de producción:", err);
      toast.error("Ocurrió un error al realizar la validación");
    } finally {
      setIsValidating(false);
    }
  };

  const isLbsUnit = (articuloCode: string) => {
    const art = articulos.find((a) => a.articulo === articuloCode) || articulosManualOutputs.find((a) => a.articulo === articuloCode);
    if (!art || !art.unidadAlmacen) return false;
    const unitUpper = art.unidadAlmacen.toUpperCase();
    if (unitUpper === 'LBS' || unitUpper === 'LB') return true;
    const match = unidadesMedida.find(u => u.unidadMedida?.toUpperCase() === unitUpper);
    if (match) {
      const descUpper = match.descripcion?.toUpperCase() || '';
      return descUpper.includes('LIBRA') || descUpper.includes('LBS') || descUpper.includes('LIBRAS');
    }
    return false;
  };

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

        const rateRes = await fetch(`${API_BASE_URL}/tipo-cambio-hist/ofic/latest`);
        if (rateRes.ok) {
          const data = await rateRes.json();
          if (data && data.monto) {
            setExchangeRate(Number(data.monto));
          }
        }
      } catch (err) {
        console.error("Error loading lookups in ExtractorTab", err);
      }
    }
    if (serverOnline) {
      loadLookups();
    }
  }, [serverOnline, API_BASE_URL]);

  // Sincronizar la bodega por defecto automáticamente cuando carguen desde la API o el estado inicial esté vacío
  useEffect(() => {
    if (bodegas.length > 0) {
      const exists = bodegas.some(b => b.bodega === manualCabecera.bodega);
      if (!exists) {
        setManualCabecera((prev: any) => ({
          ...prev,
          bodega: bodegas[0].bodega
        }));
      }
    }
  }, [bodegas, manualCabecera.bodega, setManualCabecera]);

  const allowedCuentas = useMemo(() => {
    if (!manualCabecera.centroCosto) return [];
    const matchedAccountCodes = centroCuentas
      .filter((rel) => rel.centroCosto === manualCabecera.centroCosto)
      .map((rel) => rel.cuentaContable);
    
    return cuentasContables.filter((acc) => matchedAccountCodes.includes(acc.cuentacontable));
  }, [manualCabecera.centroCosto, centroCuentas, cuentasContables]);

  const totalCostoMP = manualMateriasPrimas.reduce(
    (sum, mp) => sum + Number(mp.cantidad || 0) * Number(mp.costoUnitario || 0),
    0
  );
  const isCuadrado =
    dynamicManualCalculations &&
    Math.abs(dynamicManualCalculations.balance) < 0.05;

  const currentStep = manualMateriasPrimas.length === 0 || !manualMateriasPrimas[0]?.articulo
    ? 1
    : manualProductos.length === 0
      ? 2
      : !dynamicManualCalculations
        ? 2
        : isCuadrado
          ? 4
          : 3;

  const mainColors = [
    "#531424", // Dark Wine
    "#8c243e", // Deep Berry
    "#b83d5a", // Crimson Rose
    "#d96680", // Light Rose
    "#38000f", // Midnight Cherry
    "#752b49", // Dusty Rose
    "#9e5472"  // Muted Plum
  ];

  const mermaColors = [
    "#c9aa8f", // Rose Gold
    "#a68567", // Warm Bronze
    "#876343", // Caramel Brown
    "#e5ccb6", // Muted Cream
    "#cca178"  // Soft Gold
  ];

  let mainIndex = 0;
  let mermaIndex = 0;

  const distributionItems =
    dynamicManualCalculations?.productos
      .map((p, idx) => {
        const esMerma = !!manualProductos[idx]?.esMermaRecorte;
        let color = "";
        if (esMerma) {
          color = mermaColors[mermaIndex % mermaColors.length];
          mermaIndex++;
        } else {
          color = mainColors[mainIndex % mainColors.length];
          mainIndex++;
        }
        return {
          label:
            manualProductos[idx]?.nombre ||
            manualProductos[idx]?.articulo ||
            `Producto ${idx + 1}`,
          value: p.costoTotal,
          color,
        };
      })
      .filter((item) => item.value > 0) ?? [];

  const handleReset = () => {
    setManualCabecera({
      ...manualCabecera,
      fecha: new Date().toISOString().split("T")[0],
      referencia: "",
    });
    setManualMateriaPrima({
      articulo: "",
      nombre: "",
      cantidad: 0,
      costoUnitario: 0,
    });
    setManualMateriasPrimas([{
      articulo: "",
      nombre: "",
      cantidad: 0,
      costoUnitario: 0,
    }]);
    setManualProductos([]);
    handleApplyRecipeTemplate("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <Stepper
        currentStep={currentStep}
        steps={[
          { label: "Seleccionar Materia Prima" },
          { label: "Productos Resultantes" },
          { label: "Cálculo y Resumen" },
          { label: "Confirmar y Generar" },
        ]}
        className="rounded-xl border border-border bg-white px-4 py-5 shadow-[var(--shadow-card)] sm:px-6"
      />

      {/* Cabecera + Materia Prima */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="font-serif text-lg font-normal text-brand">
              {editingOrderId ? `1. Materia Prima - Editando Orden N° ${manualCabecera.numeroDocumento || editingOrderId}` : "1. Materia Prima (Documento de Consumo)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-brand-dark">
                Cargar Plantilla de Receta (Opcional)
              </Label>
              <SelectorRelacionalComboBox
                value={selectedRecipeTemplateId}
                onChange={(val) => handleApplyRecipeTemplate(String(val))}
                options={recipes}
                displayKey="descripcion"
                valueKey="id"
                placeholder="-- No aplicar plantilla (Vacío) --"
                formatOptionLabel={(r) => `${r.descripcion} (${r.articuloMateriaPrima})`}
                clearable={true}
              />
              <p className="text-xs text-slate-500">
                Seleccione una receta para auto-cargar la materia prima y las
                líneas de salida esperadas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Fecha Operativa</Label>
                <Input
                  type="date"
                  value={manualCabecera.fecha}
                  onChange={(e) =>
                    setManualCabecera({
                      ...manualCabecera,
                      fecha: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>N° Documento</Label>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Automático</span>
                    <Switch
                      checked={!!manualCabecera.useConsecutivo}
                      disabled={!!editingOrderId}
                      onCheckedChange={(val) =>
                        setManualCabecera({
                          ...manualCabecera,
                          useConsecutivo: val,
                          numeroDocumento: val ? '' : (manualCabecera.numeroDocumento || ''),
                        })
                      }
                    />
                  </div>
                </div>
                <Input
                  value={manualCabecera.useConsecutivo ? previewConsecutivo : (manualCabecera.numeroDocumento || '')}
                  onChange={(e) =>
                    setManualCabecera({
                      ...manualCabecera,
                      numeroDocumento: e.target.value,
                    })
                  }
                  disabled={manualCabecera.useConsecutivo || !!editingOrderId}
                  className={cn(
                    (manualCabecera.useConsecutivo || !!editingOrderId) && "bg-slate-100 font-mono cursor-not-allowed text-slate-500"
                  )}
                  placeholder={manualCabecera.useConsecutivo ? "Autogenerando..." : "Ej. OP-001"}
                />
              </div>
              <div className="space-y-2">
                <Label>Referencia</Label>
                <Input
                  value={manualCabecera.referencia}
                  onChange={(e) =>
                    setManualCabecera({
                      ...manualCabecera,
                      referencia: e.target.value,
                    })
                  }
                  placeholder="Ej. REF-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Bodega</Label>
                <NativeSelect
                  value={manualCabecera.bodega || "01"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualCabecera({
                      ...manualCabecera,
                      bodega: val,
                    });
                    setManualProductos(
                      manualProductos.map((p) => ({
                        ...p,
                        bodega: val,
                      }))
                    );
                  }}
                  required
                >
                  {bodegas.length > 0 ? (
                    bodegas.map((b) => (
                      <option key={b.bodega} value={b.bodega}>
                        {b.bodega} - {b.nombre}
                      </option>
                    ))
                  ) : (
                    <option value="01">01 - Bodega Principal</option>
                  )}
                </NativeSelect>
              </div>
            </div>



            <div className="flex items-center gap-2 mt-2 px-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-slate-500 font-medium">
                Tasa de cambio oficial: $1.00 USD = C$ {exchangeRate.toFixed(4)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-slate-50/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-700">
                  Materias Primas Consumidas (Insumos de Entrada)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddManualMPLine}
                  className="border-slate-200 text-brand hover:bg-brand/5 font-semibold h-8"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Agregar Materia Prima
                </Button>
              </div>

              <div className="space-y-4">
                {manualMateriasPrimas.map((mp, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm animate-in fade-in duration-200">
                    <div className="grid gap-4 lg:grid-cols-4">
                      <div className="space-y-2 lg:col-span-2">
                        <Label>Artículo Materia Prima</Label>
                        <SelectorRelacionalComboBox
                          label=""
                          value={mp.articulo}
                          onChange={(val) => {
                            const valStr = String(val);
                            handleManualMPLineChange(idx, { articulo: valStr });
                          }}
                          options={getSelectOptions(
                            mp.articulo,
                            articulosRecipesMP
                          )}
                          displayKey="descripcion"
                          valueKey="articulo"
                          placeholder="Buscar materia prima..."
                          formatOptionLabel={(item) => `${item.articulo} - ${item.descripcion}`}
                          onSearch={async (search) => {
                            if (serverOnline) {
                              const res = await fetch(
                                `${API_BASE_URL}/articulo?q=${encodeURIComponent(search)}&limit=50`
                              );
                              if (res.ok) {
                                const data = await res.json();
                                mergeToGlobalArticulos(data);
                                return data;
                              }
                            }
                            return [];
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Peso en Libras</Label>
                        <div className="relative">
                          <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            className="pl-9 pr-10"
                            value={mp.cantidad ?? ""}
                            onChange={(e) =>
                              handleManualMPLineChange(idx, { cantidad: e.target.value as any })
                            }
                            placeholder="0.00"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            lb
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Costo Unitario</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                              C$
                            </span>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              className="pl-9 bg-slate-50 cursor-not-allowed"
                              value={mp.costoUnitario ?? ""}
                              placeholder="0.00"
                              required
                              readOnly
                            />
                          </div>
                          {manualMateriasPrimas.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveManualMPLine(idx)}
                              className="h-9 w-9 p-0 flex items-center justify-center animate-in fade-in zoom-in-95 duration-150 mt-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <KpiCard
          label="Costo Total Materia Prima"
          value={`C$ ${totalCostoMP.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          variant="brand"
          className="h-fit xl:sticky xl:top-24"
        />
      </div>

      {/* Productos Resultantes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-4">
          <div className="space-y-1">
            <CardTitle className="font-serif text-lg font-normal text-brand">
              2. Productos Resultantes
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {sumSubproductsLbs > 0 && (
                <div
                  className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-md w-fit flex items-center gap-1.5",
                    isSubproductsWeightValid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                  )}
                >
                  {isSubproductsWeightValid ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  Subproductos: {sumSubproductsLbs.toFixed(2)} lb / {sumMateriasPrimasLbs.toFixed(2)} lb MP
                </div>
              )}
              {sumMateriasPrimasLbs > 0 && (
                <div
                  className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-md w-fit flex items-center gap-1.5",
                    isTotalWeightValid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                  )}
                >
                  {isTotalWeightValid ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  Balance de Libras: {sumAllOutputsLbs.toFixed(2)} lb / {sumMateriasPrimasLbs.toFixed(2)} lb MP
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setManualProductos([
                ...manualProductos,
                {
                  articulo: "",
                  nombre: "",
                  cantidadUnitaria: 0,
                  cantidadLibra: 0,
                  esMermaRecorte: false,
                  bodega: manualCabecera.bodega || "01",
                },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4">
            <SelectorRelacionalComboBox
              label=""
              value=""
              onChange={() => {}}
              options={articulosManualOutputs}
              displayKey="descripcion"
              valueKey="articulo"
              placeholder="Buscar productos resultantes..."
              formatOptionLabel={(item) => `${item.articulo} - ${item.descripcion}`}
              clearable={false}
              onSearch={async (search) => {
                if (serverOnline) {
                  const res = await fetch(
                    `${API_BASE_URL}/articulo?q=${encodeURIComponent(search)}&limit=50`
                  );
                  if (res.ok) {
                    const data = await res.json();
                    mergeToGlobalArticulos(data);
                    return data;
                  }
                }
                return [];
              }}
            />
          </div>

          {manualProductos.length === 0 ? (
            <EmptyState message='No hay productos cargados. Presione "Agregar Producto" o elija una plantilla de receta.' />
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-xs whitespace-normal p-2">Tipo</TableHead>
                    <TableHead className="w-24 text-xs whitespace-normal p-2">Código Artículo</TableHead>
                    <TableHead className="text-xs whitespace-normal p-2">Descripción</TableHead>
                    <TableHead className="w-28 text-xs whitespace-normal p-2">Bodega</TableHead>
                    <TableHead className="text-center text-xs whitespace-normal p-2">Cant. Unitaria</TableHead>
                    <TableHead className="text-center text-xs whitespace-normal p-2">Cant. Libra (lb)</TableHead>
                    <TableHead className="text-right text-xs whitespace-normal p-2">Factor Valuación</TableHead>
                    <TableHead className="text-right text-xs whitespace-normal p-2">Costo Asignado</TableHead>
                    <TableHead className="text-right text-xs whitespace-normal p-2">Asig. %</TableHead>
                    <TableHead className="w-12 p-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualProductos
                    .map((p, originalIdx) => ({ p, originalIdx }))
                    .sort((a, b) => {
                      if (a.p.esMermaRecorte && !b.p.esMermaRecorte) return 1;
                      if (!a.p.esMermaRecorte && b.p.esMermaRecorte) return -1;
                      return 0;
                    })
                    .map(({ p, originalIdx }) => {
                      const calcMatch = dynamicManualCalculations?.productos[originalIdx];
                      const factorObj = factors.find(
                        (f) => f.articulo === p.articulo
                      );
                      return (
                        <TableRow key={originalIdx}>
                          <TableCell className="w-16 whitespace-normal p-2">
                            <Badge
                              variant={p.esMermaRecorte ? "warning" : "success"}
                              className="text-[10px] px-1.5 py-0.5"
                            >
                              {p.esMermaRecorte ? "Merma" : "Producto"}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-24 p-2">
                            <NativeSelect
                              value={p.articulo}
                              className="w-full text-xs whitespace-normal h-8"
                              onChange={(e) => {
                                const val = e.target.value;
                                const art =
                                  articulos.find((a) => a.articulo === val) ||
                                  articulosManualOutputs.find(
                                    (a) => a.articulo === val
                                  );

                                let isSub = p.esMermaRecorte;
                                if (art) {
                                  isSub =
                                    art.clasificacion1
                                      ?.toLowerCase()
                                      .includes("sub") ||
                                    art.descripcion
                                      ?.toLowerCase()
                                      .includes("subproducto") ||
                                    art.articulo
                                      ?.toLowerCase()
                                      .startsWith("sub-") ||
                                    art.articulo
                                      ?.toLowerCase()
                                      .startsWith("mer-");
                                }

                                const copy = [...manualProductos];
                                const isLbsArt = isSub || isLbsUnit(val);
                                copy[originalIdx] = {
                                  ...copy[originalIdx],
                                  articulo: val,
                                  nombre: art ? art.descripcion : "",
                                  esMermaRecorte: !!isSub,
                                  cantidadUnitaria: isLbsArt ? 0 : copy[originalIdx].cantidadUnitaria,
                                };
                                setManualProductos(copy);
                              }}
                              required
                            >
                              <option value="">-- Seleccione --</option>
                              {getSelectOptions(
                                p.articulo,
                                articulosManualOutputs
                              ).map((art) => (
                                <option key={art.articulo} value={art.articulo}>
                                  {art.articulo}
                                </option>
                              ))}
                            </NativeSelect>
                          </TableCell>
                          <TableCell className="whitespace-normal break-words max-w-[150px] text-xs text-slate-700 p-2 leading-tight">
                            <div>
                              {p.nombre ||
                                articulos.find((a) => a.articulo === p.articulo)
                                  ?.descripcion ||
                                ""}
                            </div>
                            {(() => {
                              const art = articulos.find((a) => a.articulo === p.articulo) || articulosManualOutputs.find((a) => a.articulo === p.articulo);
                              if (art && art.unidadAlmacen) {
                                const match = unidadesMedida.find(u => u.unidadMedida?.toUpperCase() === art.unidadAlmacen.toUpperCase());
                                return (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    Unidad: {match ? match.descripcion : art.unidadAlmacen}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </TableCell>
                          <TableCell className="w-28 p-2">
                            <NativeSelect
                              value={p.bodega || manualCabecera.bodega || "01"}
                              className="w-full text-xs whitespace-normal h-8"
                              onChange={(e) => {
                                const val = e.target.value;
                                const copy = [...manualProductos];
                                copy[originalIdx] = {
                                  ...copy[originalIdx],
                                  bodega: val,
                                };
                                setManualProductos(copy);
                              }}
                              required
                            >
                              {bodegas.length > 0 ? (
                                bodegas.map((b) => (
                                  <option key={b.bodega} value={b.bodega}>
                                    {b.bodega} - {b.nombre}
                                  </option>
                                ))
                              ) : (
                                <option value="01">01 - Bodega Principal</option>
                              )}
                            </NativeSelect>
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            {isLbsUnit(p.articulo) ? (
                              <span className="text-slate-400 font-mono">—</span>
                            ) : (
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  step="any"
                                  className="w-16 text-center no-spin text-xs p-1 h-8"
                                  value={p.cantidadUnitaria ?? ""}
                                  onChange={(e) => {
                                    const copy = [...manualProductos];
                                    copy[originalIdx].cantidadUnitaria = e.target.value as any;
                                    setManualProductos(copy);
                                  }}
                                  min="0"
                                  required
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex justify-center">
                              <Input
                                type="number"
                                step="any"
                                className="w-16 text-center no-spin text-xs p-1 h-8"
                                value={p.cantidadLibra ?? ""}
                                onChange={(e) => {
                                  const copy = [...manualProductos];
                                  copy[originalIdx].cantidadLibra = e.target.value as any;
                                  setManualProductos(copy);
                                }}
                                min="0"
                                required
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs p-2">
                            {p.esMermaRecorte
                              ? factorObj
                                ? `${(factorObj.factor * 100).toFixed(0)}%`
                                : "20%"
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs p-2">
                            C${" "}
                            {calcMatch
                              ? calcMatch.costoTotal.toFixed(2)
                              : "0.00"}
                          </TableCell>
                          <TableCell className="text-right text-brand text-xs p-2">
                            {calcMatch ? Number(calcMatch.asignacionCosto).toFixed(2) : 0}%
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                              onClick={() => {
                                const copy = [...manualProductos];
                                copy.splice(originalIdx, 1);
                                setManualProductos(copy);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen del Cálculo */}
      {dynamicManualCalculations && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-4">
            <CardTitle className="font-serif text-lg font-normal text-brand">
              3. Resumen del Cálculo
            </CardTitle>
            {isCuadrado && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Cuadre Perfecto
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
             <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Libras Netas Principales"
                value={`${(
                  dynamicManualCalculations.totalLibrasMainProducts || 0
                ).toFixed(2)} lb`}
                icon={Scale}
              />
              <KpiCard
                label="Costo Total Mermas"
                value={`C$ ${dynamicManualCalculations.totalCostoSubproducts.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Package}
                variant="warning"
              />
              <KpiCard
                label="Nuevo Costo por Libra"
                value={`C$ ${dynamicManualCalculations.nuevoCostoLibraMain.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                variant="success"
              />
              <KpiCard
                label="Costo Total Distribuido"
                value={`C$ ${dynamicManualCalculations.sumCostoOutputs.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={CheckCircle2}
                variant={isCuadrado ? "success" : "warning"}
              />
            </div>

            {/* Estado del Cuadre Financiero (Ancho Completo) */}
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border px-5 py-4",
                isCuadrado
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              )}
            >
              <div className="flex items-center gap-3">
                {isCuadrado ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  Estado del Cuadre Financiero (Consumo vs Entrada)
                </span>
              </div>
              <strong
                className={cn(
                  "font-mono text-sm",
                  isCuadrado ? "text-emerald-700" : "text-red-700"
                )}
              >
                {isCuadrado
                  ? "Cuadre Perfecto — C$ 0.00"
                  : `Descuadre — C$ ${dynamicManualCalculations.balance.toFixed(4)}`}
              </strong>
            </div>

            {/* Layout de Gráfico y Métricas adicionales */}
            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              {/* Gráfico de Distribución con más espacio horizontal */}
              <div className="rounded-xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Distribución de Costos
                </p>
                <DistributionChart items={distributionItems} />
              </div>

              {/* Columna derecha con Merma y Costo Insumo apilados */}
              <div className="flex flex-col gap-4">
                <div className="flex-1 rounded-xl border border-border bg-slate-50/50 p-5 flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Merma Estimada
                  </p>
                  <p className="mt-2 font-mono text-xl font-bold text-amber-700">
                    {dynamicManualCalculations.mermaLibras.toFixed(2)} lb (
                    {dynamicManualCalculations.mermaPorcentaje.toFixed(1)}%)
                  </p>
                </div>
                <div className="flex-1 rounded-xl border border-border bg-slate-50/50 p-5 flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Costo Insumo MP
                  </p>
                  <p className="mt-2 font-mono text-xl font-bold text-brand">
                    C$ {dynamicManualCalculations.totalCostoMP.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-[var(--shadow-card)]">
        {!isValidated && (
          <p className="mr-auto text-xs font-medium text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 animate-bounce" />
            Debe validar la materia prima y subproductos antes de registrar en Softland.
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={editingOrderId && handleCancelEditOrder ? handleCancelEditOrder : handleReset}
        >
          {editingOrderId ? "Cancelar Edición" : "Cancelar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className={cn(
            isValidated && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200"
          )}
          onClick={handleValidateOrder}
          disabled={isValidating || manualMateriasPrimas.length === 0 || manualMateriasPrimas.some(mp => !mp.articulo || !mp.cantidad || Number(mp.cantidad) <= 0)}
        >
          {isValidating ? (
            "Validando..."
          ) : isValidated ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Validado
            </span>
          ) : (
            "Validar Materia Prima y Subproductos"
          )}
        </Button>
        <Button
          type="button"
          onClick={handleSaveManualOrder}
          disabled={!dynamicManualCalculations || !isCuadrado || !isValidated || isSaving}
        >
          {isSaving ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              {editingOrderId ? "Guardando..." : "Registrando..."}
            </span>
          ) : (
            <>
              {editingOrderId ? "Guardar Cambios" : "Procesar y Registrar en ERP (Softland)"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
