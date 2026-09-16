import type { Articulo } from "@/lib/types";

/** Centro de costo y cuenta contable en líneas: desactivado → se envían null al guardar. */
export const CS_LINEAS_CENTRO_CUENTA_HABILITADO = false;

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
