'use client'

import { useState, type FormEvent } from 'react'
import {
  Fingerprint,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'

export default function LoginPage() {
  const { login, isLoading } = useAuth()

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!usuario || !password) {
      setError('Completa todos los campos')
      return
    }

    try {
      await login(usuario, password)
      toast.success('Sesión iniciada correctamente')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Credenciales inválidas'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-muted/40 via-background to-brand/10 p-4 font-sans">
      {/* Decorative background glow blobs */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-brand/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-brand-light/10 blur-3xl" />

      <div className="w-full max-w-[380px] transition-all duration-300 hover:scale-[1.01]">
        <div className="rounded-2xl border border-border/60 bg-white/90 p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shadow-inner">
              <Fingerprint className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal text-brand tracking-wide">
                Restaurante Eskimo S.A. 
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Ingresa tus credenciales para continuar
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Usuario
              </label>
              <Input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="rounded-xl h-10 border-slate-200 focus-visible:ring-brand focus-visible:border-brand transition-all duration-200"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Contraseña
              </label>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl h-10 pr-10 border-slate-200 focus-visible:ring-brand focus-visible:border-brand transition-all duration-200"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-destructive text-center font-medium bg-destructive/5 py-1.5 rounded-lg border border-destructive/10 animate-pulse">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl text-[13px] font-semibold mt-2 bg-gradient-to-r from-brand to-brand-dark text-white shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.99] transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
