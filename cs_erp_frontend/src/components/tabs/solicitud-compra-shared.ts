import type { Articulo } from "@/lib/types";

/** Centro de costo en líneas del formulario. */
export const CS_LINEAS_CENTRO_COSTO_HABILITADO = true;

/** Cuenta contable en líneas (desactivado: siempre null al guardar). */
export const CS_LINEAS_CUENTA_CONTABLE_HABILITADO = false;

/** Placa, chasis, marca y modelo en el encabezado. Poner en false para ocultarlos. */
export const CS_ENCABEZADO_VEHICULO_HABILITADO = true;

/** @deprecated Usar CS_LINEAS_CENTRO_COSTO_HABILITADO / CS_LINEAS_CUENTA_CONTABLE_HABILITADO */
export const CS_LINEAS_CENTRO_CUENTA_HABILITADO =
  CS_LINEAS_CENTRO_COSTO_HABILITADO || CS_LINEAS_CUENTA_CONTABLE_HABILITADO;

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
  especificacion: string;
  centroCosto: string;
  cuentaContable: string;
  fechaRequerida: string;
}
