"use client"

import { useState, useEffect, useCallback } from 'react'
import { AppShell, type NavTab } from '@/components/layout/app-shell'
import { SolicitudCompraNuevaTab } from '@/components/tabs/solicitud-compra-nueva-tab'
import { SolicitudCompraHistorialTab } from '@/components/tabs/solicitud-compra-historial-tab'
import type { Articulo } from '@/lib/types'
import { useAuth } from '@/lib/auth/context'
import LoginPage from '@/components/auth/login-page'

const fetch = (input: RequestInfo | URL, init?: RequestInit) =>
  globalThis.fetch(input, { ...init, credentials: 'include' });

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:7500'

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<NavTab>('solicitud-nueva')
  const [serverOnline, setServerOnline] = useState(false)
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [editSolicitudId, setEditSolicitudId] = useState<string | null>(null)
  const [historialRefreshKey, setHistorialRefreshKey] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function checkServer() {
      try {
        const res = await fetch(`${API_BASE_URL}/globales-co`)
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

  const sharedProps = {
    articulos,
    serverOnline,
    API_BASE_URL,
    user,
    getSelectOptions,
    mergeToGlobalArticulos,
  }

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
      onTabChange={setActiveTab}
      serverOnline={serverOnline}
    >
      {activeTab === 'solicitud-nueva' && (
        <SolicitudCompraNuevaTab
          {...sharedProps}
          editSolicitudId={editSolicitudId}
          onClearEdit={() => setEditSolicitudId(null)}
          onSaved={() => {
            setHistorialRefreshKey(k => k + 1)
            setActiveTab('solicitud-historial')
          }}
        />
      )}
      {activeTab === 'solicitud-historial' && (
        <SolicitudCompraHistorialTab
          {...sharedProps}
          refreshKey={historialRefreshKey}
          onEdit={(id) => {
            setEditSolicitudId(id)
            setActiveTab('solicitud-nueva')
          }}
        />
      )}
    </AppShell>
  )
}
