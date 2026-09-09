import { IsIn, IsOptional } from 'class-validator'
import {
  PRIORIDAD_SOLICITUD_OC_VALUES,
  PrioridadSolicitudOc,
} from '../types/prioridad-solicitud-oc.type'

export class CreateSolicitudOcLineaDto {
  articulo: string
  descripcion?: string
  cantidad: number
  comentario?: string
  fechaRequerida?: Date | string
  centroCosto?: string
  cuentaContable?: string
  fase?: string
  proyecto?: string
}

export class CreateSolicitudOcDto {
  departamento: string
  fechaSolicitud?: Date | string
  fechaRequerida: Date | string
  @IsOptional()
  @IsIn(PRIORIDAD_SOLICITUD_OC_VALUES)
  prioridad?: PrioridadSolicitudOc
  comentario?: string
  usuario?: string
  rubro1?: string
  rubro2?: string
  rubro3?: string
  rubro4?: string
  rubro5?: string
  lineas: CreateSolicitudOcLineaDto[]
}
