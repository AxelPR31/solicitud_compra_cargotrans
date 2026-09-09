import { CreateSolicitudOcLineaDto } from './create-solicitud-oc.dto'

export class UpdateSolicitudOcDto {
  departamento?: string
  fechaSolicitud?: Date | string
  fechaRequerida?: Date | string
  prioridad?: string
  comentario?: string
  rubro1?: string
  rubro2?: string
  rubro3?: string
  rubro4?: string
  rubro5?: string
  lineas?: CreateSolicitudOcLineaDto[]
}
