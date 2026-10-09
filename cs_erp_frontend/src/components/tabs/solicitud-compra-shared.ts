import type { Articulo } from "@/lib/types";

/** Centro de costo en líneas del formulario. */
export const CS_LINEAS_CENTRO_COSTO_HABILITADO = true;

/** Cuenta contable en líneas (desactivado: siempre null al guardar). */
export const CS_LINEAS_CUENTA_CONTABLE_HABILITADO = false;

/** Placa, chasis, marca y modelo en el encabezado. Poner en false para ocultarlos. */
export const CS_ENCABEZADO_VEHICULO_HABILITADO = false;

/** Solo artículos cuyo código empieza con este prefijo en selectores de solicitud. */
export const CS_ARTICULO_CODIGO_PREFIJO = "ITEM";

export const articuloAptoParaSolicitudCompra = (codigo: string) =>
  codigo.trim().toUpperCase().startsWith(CS_ARTICULO_CODIGO_PREFIJO);

export const filterArticulosSolicitudCompra = <T extends { articulo: string }>(
  list: T[],
): T[] => list.filter((a) => articuloAptoParaSolicitudCompra(a.articulo));

export const buildArticuloSolicitudQuery = (params: {
  limit?: number;
  q?: string;
}) => {
  const search = new URLSearchParams();
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.q?.trim()) search.set("q", params.q.trim());
  search.set("prefix", CS_ARTICULO_CODIGO_PREFIJO);
  return search.toString();
};

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
