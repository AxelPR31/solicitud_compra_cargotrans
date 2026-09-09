"use client"

import { useState, useEffect, useCallback } from 'react'
import { AppShell, type NavTab } from '@/components/layout/app-shell'
import { SolicitudCompraTab } from '@/components/tabs/solicitud-compra-tab'
import type { Articulo } from '@/lib/types'
import { useAuth } from '@/lib/auth/context'
import LoginPage from '@/components/auth/login-page'

const fetch = (input: RequestInfo | URL, init?: RequestInit) =>
  globalThis.fetch(input, { ...init, credentials: 'include' });

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://18.191.192.80:7500'

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [activeTab] = useState<NavTab>('solicitud-compra')
  const [serverOnline, setServerOnline] = useState(false)
  const [articulos, setArticulos] = useState<Articulo[]>([])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function checkServer() {
      try {
        const res = await fetch(`${API_BASE_URL}/tenant/DEFAULT/check`)
        setServerOnline(res.ok)
      } catch {
        setServerOnline(false)
      }
    }
    if (mounted) checkServer()
  }, [mounted])

  useEffect(() => {
    async function loadArticulos() {
      if (!serverOnline) return
      try {
        const res = await fetch(`${API_BASE_URL}/articulo?limit=200`)
        if (res.ok) setArticulos(await res.json())
      } catch (err) {
        console.error('Error cargando artículos', err)
      }
    }
    loadArticulos()
  }, [serverOnline])

  const getSelectOptions = useCallback((selectedValue: string, sourceList: Articulo[]) => {
    const list = [...sourceList]
    if (selectedValue) {
      const exists = list.some(a => a.articulo === selectedValue)
      if (!exists) {
        const found = articulos.find(a => a.articulo === selectedValue)
        if (found) list.push(found)
        else list.push({ articulo: selectedValue, descripcion: selectedValue } as Articulo)
      }
    }
    return list
  }, [articulos])

  const mergeToGlobalArticulos = useCallback((list: Articulo[]) => {
    setArticulos(prev => {
      const next = [...prev]
      list.forEach(item => {
        if (!next.some(x => x.articulo === item.articulo)) next.push(item)
      })
      return next
    })
  }, [])

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    )
  }

  if (!isAuthenticated) return <LoginPage />

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={() => {}}
      serverOnline={serverOnline}
      title="Solicitud de Compra"
      subtitle="Módulo de Compras Softland"
    >
      <SolicitudCompraTab
        articulos={articulos}
        serverOnline={serverOnline}
        API_BASE_URL={API_BASE_URL}
        user={user}
        getSelectOptions={getSelectOptions}
        mergeToGlobalArticulos={mergeToGlobalArticulos}
      />
    </AppShell>
  )
}
