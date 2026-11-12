"use client"

import { useId, useMemo, useState } from "react"
import { ChevronDown, Loader2, Search, Shield } from "lucide-react"
import { toast } from "sonner"
import { usePermisosAdmin } from "@/lib/permisos/use-permisos"
import type { PermisoMatrixFieldKey, PermisoUsuarioRow } from "@/lib/permisos/types"
import {
  PERMISO_MATRIX_COLUMNS,
  confirmCopyForChange,
  matrixFieldChecked,
  matrixFieldDisabled,
  permisoForMatrixField,
  type PendingPermisoChange,
} from "@/lib/permisos/matrix-ui"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const MATRIX_GRID =
  "grid grid-cols-[minmax(11rem,1.2fr)_repeat(4,minmax(6.75rem,1fr))] gap-2 sm:gap-3"

interface PermisosConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PermisosConfigDialog({ open, onOpenChange }: PermisosConfigDialogProps) {
  const searchId = useId()
  const [filter, setFilter] = useState("")
  const [pending, setPending] = useState<PendingPermisoChange | null>(null)

  const { matrixQuery, setMutation } = usePermisosAdmin(open)
  const items = matrixQuery.data?.items ?? []

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (row) =>
        row.usuario.toLowerCase().includes(q) || row.nombre.toLowerCase().includes(q),
    )
  }, [filter, items])

  const requestToggle = (
    row: PermisoUsuarioRow,
    field: PermisoMatrixFieldKey,
    nextValue: boolean,
  ) => {
    setPending({
      row,
      field,
      nextValue,
      permiso: permisoForMatrixField(field),
    })
  }

  const cancelPending = () => setPending(null)

  const confirmPending = async () => {
    if (!pending) return
    try {
      await setMutation.mutateAsync({
        usuario: pending.row.usuario,
        permiso: pending.permiso,
        activo: pending.nextValue,
      })
      toast.success("Permiso actualizado")
      setPending(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar")
    }
  }

  const pendingCopy = pending ? confirmCopyForChange(pending) : null

  return (
    <TooltipProvider delayDuration={250}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[min(92vh,800px)] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="space-y-1 border-b border-border px-6 py-4 text-left">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" aria-hidden />
              <DialogTitle>Permisos de usuarios</DialogTitle>
            </div>
            <p className="text-sm text-slate-600">
              Marque qué puede hacer cada usuario en compras. Antes de guardar siempre se pide
              confirmación.
            </p>
          </DialogHeader>

          <div className="space-y-2 px-4 py-3 sm:px-6">
            <details className="group rounded-lg border border-border/80 bg-white text-sm open:bg-slate-50/50">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-slate-600 marker:content-none hover:text-slate-900 [&::-webkit-details-marker]:hidden">
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                  aria-hidden
                />
                <span className="font-medium text-slate-700">¿Qué hace cada permiso?</span>
                <span className="hidden text-xs text-slate-500 sm:inline">(toque para ver)</span>
              </summary>
              <ul className="space-y-2 border-t border-border/80 px-3 pb-3 pt-2">
                {PERMISO_MATRIX_COLUMNS.map((col) => (
                  <li key={col.field} className="leading-snug">
                    <p className="font-medium text-slate-800">{col.title}</p>
                    <p className="text-xs text-slate-600">{col.description}</p>
                  </li>
                ))}
              </ul>
            </details>

            <div className="relative">
              <Label htmlFor={searchId} className="sr-only">
                Buscar usuario
              </Label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                id={searchId}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar por nombre o usuario…"
                className="pl-9"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="min-h-[200px] max-h-[min(58vh,520px)] overflow-x-auto overflow-y-auto px-4 pb-4 sm:px-6">
            {matrixQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Cargando" />
              </div>
            ) : matrixQuery.isError ? (
              <p className="py-8 text-center text-sm text-destructive">
                No se pudieron cargar los usuarios.
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Sin resultados.</p>
            ) : (
              <div className="min-w-[44rem] overflow-hidden rounded-xl border border-border">
                <div
                  className={cn(
                    MATRIX_GRID,
                    "border-b border-border bg-slate-50 px-3 py-2.5 sm:px-4",
                  )}
                  role="row"
                >
                  <span className="text-xs font-semibold text-slate-700">Usuario</span>
                  {PERMISO_MATRIX_COLUMNS.map((col) => (
                    <Tooltip key={col.field}>
                      <TooltipTrigger asChild>
                        <span className="cursor-help text-center text-[11px] font-semibold leading-snug text-slate-700">
                          {col.title}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-left text-sm">
                        <p className="font-medium">{col.title}</p>
                        <p className="mt-1 text-slate-200">{col.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <ul className="divide-y divide-border">
                  {filtered.map((row) => (
                    <li
                      key={row.usuario}
                      className={cn(MATRIX_GRID, "items-center px-3 py-3 sm:px-4")}
                    >
                      <div className="min-w-0">
                        <TruncatedTooltip
                          text={row.nombre?.trim() || row.usuario}
                          className="text-sm font-medium text-slate-900"
                        />
                        <TruncatedTooltip text={row.usuario} className="text-xs text-slate-500" />
                      </div>
                      {PERMISO_MATRIX_COLUMNS.map((col) => (
                        <div key={col.field} className="flex justify-center">
                          <PermisoCheck
                            id={`${row.usuario}-${col.field}`}
                            label={col.title}
                            hideLabel
                            checked={matrixFieldChecked(row, col.field, pending)}
                            disabled={matrixFieldDisabled(
                              row,
                              col.field,
                              pending,
                              setMutation.isPending,
                            )}
                            onCheckedChange={(v) =>
                              requestToggle(row, col.field, v === true)
                            }
                          />
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-border px-6 py-3">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pending !== null} onOpenChange={(isOpen) => !isOpen && cancelPending()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingCopy?.title ?? "Confirmar cambio"}</DialogTitle>
          </DialogHeader>
          {pendingCopy && (
            <div className="space-y-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{pendingCopy.question}</p>
              <p className="leading-relaxed">{pendingCopy.detail}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cancelPending}
              disabled={setMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void confirmPending()}
              disabled={setMutation.isPending}
            >
              {setMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Guardando…
                </>
              ) : (
                "Sí, confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

function TruncatedTooltip({ text, className }: { text: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p className={cn("truncate", className)} tabIndex={0}>
          {text}
        </p>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-left">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

function PermisoCheck({
  id,
  label,
  hideLabel,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  hideLabel?: boolean
  checked: boolean
  disabled?: boolean
  onCheckedChange: (v: boolean | "indeterminate") => void
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        aria-describedby={hideLabel ? undefined : `${id}-label`}
      />
      {!hideLabel && (
        <Label id={`${id}-label`} htmlFor={id} className="cursor-pointer text-sm font-medium text-slate-700">
          {label}
        </Label>
      )}
    </div>
  )
}
