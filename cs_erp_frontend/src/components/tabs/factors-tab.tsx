"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SelectorRelacionalComboBox } from "@/components/ui/selector-relacional-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { Articulo, FactorValuacion } from "@/lib/types";
import { toast } from "sonner";

interface FactorsTabProps {
  factors: FactorValuacion[];
  newFactorArticulo: string;
  setNewFactorArticulo: (v: string) => void;
  newFactorValue: number;
  setNewFactorValue: (v: number) => void;
  articulosFactors: Articulo[];
  serverOnline: boolean;
  API_BASE_URL: string;
  getSelectOptions: (selectedValue: string, sourceList: Articulo[]) => Articulo[];
  setArticulosFactors: (list: Articulo[]) => void;
  mergeToGlobalArticulos: (list: Articulo[]) => void;
  handleCreateFactor: (e: React.FormEvent) => void;
  handleDeleteFactor: (articulo: string) => void;
  handleUpdateFactor: (articulo: string, newFactor: number) => Promise<void>;
}

export function FactorsTab({
  factors,
  newFactorArticulo,
  setNewFactorArticulo,
  newFactorValue,
  setNewFactorValue,
  articulosFactors,
  serverOnline,
  API_BASE_URL,
  getSelectOptions,
  setArticulosFactors,
  mergeToGlobalArticulos,
  handleCreateFactor,
  handleDeleteFactor,
  handleUpdateFactor,
}: FactorsTabProps) {
  const [editingArticulo, setEditingArticulo] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]"
    >
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="font-serif text-lg font-normal text-brand">
            Factores de Sobrantes Configurados
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {factors.length === 0 ? (
            <EmptyState message="No hay factores registrados." />
          ) : (
            <div className="space-y-2">
              {factors.map((f) => {
                const isEditing = editingArticulo === f.articulo;
                return (
                  <div
                    key={f.articulo}
                    className="flex items-center justify-between rounded-lg border border-border bg-white p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {f.articulo}
                      </p>
                      <p className="text-xs text-slate-500">
                        {f.descripcion || 'Multiplicador de Costo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            max="1"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="w-20 text-center text-xs p-1 h-8"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              const val = Number(editingValue);
                              if (isNaN(val) || val < 0 || val > 1) {
                                toast.error("El factor debe ser un número entre 0 y 1");
                                return;
                              }
                              await handleUpdateFactor(f.articulo, val);
                              setEditingArticulo(null);
                            }}
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingArticulo(null)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Badge variant="warning" className="font-mono text-sm">
                            {(f.factor * 100).toFixed(0)}% (x{f.factor.toFixed(2)})
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingArticulo(f.articulo);
                              setEditingValue(String(f.factor));
                            }}
                            className="h-8 w-8 text-slate-400 hover:text-brand hover:bg-slate-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFactor(f.articulo)}
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="font-serif text-lg font-normal text-brand">
            Definir Factor de Valuación
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateFactor} className="space-y-5">
            <div className="space-y-2">
              <Label>
                Código Subproducto (Ej: Pellejo / Grasa / Hueso)
              </Label>
              <SelectorRelacionalComboBox
                label=""
                value={newFactorArticulo}
                onChange={(val) => setNewFactorArticulo(String(val))}
                options={articulosFactors}
                displayKey="descripcion"
                valueKey="articulo"
                placeholder="Buscar subproducto por código o descripción..."
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
              <Label>Porcentaje / Factor de Costo a Asignar</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={newFactorValue}
                onChange={(e) => setNewFactorValue(Number(e.target.value))}
                required
              />
              <p className="text-xs leading-relaxed text-slate-500">
                Indique un valor decimal entre 0 y 1. Un factor de 0.20
                significa que se valorará al 20% del costo por libra de la
                materia prima principal.
              </p>
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Guardar Factor
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
