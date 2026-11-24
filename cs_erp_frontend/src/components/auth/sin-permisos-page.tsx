'use client'

import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'

export default function SinPermisosPage() {
  const { logout, user } = useAuth()

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-muted/40 via-background to-brand/10 p-4 font-sans">
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-brand/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-brand-light/10 blur-3xl" />

      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl border border-border/60 bg-white/90 p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center">
              <img src="/cargotrans.ico" alt="Cargotrans" className="h-16 w-16 object-contain" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal text-brand tracking-wide">
                Cargotrans
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Módulo de Compras
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <ShieldOff className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm font-medium text-slate-800">
              No tienes permisos para acceder a este sistema.
            </p>
            <p className="text-[13px] leading-relaxed text-slate-500">
              Solicita a un administrador que te asigne un permiso.
              {user?.usuario ? ` Sesión: ${user.usuario}.` : ''}
            </p>
            <Button
              type="button"
              onClick={() => logout()}
              className="w-full h-10 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-brand to-brand-dark text-white shadow-md shadow-brand-light/40 hover:shadow-lg hover:opacity-95"
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
