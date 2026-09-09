export class CreateExistenciaBodegaDto {
  articulo: string
  bodega: string
  existenciaMinima?: number
  existenciaMaxima?: number
  cantDisponible?: number
  cantReservada?: number
  cantNoAprobada?: number
  cantVencida?: number
  cantTransito?: number
  cantProduccion?: number
  cantPedida?: number
  cantRemitida?: number
  costoUntPromedioLoc?: number
  costoUntPromedioDol?: number
  costoUntEstandarLoc?: number
  costoUntEstandarDol?: number
}
