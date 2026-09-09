"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Hash,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Consecutivo {
  tipo: string;
  siguiente: number;
  mascara: string;
}

interface ConsecutivosTabProps {
  serverOnline: boolean;
  API_BASE_URL: string;
}

export function ConsecutivosTab({ serverOnline, API_BASE_URL }: ConsecutivosTabProps) {
  const [consecutivos, setConsecutivos] = useState<Consecutivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Consecutivo | null>(null);
  
  // Form states for Create/Edit
  const [tipo, setTipo] = useState("");
  const [siguiente, setSiguiente] = useState<number>(1);
  const [mascara, setMascara] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchConsecutivos = async () => {
    if (!serverOnline) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/consecutivo-app-consumo`);
      if (res.ok) {
        const data = await res.json();
        setConsecutivos(data);
      } else {
        toast.error("Error al cargar los consecutivos del servidor.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión al cargar consecutivos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsecutivos();
  }, [serverOnline, API_BASE_URL]);

  const handleStartEdit = (item: Consecutivo) => {
    setEditingItem(item);
    setTipo(item.tipo);
    setSiguiente(item.siguiente);
    setMascara(item.mascara);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setTipo("");
    setSiguiente(1);
    setMascara("");
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo || !mascara) {
      toast.error("Por favor complete todos los campos obligatorios.");
      return;
    }

    if (!editingItem) {
      const exists = consecutivos.some((c) => c.tipo === tipo);
      if (exists) {
        toast.error(`Ya existe un consecutivo configurado para el tipo "${tipo}".`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        tipo,
        siguiente: Number(siguiente),
        mascara
      };

      let res;
      if (editingItem) {
        // Update
        res = await fetch(`${API_BASE_URL}/consecutivo-app-consumo/${encodeURIComponent(editingItem.tipo)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        res = await fetch(`${API_BASE_URL}/consecutivo-app-consumo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        toast.success(editingItem ? "Consecutivo actualizado correctamente." : "Consecutivo creado correctamente.");
        handleCancel();
        fetchConsecutivos();
      } else {
        const txt = await res.text();
        let errorMsg = txt;
        try {
          const parsed = JSON.parse(txt);
          if (parsed.message) {
            errorMsg = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
          }
        } catch {}
        toast.error(`Error al guardar: ${errorMsg}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de red al intentar guardar.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemTipo: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar el consecutivo para "${itemTipo}"?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/consecutivo-app-consumo/${encodeURIComponent(itemTipo)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Consecutivo eliminado exitosamente.");
        fetchConsecutivos();
      } else {
        toast.error("Error al eliminar el consecutivo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de red al intentar eliminar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario de Configuración */}
        <Card className="lg:col-span-1 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-md flex items-center gap-2 text-slate-800">
              <Hash className="h-4 w-4 text-brand" />
              {isEditing ? "Editar Consecutivo" : "Nuevo Consecutivo"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Modifique los parámetros del consecutivo seleccionado."
                : "Defina un consecutivo para un nuevo tipo de documento."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tipo de Documento
                </Label>
                <NativeSelect
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  disabled={isEditing}
                  required
                  className="bg-white border-slate-200"
                >
                  <option value="">Seleccione un tipo...</option>
                  <option value="ORDEN_PRODUCCION">Orden de Producción (ORDEN_PRODUCCION)</option>
                  <option value="TRASLADO_INTERNO">Traslado Interno (TRASLADO_INTERNO)</option>
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mascara" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Máscara de Formato
                </Label>
                <Input
                  id="mascara"
                  value={mascara}
                  onChange={(e) => setMascara(e.target.value)}
                  placeholder="Ej: OP-###### o ######"
                  required
                  className="bg-white border-slate-200"
                />
                <div className="flex items-start gap-1.5 text-2xs text-slate-400 mt-1">
                  <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>Use el símbolo <b>#</b> para indicar los dígitos numéricos incrementales. El resto será prefijo literal.</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siguiente" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Siguiente Número Inicial
                </Label>
                <Input
                  id="siguiente"
                  type="number"
                  min="1"
                  value={siguiente}
                  onChange={(e) => setSiguiente(Number(e.target.value))}
                  required
                  className="bg-white border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Button type="submit" disabled={loading} className="w-full bg-brand text-white hover:bg-brand-hover">
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Actualizar" : "Crear Consecutivo"}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={handleCancel} className="border-slate-200 hover:bg-slate-50">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Listado de Consecutivos Existentes */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-md text-slate-800">Listado de Consecutivos</CardTitle>
              <CardDescription>Formatos registrados en la aplicación local.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchConsecutivos}
              disabled={loading}
              className="border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {consecutivos.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Hash className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No hay consecutivos registrados.</p>
                <p className="text-xs text-slate-400 mt-1">Defina un formato en el panel izquierdo.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/40">
                  <TableRow className="border-slate-100">
                    <TableHead className="font-bold text-slate-700">Tipo (ID)</TableHead>
                    <TableHead className="font-bold text-slate-700">Máscara</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Siguiente Valor</TableHead>
                    <TableHead className="w-[100px] text-right font-bold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consecutivos.map((item) => (
                    <TableRow key={item.tipo} className="hover:bg-slate-50/40 border-slate-100">
                      <TableCell className="font-mono font-medium text-xs text-slate-800">{item.tipo}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 bg-slate-50/20 px-2 py-1 rounded inline-block my-2 border border-slate-100">
                        {item.mascara}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-900 font-semibold">{item.siguiente}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(item)}
                            className="h-7 w-7 text-slate-500 hover:text-brand hover:bg-slate-50"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.tipo)}
                            className="h-7 w-7 text-slate-500 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
