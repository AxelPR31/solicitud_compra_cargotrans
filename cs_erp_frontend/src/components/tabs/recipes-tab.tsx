"use client";

import { useState, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Pencil, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SelectorRelacionalComboBox } from "@/components/ui/selector-relacional-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Articulo, RecetaEncabezado, RecetaDetalle, FactorValuacion } from "@/lib/types";

interface RecipesTabProps {
  recipes: RecetaEncabezado[];
  selectedRecipeId: number | null;
  setSelectedRecipeId: (id: number | null) => void;
  selectedRecipe: RecetaEncabezado | null;
  selectedRecipeDetailsList: RecetaDetalle[];
  factors: FactorValuacion[];
  editingRecipeId: number | null;
  newRecipeMPs: { articulo: string }[];
  handleMPLineChange: (index: number, val: string) => void;
  handleAddMPLine: () => void;
  handleRemoveMPLine: (index: number) => void;
  newRecipeDesc: string;
  setNewRecipeDesc: (v: string) => void;
  newRecipeOutputs: { articuloTerminado: string; esMermaRecorte: boolean }[];
  articulos: Articulo[];
  articulosRecipesMP: Articulo[];
  articulosRecipesOutputs: Articulo[];
  serverOnline: boolean;
  API_BASE_URL: string;
  getSelectOptions: (selectedValue: string, sourceList: Articulo[]) => Articulo[];
  mergeToGlobalArticulos: (list: Articulo[]) => void;
  setArticulosRecipesMP: (list: Articulo[]) => void;
  setArticulosRecipesOutputs: (list: Articulo[]) => void;
  handleStartEditRecipe: (recipe: RecetaEncabezado) => void;
  handleSaveRecipe: (e: React.FormEvent) => void;
  handleDeleteRecipe: (id: number) => void;
  handleAddOutputLine: () => void;
  handleRemoveOutputLine: (index: number) => void;
  handleOutputLineChange: (
    index: number,
    updates: Partial<{ articuloTerminado: string; esMermaRecorte: boolean }>
  ) => void;
  setEditingRecipeId: (id: number | null) => void;
  setNewRecipeOutputs: React.Dispatch<
    React.SetStateAction<{ articuloTerminado: string; esMermaRecorte: boolean }[]>
  >;
  handleCancelEditRecipe: () => void;
}

export function RecipesTab({
  recipes,
  selectedRecipeId,
  setSelectedRecipeId,
  selectedRecipe,
  selectedRecipeDetailsList,
  factors,
  editingRecipeId,
  newRecipeMPs,
  handleMPLineChange,
  handleAddMPLine,
  handleRemoveMPLine,
  newRecipeDesc,
  setNewRecipeDesc,
  newRecipeOutputs,
  articulos,
  articulosRecipesMP,
  articulosRecipesOutputs,
  serverOnline,
  API_BASE_URL,
  getSelectOptions,
  mergeToGlobalArticulos,
  setArticulosRecipesMP,
  setArticulosRecipesOutputs,
  handleStartEditRecipe,
  handleSaveRecipe,
  handleDeleteRecipe,
  handleAddOutputLine,
  handleRemoveOutputLine,
  handleOutputLineChange,
  setEditingRecipeId,
  setNewRecipeOutputs,
  handleCancelEditRecipe,
}: RecipesTabProps) {
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
    setNewRecipeOutputs((prev: { articuloTerminado: string; esMermaRecorte: boolean }[]) => {
      const existingCodes = new Set(prev.map(o => o.articuloTerminado).filter(Boolean));
      const filteredNew = selectedList.filter(art => !existingCodes.has(art.articulo));

      const newOutputs = filteredNew.map(art => {
        const isSub =
          art.clasificacion1?.toLowerCase().includes("sub") ||
          art.descripcion?.toLowerCase().includes("subproducto") ||
          art.articulo?.toLowerCase().startsWith("sub-") ||
          art.articulo?.toLowerCase().startsWith("mer-");

        return {
          articuloTerminado: art.articulo,
          esMermaRecorte: !!isSub
        };
      });

      const baseOutputs = prev.filter(o => o.articuloTerminado !== "");

      return [...baseOutputs, ...newOutputs];
    });
  };

  const handleConfirmCatalogSelection = () => {
    const selectedList = articulos.filter((art) => selectedCatalogArticles.has(art.articulo));
    handleAddArticlesBatch(selectedList);
    setIsCatalogModalOpen(false);
    setSelectedCatalogArticles(new Set());
    setCatalogSearchQuery("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Recetas Configuradas - Compact Horizontal List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-4">
          <CardTitle className="font-serif text-lg font-normal text-brand">
            Recetas Configuradas
          </CardTitle>
          <Badge variant="brand" className="text-xs">
            {recipes.length} recetas
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          {recipes.length === 0 ? (
            <EmptyState message="No hay recetas registradas." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recipes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRecipeId(r.id)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all duration-200 w-full",
                    selectedRecipeId === r.id
                      ? "border-brand bg-brand-muted/60 shadow-sm"
                      : "border-border bg-white hover:border-brand-light hover:bg-slate-50"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <p className="font-mono text-xs text-brand truncate">
                      {r.articuloMateriaPrima}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {r.estado}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-900 line-clamp-2">
                    {r.descripcion}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {selectedRecipe && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border pb-4">
              <div>
                <CardTitle>{selectedRecipe.descripcion}</CardTitle>
                {selectedRecipe.materiasPrimas && selectedRecipe.materiasPrimas.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1 items-center text-sm text-brand font-mono">
                    <span className="text-slate-500 font-sans">Materias Primas:</span>
                    {selectedRecipe.materiasPrimas.map((mp, idx) => (
                      <Badge key={idx} variant="outline" className="bg-brand/5 border-brand/20 text-brand text-xs">
                        {mp.articulo} {mp.nombre ? `- ${mp.nombre}` : ''}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 font-mono text-sm text-brand">
                    Materia Prima Principal: {selectedRecipe.articuloMateriaPrima}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleStartEditRecipe(selectedRecipe)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar Receta
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Borrar Receta
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedRecipeId(null)}
                >
                  Cerrar Detalles
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artículo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo de Producto</TableHead>
                      <TableHead>Factor Valuación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRecipeDetailsList.map((detail) => {
                      const factorObj = factors.find(
                        (f) => f.articulo === detail.articuloTerminado
                      );
                      const artObj = articulos.find(
                        (a) => a.articulo === detail.articuloTerminado
                      );
                      const desc = detail.descripcion || artObj?.descripcion || "";
                      return (
                        <TableRow key={detail.id}>
                          <TableCell className="font-mono font-semibold">
                            {detail.articuloTerminado}
                          </TableCell>
                          <TableCell className="font-medium text-slate-700">
                            {desc}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                detail.esMermaRecorte ? "warning" : "success"
                              }
                            >
                              {detail.esMermaRecorte
                                ? "Merma / Recorte"
                                : "Principal"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-brand">
                            {factorObj ? `${(factorObj.factor * 100).toFixed(0)}%` : ""}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card id="recipe-form-card">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="font-serif text-lg font-normal text-brand">
              {editingRecipeId
                ? "Editar Receta de Transformación"
                : "Nueva Receta de Transformación"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveRecipe} className="space-y-6">
              <div className="space-y-2">
                <Label>Nombre/Descripción Receta</Label>
                <Input
                  value={newRecipeDesc}
                  onChange={(e) => setNewRecipeDesc(e.target.value)}
                  placeholder="Ej. Transformación Filete de Res a Cortes"
                  required
                />
              </div>

              <div className="space-y-4 rounded-lg border border-border p-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <Label className="font-serif text-brand text-sm font-semibold">
                    Materias Primas (Insumos de Entrada)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMPLine}
                    className="border-slate-200 text-brand hover:bg-brand/5 font-semibold h-8"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Agregar Materia Prima
                  </Button>
                </div>

                <div className="space-y-3">
                  {newRecipeMPs.map((mp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white p-3 rounded-md border border-slate-100"
                    >
                      <div className="flex-1">
                        <SelectorRelacionalComboBox
                          label=""
                          value={mp.articulo}
                          onChange={(val) => {
                            const valStr = String(val);
                            handleMPLineChange(idx, valStr);
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
                      {newRecipeMPs.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMPLine(idx)}
                          className="h-9 w-9 p-0 flex items-center justify-center animate-in fade-in zoom-in-95 duration-150"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Productos Resultantes Esperados</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCatalogModalOpen(true)}
                      className="border-slate-200 text-brand hover:bg-brand/5 font-semibold"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Agregar por Catálogo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOutputLine}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {newRecipeOutputs.map((output, idx) => (
                    <div
                      key={idx}
                      className="grid gap-3 rounded-lg border border-border bg-slate-50/50 p-4 md:grid-cols-2 md:items-center"
                    >
                      <SelectorRelacionalComboBox
                        label=""
                        value={output.articuloTerminado}
                        onChange={(val) => {
                          const valStr = String(val);
                          const art =
                            articulos.find((a) => a.articulo === valStr) ||
                            articulosRecipesOutputs.find(
                              (a) => a.articulo === valStr
                            );
                          let isSub = false;
                          if (art) {
                            isSub =
                              art.clasificacion1?.toLowerCase().includes("sub") ||
                              art.descripcion
                                ?.toLowerCase()
                                .includes("subproducto") ||
                              art.articulo?.toLowerCase().startsWith("sub-") ||
                              art.articulo?.toLowerCase().startsWith("mer-");
                          }
                          handleOutputLineChange(idx, {
                            articuloTerminado: valStr,
                            esMermaRecorte: !!isSub,
                          });
                        }}
                        options={getSelectOptions(
                          output.articuloTerminado,
                          articulosRecipesOutputs
                        )}
                        displayKey="descripcion"
                        valueKey="articulo"
                        placeholder="Buscar producto resultante..."
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
                      <div className="flex items-center justify-between gap-4">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                          <Checkbox
                            checked={output.esMermaRecorte}
                            onCheckedChange={(checked) =>
                              handleOutputLineChange(idx, {
                                esMermaRecorte: checked === true,
                              })
                            }
                          />
                          ¿Es Merma o Recorte?
                        </label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveOutputLine(idx)}
                        >
                          <X className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                <Button type="submit">
                  {editingRecipeId ? "Guardar Cambios" : "Guardar Receta"}
                </Button>
                {editingRecipeId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEditRecipe}
                  >
                    Cancelar Edición
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

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
                  <h3 className="font-serif text-lg font-normal text-brand">Catálogo de Productos Resultantes</h3>
                  <button 
                    type="button"
                    onClick={() => setIsCatalogModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
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
