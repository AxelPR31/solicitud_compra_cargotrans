import { IsIn, IsOptional } from 'class-validator'
import { CreateSolicitudOcLineaDto } from './create-solicitud-oc.dto'
import {
  PRIORIDAD_SOLICITUD_OC_VALUES,
  PrioridadSolicitudOc,
} from '../types/prioridad-solicitud-oc.type'

export class UpdateSolicitudOcDto {
  departamento?: string
  fechaSolicitud?: Date | string
  fechaRequerida?: Date | string
  @IsOptional()
  @IsIn(PRIORIDAD_SOLICITUD_OC_VALUES)
  prioridad?: PrioridadSolicitudOc
  comentario?: string
  rubro1?: string
  rubro2?: string
  rubro3?: string
  rubro4?: string
  rubro5?: string
  placa?: string
  chasis?: string
  marca?: string
  modelo?: string
  lineas?: CreateSolicitudOcLineaDto[]
}
