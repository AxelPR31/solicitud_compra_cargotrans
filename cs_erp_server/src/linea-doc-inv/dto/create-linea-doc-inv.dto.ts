export class CreateLineaDocInvDto {
  paqueteInventario: string
  documentoInv: string
  lineaDocInv: number
  ajusteConfig: string
  nit: string
  articulo: string
  bodega: string
  localizacion: string
  lote: string
  tipo: string
  subtipo: string
  subsubtipo: string
  cantidad: number
  costoTotalLocal: number
  costoTotalDolar: number
  precioTotalLocal: number
  precioTotalDolar: number
  bodegaDestino: string
  centroCosto: string
  cuentaContable: string
  costoTotalLocalComp: number
  costoTotalDolarComp: number
}
