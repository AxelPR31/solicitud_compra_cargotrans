"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Eye,
  Scale,
  Package,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Search,
  ArrowLeft,
  ExternalLink,
  Tag,
  FileText,
  FileSpreadsheet,
  Edit,
  Coins,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { DistributionChart } from "@/components/ui/distribution-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface OrdenProduccionVinculo {
  id: number;
  documentoConsumo: string | null;
  documentoEntrada: string | null;
  fecha: string | Date;
  totalLibras: number;
  totalCosto: number;
  materiaPrima?: string;
  materiaPrimaNombre?: string;
  pesoMateriaPrima?: number;
  costoUnitarioMateriaPrima?: number;
  elaboradoPor?: string;
  mermaLibras?: number;
  mermaPorcentaje?: number;
  numeroDocumento?: string;
  referencia?: string | null;
  bodega?: string;
  editable?: boolean;
  materiasPrimas?: {
    id?: number;
    vinculoId?: number;
    articulo: string;
    nombre?: string;
    cantidad: number;
    costoUnitario: number;
    costoTotal?: number;
  }[];
  detalles?: {
    id: number;
    articulo: string;
    nombre?: string;
    cantidadUnitaria: number;
    cantidadLibra: number;
    nuevoCostoUnitario: number;
    nuevoCostoLibra: number;
    costoTotal: number;
    asignacionCosto: number;
    esMermaRecorte: boolean;
    bodega?: string;
  }[];
}

interface HistoryTabProps {
  serverOnline: boolean;
  API_BASE_URL: string;
  onEditOrder?: (order: OrdenProduccionVinculo) => void;
}

export function HistoryTab({ serverOnline, API_BASE_URL, onEditOrder }: HistoryTabProps) {
  const [orders, setOrders] = useState<OrdenProduccionVinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrdenProduccionVinculo | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orden-produccion-vinculo?limit=5000`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        toast.error("Error al obtener el historial de órdenes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [API_BASE_URL]);

  const viewOrderDetails = async (id: number) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orden-produccion-vinculo/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
      } else {
        toast.error("No se pudo obtener el detalle de la orden");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEditOrderById = async (id: number) => {
    if (!onEditOrder) return;
    const loadingToast = toast.loading("Cargando detalles de la orden...");
    try {
      const res = await fetch(`${API_BASE_URL}/orden-produccion-vinculo/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.editable === false) {
          toast.error("No se puede editar esta orden porque el documento ya fue aprobado/aplicado o eliminado en Softland.", { id: loadingToast });
          fetchOrders();
          return;
        }
        toast.dismiss(loadingToast);
        onEditOrder(data);
      } else {
        toast.error("No se pudo obtener el detalle de la orden", { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión", { id: loadingToast });
    }
  };

  const deleteOrder = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar esta orden de producción del sistema?")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/orden-produccion-vinculo/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Orden de producción eliminada correctamente");
        setOrders(orders.filter((o) => o.id !== id));
        if (selectedOrder?.id === id) {
          setSelectedOrder(null);
        }
      } else {
        toast.error("Error al eliminar la orden");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    }
  };

  // Sort orders list by date descending (newest first)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.fecha).getTime();
    const dateB = new Date(b.fecha).getTime();
    if (dateB !== dateA) {
      return dateB - dateA;
    }
    return b.id - a.id;
  });

  // Filter orders list
  const filteredOrders = sortedOrders.filter((o) => {
    const term = searchTerm.toLowerCase();

    // Date filter matching
    if (startDate) {
      const sDate = new Date(startDate + "T00:00:00");
      const oDate = new Date(o.fecha);
      sDate.setHours(0, 0, 0, 0);
      oDate.setHours(0, 0, 0, 0);
      if (oDate < sDate) return false;
    }
    
    if (endDate) {
      const eDate = new Date(endDate + "T23:59:59");
      const oDate = new Date(o.fecha);
      eDate.setHours(23, 59, 59, 999);
      oDate.setHours(0, 0, 0, 0);
      if (oDate > eDate) return false;
    }

    return (
      o.id.toString().includes(term) ||
      (o.documentoConsumo || "").toLowerCase().includes(term) ||
      (o.documentoEntrada || "").toLowerCase().includes(term) ||
      (o.materiaPrima && o.materiaPrima.toLowerCase().includes(term)) ||
      (o.materiaPrimaNombre && o.materiaPrimaNombre.toLowerCase().includes(term)) ||
      (o.numeroDocumento && o.numeroDocumento.toLowerCase().includes(term)) ||
      (o.materiasPrimas && o.materiasPrimas.some(mp => 
        mp.articulo.toLowerCase().includes(term) || 
        (mp.nombre && mp.nombre.toLowerCase().includes(term))
      ))
    );
  });

  // Pagination calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, activePage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (selectedOrder) {
    // Calculamos distribución de costos
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

    const distributionItems = (selectedOrder.detalles || [])
      .map((d) => {
        let color = "";
        if (d.esMermaRecorte) {
          color = mermaColors[mermaIndex % mermaColors.length];
          mermaIndex++;
        } else {
          color = mainColors[mainIndex % mainColors.length];
          mainIndex++;
        }
        return {
          label: `${d.articulo} - ${d.nombre || ""}`,
          value: Number(d.costoTotal || 0),
          color
        };
      })
      .filter((item) => item.value > 0);

    // Ordenamos detalles: Mermas al final
    const sortedDetalles = [...(selectedOrder.detalles || [])].sort((a, b) => {
      if (a.esMermaRecorte && !b.esMermaRecorte) return 1;
      if (!a.esMermaRecorte && b.esMermaRecorte) return -1;
      return 0;
    });

    const formattedDate = new Date(selectedOrder.fecha).toLocaleDateString("es-NI", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const mermaLibras = selectedOrder.mermaLibras || 0;
    const mermaPorcentaje = selectedOrder.mermaPorcentaje || 0;
    const totalCostoMP = selectedOrder.totalCosto || 0;
    const totalCostoSubproducts = (selectedOrder.detalles || [])
      .filter(d => d.esMermaRecorte)
      .reduce((sum, d) => sum + Number(d.costoTotal || 0), 0);

    const totalLibrasMainProducts = (selectedOrder.detalles || [])
      .filter(d => !d.esMermaRecorte)
      .reduce((sum, d) => sum + Number(d.cantidadLibra || 0), 0);

    const nuevoCostoLibraMain = totalLibrasMainProducts > 0
      ? (totalCostoMP - totalCostoSubproducts) / totalLibrasMainProducts
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrder(null)}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Historial
            </Button>
            <h2 className="font-serif text-lg font-normal text-brand">
              Detalle de la Orden #{selectedOrder.numeroDocumento || selectedOrder.id}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onEditOrder && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 border-brand text-brand hover:bg-brand/5 hover:text-brand"
                onClick={() => onEditOrder(selectedOrder)}
              >
                <Edit className="h-4 w-4" />
                Editar Orden
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              onClick={() => window.open(`${API_BASE_URL}/reportes/orden-produccion/${selectedOrder.id}/excel`, '_blank')}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 border-red-600 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => window.open(`${API_BASE_URL}/reportes/orden-produccion/${selectedOrder.id}/pdf`, '_blank')}
            >
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Encabezado e información general */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 font-serif text-base font-normal text-slate-800">
                <Calendar className="h-5 w-5 text-slate-500" />
                Información de la Orden
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Doc. Softland: {selectedOrder.documentoConsumo}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fecha Registro</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{formattedDate}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Materia Prima</p>
                <div className="mt-1 text-sm font-bold text-brand">
                  {selectedOrder.materiasPrimas && selectedOrder.materiasPrimas.length > 1 ? (
                    <div>
                      <span>Varios ({selectedOrder.materiasPrimas.length})</span>
                      <span className="block text-xs font-normal text-slate-500">Ver tabla de desglose abajo</span>
                    </div>
                  ) : (
                    <div>
                      {selectedOrder.materiaPrima}
                      {selectedOrder.materiaPrimaNombre && (
                        <span className="block text-xs font-normal text-slate-500">{selectedOrder.materiaPrimaNombre}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bodega Origen</p>
                <p className="mt-1 text-sm font-medium text-slate-700 font-mono">{selectedOrder.bodega || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Referencia</p>
                <p className="mt-1 text-sm font-medium text-slate-700 break-words">
                  {selectedOrder.referencia || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Número de Documento</p>
                <p className="mt-1 text-sm font-medium text-slate-700 font-mono">{selectedOrder.numeroDocumento || "N/D"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Peso Consumido</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{(selectedOrder.pesoMateriaPrima || 0).toFixed(2)} lb</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registrado Por</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{selectedOrder.elaboradoPor || "N/D"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen del cálculo (KPI Cards) */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Libras Netas Principales"
            value={`${totalLibrasMainProducts.toFixed(2)} lb`}
            icon={Scale}
          />
          <KpiCard
            label="Costo Total Mermas"
            value={`C$ ${totalCostoSubproducts.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={Package}
            variant="warning"
          />
          <KpiCard
            label="Nuevo Costo por Libra"
            value={`C$ ${nuevoCostoLibraMain.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={Coins}
            variant="success"
          />
          <KpiCard
            label="Costo Total Distribuido"
            value={`C$ ${totalCostoMP.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={CheckCircle2}
            variant="success"
          />
        </div>

        {/* Gráfico y Métricas secundarias */}
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Distribución de Costos
            </p>
            <DistributionChart items={distributionItems} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-xl border border-border bg-slate-50/50 p-5 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Merma Estimada
              </p>
              <p className="mt-2 font-mono text-xl font-bold text-amber-700">
                {mermaLibras.toFixed(2)} lb ({mermaPorcentaje.toFixed(1)}%)
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-border bg-slate-50/50 p-5 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Costo Insumo MP
              </p>
              <p className="mt-2 font-mono text-xl font-bold text-brand">
                C$ {totalCostoMP.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Detalle de las Materias Primas Consumidas */}
        {selectedOrder.materiasPrimas && selectedOrder.materiasPrimas.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-serif text-base font-normal text-brand">
                Desglose de Materias Primas Consumidas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código Artículo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Peso (lb)</TableHead>
                      <TableHead className="text-right">Costo Unitario</TableHead>
                      <TableHead className="text-right">Costo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.materiasPrimas.map((mp, index) => (
                      <TableRow key={mp.id || index}>
                        <TableCell className="font-medium text-slate-900">{mp.articulo}</TableCell>
                        <TableCell className="text-slate-700">{mp.nombre || "N/A"}</TableCell>
                        <TableCell className="text-right font-mono">{Number(mp.cantidad || 0).toFixed(2)} lb</TableCell>
                        <TableCell className="text-right font-mono">C$ {Number(mp.costoUnitario || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          C$ {Number(mp.costoTotal || (mp.cantidad * mp.costoUnitario) || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalle de las Líneas Producidas */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="font-serif text-base font-normal text-brand">
              Desglose de Líneas de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Código Artículo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Bodega</TableHead>
                    <TableHead className="text-right">Cant. Unitaria</TableHead>
                    <TableHead className="text-right">Cant. Libra (lb)</TableHead>
                    <TableHead className="text-right">Costo / Libra</TableHead>
                    <TableHead className="text-right">Costo Unitario</TableHead>
                    <TableHead className="text-right">Costo Asignado</TableHead>
                    <TableHead className="text-right">Asig. %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDetalles.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge variant={d.esMermaRecorte ? "warning" : "success"}>
                          {d.esMermaRecorte ? "Merma" : "Producto"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{d.articulo}</TableCell>
                      <TableCell className="text-slate-700">{d.nombre || "N/A"}</TableCell>
                      <TableCell className="font-mono text-xs">{d.bodega || "—"}</TableCell>
                      <TableCell className="text-right font-mono">{d.cantidadUnitaria || "—"}</TableCell>
                      <TableCell className="text-right font-mono">{d.cantidadLibra.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">C$ {d.nuevoCostoLibra.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {d.nuevoCostoUnitario ? `C$ ${d.nuevoCostoUnitario.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">C$ {d.costoTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-brand font-medium">
                        {(d.asignacionCosto || 0).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-card)]">
        {/* Barra de Búsqueda y Filtros de Fecha */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por código, doc o ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Desde:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-36 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Hasta:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-36 text-xs h-9"
            />
          </div>

          {(startDate || endDate || searchTerm) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="text-xs text-slate-500 hover:text-brand h-9"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
        <Button onClick={fetchOrders} size="sm" variant="outline">
          Actualizar Historial
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="font-serif text-lg font-normal text-brand">
            Historial de Órdenes Realizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500">
              Cargando historial de órdenes...
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState message="No se encontraron órdenes de producción registradas." />
          ) : (
            <>
              <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Materia Prima</TableHead>
                    <TableHead>Doc. Softland</TableHead>
                    <TableHead>N° Documento</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Peso Total (lb)</TableHead>
                    <TableHead className="text-right">Costo Total</TableHead>
                    <TableHead className="w-24 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((o) => {
                    const orderDate = new Date(o.fecha).toLocaleDateString("es-NI", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit"
                    });
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="text-slate-600">{orderDate}</TableCell>
                        <TableCell className="align-top py-3" title={o.materiaPrimaNombre}>
                          {o.materiasPrimas && o.materiasPrimas.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {o.materiasPrimas.map((mp, index) => (
                                <div key={mp.id || index} className="text-left leading-normal border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                                  <span className="font-semibold text-brand text-xs block">{mp.articulo}</span>
                                  {mp.nombre && (
                                    <span className="block text-[11px] font-normal text-slate-500 leading-tight">{mp.nombre}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-left">
                              <span className="font-semibold text-brand text-xs block">{o.materiaPrima || "N/A"}</span>
                              {o.materiaPrimaNombre && (
                                <span className="block text-[11px] font-normal text-slate-500 leading-tight">{o.materiaPrimaNombre}</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{o.documentoConsumo}</TableCell>
                        <TableCell className="font-mono text-xs">{o.numeroDocumento || "N/D"}</TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-[220px] whitespace-normal break-words" title={o.referencia || ""}>
                          {o.referencia || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">{(o.totalLibras || 0).toFixed(2)} lb</TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          C$ {(o.totalCosto || 0).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-brand"
                              onClick={() => viewOrderDetails(o.id)}
                              title="Ver Detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {onEditOrder && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:text-brand"
                                onClick={() => handleEditOrderById(o.id)}
                                title="Editar Orden"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                              onClick={() => deleteOrder(o.id)}
                              title="Eliminar Orden"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Controles de Paginación */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
              <div className="text-xs text-slate-500">
                Mostrando del{" "}
                <span className="font-semibold text-slate-700">
                  {totalItems === 0 ? 0 : startIndex + 1}
                </span>{" "}
                al{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(startIndex + itemsPerPage, totalItems)}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-slate-700">{totalItems}</span>{" "}
                órdenes
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {/* Selector de registros por página */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Registros por página:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Botones de navegación */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)}
                    disabled={activePage === 1}
                    title="Primera página"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={activePage === 1}
                    title="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      type="button"
                      variant={activePage === pageNum ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 text-xs font-semibold ${
                        activePage === pageNum
                          ? "bg-brand text-white hover:bg-brand/90"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={activePage === totalPages}
                    title="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={activePage === totalPages}
                    title="Última página"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
        </CardContent>
      </Card>
    </motion.div>

    {loadingDetails && (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/45 backdrop-blur-sm transition-opacity duration-300">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-2xl border border-slate-100/80 animate-in fade-in zoom-in-95 duration-200">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-700">Cargando detalles de la orden...</p>
        </div>
      </div>
    )}
  </>
  );
}
