import type { Articulo } from "@/lib/types";

export interface SolicitudCompraTabBaseProps {
  articulos: Articulo[];
  serverOnline: boolean;
  API_BASE_URL: string;
  user: { usuario?: string } | null;
  getSelectOptions: (selectedValue: string, sourceList: Articulo[]) => Articulo[];
  mergeToGlobalArticulos: (list: Articulo[]) => void;
}

export interface LineaForm {
  articulo: string;
  descripcion: string;
  cantidad: number;
  comentario: string;
  centroCosto: string;
  cuentaContable: string;
  fechaRequerida: string;
}
