"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { AppShell, type NavTab } from '@/components/layout/app-shell'
import { RecipesTab } from '@/components/tabs/recipes-tab'
import { FactorsTab } from '@/components/tabs/factors-tab'
import { ExtractorTab } from '@/components/tabs/extractor-tab'
import { HistoryTab } from '@/components/tabs/history-tab'
import { TransfersTab } from '@/components/tabs/transfers-tab'
import { ConsecutivosTab } from '@/components/tabs/consecutivos-tab'
import type { Articulo, RecetaEncabezado, RecetaDetalle, FactorValuacion, Bodega, OrdenProduccionMateriaPrima } from '@/lib/types'
import { useAuth } from '@/lib/auth/context'
import LoginPage from '@/components/auth/login-page'

// Redefine fetch locally to automatically include cookies in all client requests
const fetch = (input: RequestInfo | URL, init?: RequestInit) =>
  globalThis.fetch(input, { ...init, credentials: 'include' });

interface OrdenProduccionVinculo {
  id: number
  documentoConsumo: string | null
  documentoEntrada: string | null
  referencia?: string | null
  fecha: string | Date
  totalLibras: number
  totalCosto: number
  materiaPrima?: string
  pesoMateriaPrima?: number
  costoUnitarioMateriaPrima?: number
  elaboradoPor?: string
  bodega?: string
  mermaLibras?: number
  mermaPorcentaje?: number
  materiasPrimas?: OrdenProduccionMateriaPrima[]
  detalles?: {
    id: number
    articulo: string
    nombre?: string
    cantidadUnitaria: number
    cantidadLibra: number
    nuevoCostoUnitario: number
    nuevoCostoLibra: number
    costoTotal: number
    asignacionCosto: number
    esMermaRecorte: boolean
    bodega?: string
  }[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://18.191.192.80:7500'

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Dynamically set elaboradoPor once user session is loaded
  useEffect(() => {
    if (user?.usuario) {
      setManualCabecera((prev: any) => ({
        ...prev,
        elaboradoPor: user.usuario.toUpperCase()
      }))
    }
  }, [user])

  const [activeTab, setActiveTab] = useState<NavTab>('recipes')
  const [isSaving, setIsSaving] = useState(false)
  const [serverOnline, setServerOnline] = useState(false)

  // Data lists
  const [recipes, setRecipes] = useState<RecetaEncabezado[]>([])
  const [recipeDetails, setRecipeDetails] = useState<RecetaDetalle[]>([])
  const [factors, setFactors] = useState<FactorValuacion[]>([])
  const [orders, setOrders] = useState<OrdenProduccionVinculo[]>([])
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [bodegas, setBodegas] = useState<Bodega[]>([])

  // Selection states
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)

  // Separate lists for dropdown options during search
  const [articulosRecipesMP, setArticulosRecipesMP] = useState<Articulo[]>([])
  const [articulosRecipesOutputs, setArticulosRecipesOutputs] = useState<Articulo[]>([])
  const [articulosFactors, setArticulosFactors] = useState<Articulo[]>([])

  // Helper to ensure currently selected article is never missing from the dropdown list options
  const getSelectOptions = useCallback((selectedValue: string, sourceList: Articulo[]) => {
    const list = [...sourceList];
    if (selectedValue) {
      const exists = list.some(a => a.articulo === selectedValue);
      if (!exists) {
        const found = articulos.find(a => a.articulo === selectedValue);
        if (found) {
          list.push(found);
        } else {
          list.push({ articulo: selectedValue, descripcion: selectedValue } as any);
        }
      }
    }
    return list;
  }, [articulos]);

  const mergeToGlobalArticulos = useCallback((list: Articulo[]) => {
    setArticulos(prev => {
      const next = [...prev];
      list.forEach(item => {
        if (!next.some(x => x.articulo === item.articulo)) {
          next.push(item);
        }
      });
      return next;
    });
  }, []);

  // Form states - Recipes
  const [newRecipeMPs, setNewRecipeMPs] = useState<{ articulo: string }[]>([
    { articulo: '' }
  ])
  const [newRecipeDesc, setNewRecipeDesc] = useState('')
  const [newRecipeOutputs, setNewRecipeOutputs] = useState<{ articuloTerminado: string; esMermaRecorte: boolean }[]>([
    { articuloTerminado: '', esMermaRecorte: false }
  ])
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null)
  const [manualMateriasPrimas, setManualMateriasPrimas] = useState<{ articulo: string; nombre: string; cantidad: number; costoUnitario: number }[]>([
    { articulo: '', nombre: '', cantidad: 0, costoUnitario: 0 }
  ])

  const handleAddManualMPLine = () => {
    setManualMateriasPrimas(prev => [...prev, { articulo: '', nombre: '', cantidad: 0, costoUnitario: 0 }])
  }

  const handleRemoveManualMPLine = (index: number) => {
    setManualMateriasPrimas(prev => prev.filter((_, i) => i !== index))
  }

  const handleManualMPLineChange = (index: number, updates: Partial<{ articulo: string; nombre: string; cantidad: number; costoUnitario: number }>) => {
    setManualMateriasPrimas(prev => prev.map((item, i) => {
      if (i === index) {
        const next = { ...item, ...updates }
        if (updates.articulo) {
          const art = articulos.find(a => a.articulo === updates.articulo) || articulosRecipesMP.find(a => a.articulo === updates.articulo)
          if (art) {
            next.nombre = art.descripcion
            next.costoUnitario = art.costoPromLoc || 0
          }
        }
        return next
      }
      return item
    }))
  }

  const handleAddMPLine = () => {
    setNewRecipeMPs(prev => [...prev, { articulo: '' }])
  }

  const handleRemoveMPLine = (index: number) => {
    setNewRecipeMPs(prev => prev.filter((_, i) => i !== index))
  }

  const handleMPLineChange = (index: number, val: string) => {
    setNewRecipeMPs(prev => prev.map((item, i) => {
      if (i === index) {
        return { articulo: val }
      }
      return item
    }))
    
    if (index === 0 && val) {
      const art = articulos.find(a => a.articulo === val) || articulosRecipesMP.find(a => a.articulo === val)
      if (art) {
        setNewRecipeDesc(prev => {
          if (!prev || prev.startsWith('Transformación de')) {
            return `Transformación de ${art.descripcion}`
          }
          return prev
        })
      }
    }
  }


  // Form states - Factors
  const [newFactorArticulo, setNewFactorArticulo] = useState('')
  const [newFactorValue, setNewFactorValue] = useState<number>(0.2)

  const [prodConfig, setProdConfig] = useState<any>({
    paquete: 'TRAN',
    consecutivo: 'TRANS'
  })

  // Form states - Manual Registration
  const [manualCabecera, setManualCabecera] = useState<any>({
    fecha: new Date().toISOString().split('T')[0],
    paquete: 'TRANS',
    referencia: '',
    elaboradoPor: '',
    documentoConsumo: '',
    documentoEntrada: '',
    bodega: '01',
    centroCosto: '',
    cuentaContable: '',
    numeroDocumento: '',
    useConsecutivo: true
  })
  const [manualMateriaPrima, setManualMateriaPrima] = useState<any>({
    articulo: '',
    nombre: '',
    cantidad: 0,
    costoUnitario: 0
  })

  // Keep legacy manualMateriaPrima object synchronized with the first item in the manualMateriasPrimas array
  useEffect(() => {
    if (manualMateriasPrimas.length > 0) {
      const first = manualMateriasPrimas[0]
      if (
        manualMateriaPrima.articulo !== first.articulo ||
        Number(manualMateriaPrima.cantidad || 0) !== Number(first.cantidad || 0) ||
        Number(manualMateriaPrima.costoUnitario || 0) !== Number(first.costoUnitario || 0)
      ) {
        setManualMateriaPrima({
          articulo: first.articulo || '',
          nombre: first.nombre || '',
          cantidad: Number(first.cantidad || 0),
          costoUnitario: Number(first.costoUnitario || 0)
        })
      }
    } else {
      if (manualMateriaPrima.articulo) {
        setManualMateriaPrima({
          articulo: '',
          nombre: '',
          cantidad: 0,
          costoUnitario: 0
        })
      }
    }
  }, [manualMateriasPrimas, manualMateriaPrima])
  const [manualProductos, setManualProductos] = useState<any[]>([])
  const [dynamicManualCalculations, setDynamicManualCalculations] = useState<any>(null)
  const [selectedRecipeTemplateId, setSelectedRecipeTemplateId] = useState<string>('')
  const [isValidated, setIsValidated] = useState<boolean>(false)
  const [articulosManualOutputs, setArticulosManualOutputs] = useState<Articulo[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([])

  useEffect(() => {
    setIsValidated(false)
  }, [
    manualMateriaPrima.articulo,
    manualMateriaPrima.cantidad,
    manualCabecera.bodega,
    manualProductos
  ])

  // Fetch initial data & check API server
  const fetchAllData = useCallback(async () => {
    try {
      // Check server connectivity
      const statusRes = await fetch(`${API_BASE_URL}/tenant/DEFAULT/check`).catch(() => null)
      const isOnline = !!statusRes && statusRes.status < 500
      setServerOnline(isOnline)

      if (isOnline) {
        // Fetch real data from NestJS API endpoints
        const recipesRes = await fetch(`${API_BASE_URL}/receta-encabezado?limit=1000`)
        if (recipesRes.ok) setRecipes(await recipesRes.json())

        const detailsRes = await fetch(`${API_BASE_URL}/receta-detalle?limit=5000`)
        if (detailsRes.ok) setRecipeDetails(await detailsRes.json())

        const factorsRes = await fetch(`${API_BASE_URL}/factor-valuacion`)
        if (factorsRes.ok) setFactors(await factorsRes.json())

        const configRes = await fetch(`${API_BASE_URL}/orden-produccion-vinculo/config`)
        if (configRes.ok) setProdConfig(await configRes.json())

        const bodegasRes = await fetch(`${API_BASE_URL}/bodega`)
        if (bodegasRes.ok) setBodegas(await bodegasRes.json())

        const articulosRes = await fetch(`${API_BASE_URL}/articulo?limit=200`)
        if (articulosRes.ok) {
          const data = await articulosRes.json()
          setArticulos(data)
          setArticulosRecipesMP(data)
          setArticulosRecipesOutputs(data)
          setArticulosFactors(data)
          setArticulosManualOutputs(data)
        }

        const unitsRes = await fetch(`${API_BASE_URL}/unidad-de-medida?limit=500`)
        if (unitsRes.ok) {
          setUnidadesMedida(await unitsRes.json())
        }

        const defaultsRes = await fetch(`${API_BASE_URL}/configuracion-defecto/ORDEN_PRODUCCION`)
        if (defaultsRes.ok) {
          const defaults = await defaultsRes.json()
          if (defaults) {
            setManualCabecera((prev: any) => ({
              ...prev,
              centroCosto: defaults.centroCosto || '',
              cuentaContable: defaults.cuentaContable || ''
            }))
          }
        }
      } else {
        // Fallback simulated offline data
        setRecipes([
          { id: 1, articuloMateriaPrima: 'MAT-RES-FILETE', descripcion: 'Filete de Res de Calidad Superior', estado: 'Activo' },
          { id: 2, articuloMateriaPrima: 'MAT-PORC-LOMO', descripcion: 'Lomo de Cerdo de Importación', estado: 'Activo' }
        ])
        setRecipeDetails([
          { id: 1, recetaId: 1, articuloTerminado: 'COR-RES-MEDALLON', esMermaRecorte: false },
          { id: 2, recetaId: 1, articuloTerminado: 'COR-RES-LOMITO', esMermaRecorte: false },
          { id: 3, recetaId: 1, articuloTerminado: 'SUB-RES-PELLEJO', esMermaRecorte: true },
          { id: 4, recetaId: 1, articuloTerminado: 'SUB-RES-RECORTE', esMermaRecorte: true },
          { id: 5, recetaId: 2, articuloTerminado: 'COR-PORC-CHULETA', esMermaRecorte: false },
          { id: 6, recetaId: 2, articuloTerminado: 'SUB-PORC-GRASA', esMermaRecorte: true }
        ])
        setFactors([
          { articulo: 'SUB-RES-PELLEJO', factor: 0.15 },
          { articulo: 'SUB-RES-RECORTE', factor: 0.20 },
          { articulo: 'SUB-PORC-GRASA', factor: 0.10 }
        ])
        setBodegas([
          { bodega: '01', nombre: 'Bodega Principal' },
          { bodega: '02', nombre: 'Bodega de Subproductos' },
          { bodega: '03', nombre: 'Bodega de Mermas' }
        ])
        const offlineArtList = [
          { articulo: 'MAT-RES-FILETE', descripcion: 'Filete de Res (Materia Prima)', clasificacion1: 'Materia Prima', clasificacion2: '', costoPromLoc: 5.5, costoPromDol: 0.65, costoStdLoc: 5.5, costoStdDol: 0.65, costoUltDol: 0.65, costoUltLoc: 5.5, activo: 'S', unidadAlmacen: 'LBS', unidadEmpaque: 'LBS', unidadVenta: 'LBS' },
          { articulo: 'MAT-PORC-LOMO', descripcion: 'Lomo de Cerdo (Materia Prima)', clasificacion1: 'Materia Prima', clasificacion2: '', costoPromLoc: 4.8, costoPromDol: 0.56, costoStdLoc: 4.8, costoStdDol: 0.56, costoUltDol: 0.56, costoUltLoc: 4.8, activo: 'S', unidadAlmacen: 'LBS', unidadEmpaque: 'LBS', unidadVenta: 'LBS' },
          { articulo: 'COR-RES-MEDALLON', descripcion: 'Medallón de Res (Producto Terminado)', clasificacion1: 'Producto Terminado', clasificacion2: '', costoPromLoc: 8.5, costoPromDol: 1.0, costoStdLoc: 8.5, costoStdDol: 1.0, costoUltDol: 1.0, costoUltLoc: 8.5, activo: 'S', unidadAlmacen: 'LBS', unidadEmpaque: 'LBS', unidadVenta: 'LBS' },
          { articulo: 'COR-RES-LOMITO', descripcion: 'Lomito de Res (Producto Terminado)', clasificacion1: 'Producto Terminado', clasificacion2: '', costoPromLoc: 9.0, costoPromDol: 1.05, costoStdLoc: 9.0, costoStdDol: 1.05, costoUltDol: 1.05, costoUltLoc: 9.0, activo: 'S', unidadAlmacen: 'LBS', unidadEmpaque: 'LBS', unidadVenta: 'LBS' },
          { articulo: 'SUB-RES-PELLEJO', descripcion: 'Pellejo de Res (Subproducto)', clasificacion1: 'Subproducto', clasificacion2: '', costoPromLoc: 1.0, costoPromDol: 0.12, costoStdLoc: 1.0, costoStdDol: 0.12, costoUltDol: 0.12, costoUltLoc: 1.0, activo: 'S', unidadAlmacen: 'LBS', unidadEmpaque: 'LBS', unidadVenta: 'LBS' },
          { articulo: 'SUB-RES-RECORTE', descripcion: 'Recorte de Res (Subproducto)', clasificacion1: 'Subproducto', clasificacion2: '', costoPromLoc: 1.5, costoPromDol: 0.18, costoStdLoc: 1.5, costoStdDol: 0.18, costoUltDol: 0.18, costoUltLoc: 1.5, activo: 'S', unidadAlmacen: 'LBS', unidadEmpaque: 'LBS', unidadVenta: 'LBS' },
          { articulo: 'COR-PORC-CHULETA', descripcion: 'Chuleta de Cerdo (Producto Terminado)', clasificacion1: 'Producto Terminado', clasificacion2: '', costoPromLoc: 7.2, costoPromDol: 0.85, costoStdLoc: 7.2, costoStdDol: 0.85, costoUltDol: 0.85, costoUltLoc: 7.2, activo: 'S', unidadAlmacen: 'LBS', unidadEmpaque: 'LBS', unidadVenta: 'LBS' },
          { articulo: 'SUB-PORC-GRASA', descripcion: 'Grasa de Cerdo (Subproducto)', clasificacion1: 'Subproducto', clasificacion2: '', costoPromLoc: 0.8, costoPromDol: 0.09, costoStdLoc: 0.8, costoStdDol: 0.09, costoUltDol: 0.09, costoUltLoc: 0.8, activo: 'S', unidadAlmacen: 'LBS', unidadEmpaque: 'LBS', unidadVenta: 'LBS' }
        ];
        setArticulos(offlineArtList)
        setArticulosRecipesMP(offlineArtList)
        setArticulosRecipesOutputs(offlineArtList)
        setArticulosFactors(offlineArtList)
        setArticulosManualOutputs(offlineArtList)
        setUnidadesMedida([
          { unidadMedida: 'LBS', descripcion: 'Libras' },
          { unidadMedida: 'LB', descripcion: 'Libra' },
          { unidadMedida: 'UN', descripcion: 'Unidades' }
        ])
      }
    } catch {
      setServerOnline(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') toast.error(message)
    else toast.success(message)
  }

  // Selected Recipe Encabezado details
  const selectedRecipe = useMemo(() => {
    return recipes.find(r => r.id === selectedRecipeId) || null
  }, [recipes, selectedRecipeId])

  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<RecetaDetalle[]>([])

  useEffect(() => {
    if (!selectedRecipeId) {
      setSelectedRecipeDetails([])
      return
    }

    if (serverOnline) {
      fetch(`${API_BASE_URL}/receta-encabezado/${selectedRecipeId}`)
        .then(res => {
          if (res.ok) return res.json()
          throw new Error('Failed to load recipe details')
        })
        .then(data => {
          if (data && data.detalles) {
            setSelectedRecipeDetails(data.detalles)
          }
        })
        .catch(err => {
          console.error('Error fetching details dynamically:', err)
          setSelectedRecipeDetails(recipeDetails.filter(d => d.recetaId === selectedRecipeId))
        })
    } else {
      setSelectedRecipeDetails(recipeDetails.filter(d => d.recetaId === selectedRecipeId))
    }
  }, [selectedRecipeId, serverOnline, recipeDetails])

  const selectedRecipeDetailsList = selectedRecipeDetails

  // Recipe Creation
  const handleAddOutputLine = () => {
    setNewRecipeOutputs([...newRecipeOutputs, { articuloTerminado: '', esMermaRecorte: false }])
  }

  const handleRemoveOutputLine = (index: number) => {
    const outputs = [...newRecipeOutputs]
    outputs.splice(index, 1)
    setNewRecipeOutputs(outputs)
  }

  const handleOutputLineChange = (index: number, updates: Partial<{ articuloTerminado: string; esMermaRecorte: boolean }>) => {
    setNewRecipeOutputs(prev => {
      const outputs = [...prev]
      outputs[index] = {
        ...outputs[index],
        ...updates
      }
      return outputs
    })
  }

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newRecipeMPs.length === 0 || !newRecipeMPs[0].articulo || !newRecipeDesc) {
      showToast('Por favor complete la materia prima y descripción', 'error')
      return
    }

    try {
      let createdId = Date.now()
      const newHeaderData = {
        articuloMateriaPrima: newRecipeMPs[0].articulo,
        descripcion: newRecipeDesc,
        estado: 'Activo',
        materiasPrimas: newRecipeMPs.map(m => ({ articulo: m.articulo }))
      }

      if (serverOnline) {
        const res = await fetch(`${API_BASE_URL}/receta-encabezado`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newHeaderData)
        })
        if (res.ok) {
          const raw = await res.json()
          createdId = raw.id || createdId
        } else {
          showToast('Error al crear el encabezado de receta en el servidor', 'error')
          return
        }
      }

      // Add details
      const detailPromises = newRecipeOutputs
        .filter(o => o.articuloTerminado && o.articuloTerminado.trim() !== '')
        .map(async (output, idx) => {
          const detailData = {
            recetaId: createdId,
            articuloTerminado: output.articuloTerminado,
            esMermaRecorte: output.esMermaRecorte
          }

          let savedId = Date.now() + idx + Math.floor(Math.random() * 1000000)
          if (serverOnline) {
            const res = await fetch(`${API_BASE_URL}/receta-detalle`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(detailData)
            })
            if (!res.ok) {
              const errText = await res.text()
              throw new Error(`Error al guardar detalle: ${errText}`)
            }
            const savedDetail = await res.json()
            savedId = savedDetail.id || savedId
          }
          return {
            id: savedId,
            ...detailData
          }
        })

      const addedDetails = await Promise.all(detailPromises)

      // Update state locally
      setRecipes(prev => [...prev, { id: createdId, ...newHeaderData }])
      setRecipeDetails(prev => [...prev, ...addedDetails])

      // Reset
      setNewRecipeMPs([{ articulo: '' }])
      setNewRecipeDesc('')
      setNewRecipeOutputs([{ articuloTerminado: '', esMermaRecorte: false }])
      showToast('Receta y sus detalles guardados con éxito')
      fetchAllData()
    } catch {
      showToast('Error al guardar la receta', 'error')
    }
  }

  const handleStartEditRecipe = async (recipe: any) => {
    setEditingRecipeId(recipe.id)
    setNewRecipeDesc(recipe.descripcion)
    
    // Fetch details dynamically from the single recipe endpoint
    let details: any[] = []
    let materiasPrimas: any[] = []
    if (serverOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/receta-encabezado/${recipe.id}`)
        if (res.ok) {
          const data = await res.json()
          details = data.detalles || []
          materiasPrimas = data.materiasPrimas || []
        }
      } catch (err) {
        console.error('Error fetching details for edit:', err)
      }
    }
    if (details.length === 0) {
      details = recipeDetails.filter(d => d.recetaId === recipe.id)
    }
    if (materiasPrimas.length === 0 && recipe.articuloMateriaPrima) {
      materiasPrimas = [{ articulo: recipe.articuloMateriaPrima }]
    }

    setNewRecipeMPs(materiasPrimas.map(m => ({ articulo: m.articulo })))

    const uniqueCodes = Array.from(new Set([
      ...materiasPrimas.map(mp => mp.articulo),
      ...details.map(d => d.articuloTerminado)
    ]))
    
    if (serverOnline) {
      try {
        const fetched = await Promise.all(uniqueCodes.map(async (code) => {
          const res = await fetch(`${API_BASE_URL}/articulo/${code}`)
          if (res.ok) return await res.json()
          return null
        }))
        const validArts = fetched.filter(Boolean)
        mergeToGlobalArticulos(validArts)
      } catch (e) {
        console.error('Error fetching article names for edit', e)
      }
    }

    setNewRecipeOutputs(details.map(d => ({
      articuloTerminado: d.articuloTerminado,
      esMermaRecorte: d.esMermaRecorte
    })))

    // Scroll to the edit recipe card
    const element = document.getElementById('recipe-form-card')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleCancelEditRecipe = () => {
    setEditingRecipeId(null)
    setNewRecipeMPs([{ articulo: '' }])
    setNewRecipeDesc('')
    setNewRecipeOutputs([{ articuloTerminado: '', esMermaRecorte: false }])
  }

  const handleUpdateRecipe = async () => {
    if (newRecipeMPs.length === 0 || !newRecipeMPs[0].articulo || !newRecipeDesc) {
      showToast('Por favor complete la materia prima y descripción', 'error')
      return
    }

    try {
      const headerData = {
        articuloMateriaPrima: newRecipeMPs[0].articulo,
        descripcion: newRecipeDesc,
        estado: 'Activo',
        materiasPrimas: newRecipeMPs.map(m => ({ articulo: m.articulo }))
      }

      if (serverOnline) {
        // 1. Update recipe header
        const res = await fetch(`${API_BASE_URL}/receta-encabezado/${editingRecipeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(headerData)
        })
        if (!res.ok) {
          showToast('Error al actualizar el encabezado de receta en el servidor', 'error')
          return
        }

        // 2. Delete old details
        const delRes = await fetch(`${API_BASE_URL}/receta-detalle/by-receta/${editingRecipeId}`, {
          method: 'DELETE'
        })
        if (!delRes.ok) {
          showToast('Error al limpiar los detalles de receta anteriores', 'error')
          return
        }
      }

      // 3. Add new details
      const detailPromises = newRecipeOutputs
        .filter(o => o.articuloTerminado && o.articuloTerminado.trim() !== '')
        .map(async (output, idx) => {
          const detailData = {
            recetaId: editingRecipeId!,
            articuloTerminado: output.articuloTerminado,
            esMermaRecorte: output.esMermaRecorte
          }

          let savedId = Date.now() + idx + Math.floor(Math.random() * 1000000)
          if (serverOnline) {
            const res = await fetch(`${API_BASE_URL}/receta-detalle`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(detailData)
            })
            if (!res.ok) {
              const errText = await res.text()
              throw new Error(`Error al guardar detalle: ${errText}`)
            }
            const savedDetail = await res.json()
            savedId = savedDetail.id || savedId
          }
          return {
            id: savedId,
            ...detailData
          }
        })

      const addedDetails = await Promise.all(detailPromises)

      // Update state locally
      setRecipes(prev => prev.map(r => r.id === editingRecipeId ? { ...r, ...headerData } : r))
      setRecipeDetails(prev => [
        ...prev.filter(d => d.recetaId !== editingRecipeId),
        ...addedDetails
      ])

      // Reset
      setEditingRecipeId(null)
      setNewRecipeMPs([{ articulo: '' }])
      setNewRecipeDesc('')
      setNewRecipeOutputs([{ articuloTerminado: '', esMermaRecorte: false }])
      showToast('Receta actualizada con éxito')
      fetchAllData()
    } catch {
      showToast('Error al actualizar la receta', 'error')
    }
  }

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingRecipeId) {
      await handleUpdateRecipe()
    } else {
      await handleCreateRecipe(e)
    }
  }

  const handleDeleteRecipe = async (id: number) => {
    if (!confirm('¿Está seguro de que desea borrar esta receta?')) return

    try {
      if (serverOnline) {
        const res = await fetch(`${API_BASE_URL}/receta-encabezado/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'Inactivo' })
        })
        if (!res.ok) {
          showToast('Error al inactivar la receta en el servidor', 'error')
          return
        }
      }

      // Update state locally
      setRecipes(prev => prev.filter(r => r.id !== id))
      setSelectedRecipeId(null)
      showToast('Receta borrada con éxito')
      fetchAllData()
    } catch {
      showToast('Error al borrar la receta', 'error')
    }
  }

  // Factor Creation
  const handleCreateFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFactorArticulo) {
      showToast('Por favor ingrese el código del artículo subproducto', 'error')
      return
    }

    const selectedArt = articulosFactors.find(a => a.articulo === newFactorArticulo)
    const payload = {
      articulo: newFactorArticulo,
      factor: Number(newFactorValue),
      descripcion: selectedArt ? selectedArt.descripcion : 'N/A'
    }

    try {
      if (serverOnline) {
        const res = await fetch(`${API_BASE_URL}/factor-valuacion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articulo: payload.articulo,
            factor: payload.factor
          })
        })
        if (!res.ok) {
          showToast('Error al guardar factor en el servidor', 'error')
          return
        }
      }

      // Local state update
      setFactors(prev => {
        const idx = prev.findIndex(f => f.articulo === payload.articulo)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = payload
          return updated
        }
        return [...prev, payload]
      })

      setNewFactorArticulo('')
      setNewFactorValue(0.2)
      showToast('Factor de valuación guardado correctamente')
    } catch {
      showToast('Error de conexión', 'error')
    }
  }

  const handleDeleteFactor = async (articulo: string) => {
    if (!window.confirm(`¿Está seguro de eliminar el factor de valuación para el artículo ${articulo}?`)) {
      return
    }

    try {
      if (serverOnline) {
        const res = await fetch(`${API_BASE_URL}/factor-valuacion/${encodeURIComponent(articulo)}`, {
          method: 'DELETE'
        })
        if (!res.ok) {
          showToast('Error al eliminar el factor en el servidor', 'error')
          return
        }
      }

      setFactors(prev => prev.filter(f => f.articulo !== articulo))
      showToast('Factor de valuación eliminado con éxito')
    } catch {
      showToast('Error de conexión', 'error')
    }
  }

  const handleUpdateFactor = async (articulo: string, newFactor: number) => {
    try {
      if (serverOnline) {
        const res = await fetch(`${API_BASE_URL}/factor-valuacion/${encodeURIComponent(articulo)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            factor: newFactor
          })
        })
        if (!res.ok) {
          showToast('Error al actualizar el factor en el servidor', 'error')
          return
        }
      }

      setFactors(prev => prev.map(f => f.articulo === articulo ? { ...f, factor: newFactor } : f))
      showToast('Factor de valuación actualizado con éxito')
    } catch {
      showToast('Error de conexión', 'error')
    }
  }

  // Apply recipe template to manual form
  const handleApplyRecipeTemplate = useCallback((recipeIdStr: string) => {
    setSelectedRecipeTemplateId(recipeIdStr)
    if (!recipeIdStr) {
      setManualMateriaPrima({ articulo: '', nombre: '', cantidad: 0, costoUnitario: 0 })
      setManualMateriasPrimas([{ articulo: '', nombre: '', cantidad: 0, costoUnitario: 0 }])
      setManualProductos([])
      return
    }

    const recipeId = Number(recipeIdStr)
    const header = recipes.find(r => r.id === recipeId)
    if (!header) return

    // Find the raw materials list
    let mpsList: any[] = header.materiasPrimas || []
    if (mpsList.length === 0 && header.articuloMateriaPrima) {
      mpsList = [{ articulo: header.articuloMateriaPrima }]
    }

    const initialMps = mpsList.map(mp => {
      const art = articulos.find(a => a.articulo === mp.articulo)
      return {
        articulo: mp.articulo,
        nombre: art ? art.descripcion : 'Transformación',
        cantidad: 0,
        costoUnitario: art ? (art.costoPromLoc ?? 0) : 0
      }
    })

    setManualMateriasPrimas(initialMps)
    if (initialMps.length > 0) {
      setManualMateriaPrima(initialMps[0])
    }

    // Load expected outputs
    const details = recipeDetails.filter(d => d.recetaId === recipeId)
    const initialOutputs = details.map(d => {
      const artObj = articulos.find(a => a.articulo === d.articuloTerminado)
      return {
        articulo: d.articuloTerminado,
        nombre: artObj ? artObj.descripcion : '',
        cantidadUnitaria: 0,
        cantidadLibra: 0,
        esMermaRecorte: d.esMermaRecorte,
        bodega: manualCabecera.bodega || '01'
      }
    })
    setManualProductos(initialOutputs)
  }, [recipes, articulos, recipeDetails, manualCabecera.bodega])

  // Dynamic Math for Manual Validator (Calculated in the Backend for precision and single source of truth)
  useEffect(() => {
    const hasMPs = manualMateriasPrimas.length > 0 && manualMateriasPrimas.some(mp => mp.articulo && Number(mp.cantidad) > 0)
    if (!hasMPs) {
      setDynamicManualCalculations(null)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const payload = {
          materiasPrimas: manualMateriasPrimas.map(mp => ({
            articulo: mp.articulo,
            cantidad: Number(mp.cantidad || 0),
            costoUnitario: Number(mp.costoUnitario || 0)
          })),
          productos: manualProductos.map((p: any) => ({
            articulo: p.articulo,
            cantidadUnitaria: Number(p.cantidadUnitaria),
            cantidadLibra: Number(p.cantidadLibra),
            esMermaRecorte: !!p.esMermaRecorte
          })),
          factors: factors
        }

        const res = await fetch(`${API_BASE_URL}/orden-produccion-vinculo/calcular`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        })
        if (res.ok) {
          const data = await res.json()
          setDynamicManualCalculations(data)
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching calculations from backend', err)
        }
      }
    }, 150)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [manualMateriasPrimas, manualProductos, factors])

  const isLbsUnit = (articuloCode: string) => {
    const art = articulos.find((a: any) => a.articulo === articuloCode) || articulosManualOutputs.find((a: any) => a.articulo === articuloCode);
    if (!art || !art.unidadAlmacen) return false;
    const unitUpper = art.unidadAlmacen.toUpperCase();
    if (unitUpper === 'LBS' || unitUpper === 'LB') return true;
    const match = unidadesMedida.find(u => u.unidadMedida?.toUpperCase() === unitUpper);
    if (match) {
      const descUpper = match.descripcion?.toUpperCase() || '';
      return descUpper.includes('LIBRA') || descUpper.includes('LBS') || descUpper.includes('LIBRAS');
    }
    return false;
  };

  const handleStartEditOrder = (order: any) => {
    setEditingOrderId(order.id)
    setManualCabecera({
      fecha: order.fecha ? order.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
      paquete: prodConfig.paquete || 'TRAN',
      referencia: order.referencia || '',
      elaboradoPor: order.elaboradoPor || '',
      documentoConsumo: order.documentoConsumo || '',
      documentoEntrada: order.documentoEntrada || '',
      bodega: order.bodega || '01',
      centroCosto: order.centroCosto || '',
      cuentaContable: order.cuentaContable || '',
      numeroDocumento: order.numeroDocumento || '',
      useConsecutivo: false
    })

    const mpArt = articulos.find(a => a.articulo === order.materiaPrima)
    setManualMateriaPrima({
      articulo: order.materiaPrima || '',
      nombre: mpArt ? mpArt.descripcion : '',
      cantidad: Number(order.pesoMateriaPrima || 0),
      costoUnitario: Number(order.costoUnitarioMateriaPrima || 0)
    })

    if (order.materiasPrimas && order.materiasPrimas.length > 0) {
      setManualMateriasPrimas(order.materiasPrimas.map((m: any) => ({
        articulo: m.articulo,
        nombre: m.nombre || articulos.find(a => a.articulo === m.articulo)?.descripcion || '',
        cantidad: Number(m.cantidad || 0),
        costoUnitario: Number(m.costoUnitario || 0)
      })))
    } else {
      setManualMateriasPrimas([{
        articulo: order.materiaPrima || '',
        nombre: mpArt ? mpArt.descripcion : '',
        cantidad: Number(order.pesoMateriaPrima || 0),
        costoUnitario: Number(order.costoUnitarioMateriaPrima || 0)
      }])
    }

    if (order.detalles && order.detalles.length > 0) {
      setManualProductos(order.detalles.map((d: any) => ({
        articulo: d.articulo,
        nombre: d.nombre || '',
        cantidadUnitaria: Number(d.cantidadUnitaria || 0),
        cantidadLibra: Number(d.cantidadLibra || 0),
        esMermaRecorte: !!d.esMermaRecorte,
        bodega: d.bodega || order.bodega || '01'
      })))
    } else {
      setManualProductos([])
    }

    setIsValidated(true)
    setActiveTab('extractor')
  }

  const handleCancelEditOrder = () => {
    setEditingOrderId(null)
    setManualCabecera({
      fecha: new Date().toISOString().split('T')[0],
      paquete: 'TRANS',
      referencia: '',
      elaboradoPor: user?.usuario?.toUpperCase() || '',
      documentoConsumo: '',
      documentoEntrada: '',
      bodega: '01',
      centroCosto: '',
      cuentaContable: '',
      numeroDocumento: '',
      useConsecutivo: true
    })
    setManualMateriaPrima({
      articulo: '',
      nombre: '',
      cantidad: 0,
      costoUnitario: 0
    })
    setManualMateriasPrimas([{
      articulo: '',
      nombre: '',
      cantidad: 0,
      costoUnitario: 0
    }])
    setManualProductos([])
    setIsValidated(false)
    setActiveTab('history')
  }

  // Save the manual order in Softland & internal databases
  const handleSaveManualOrder = async () => {
    const calc = dynamicManualCalculations
    if (!calc || !manualMateriaPrima || !manualCabecera) return

    if (!isValidated) {
      showToast('Por favor, realice la validación mediante el botón "Validar" antes de proceder.', 'error')
      return
    }

    if (Math.abs(calc.balance) > 0.05) {
      showToast('No se puede procesar: El balance tiene una diferencia de costo de $' + calc.balance.toFixed(2), 'error')
      return
    }

    // Validate each product against its unit of measure only if they are not completely empty
    for (const p of manualProductos) {
      const hasQty = Number(p.cantidadLibra || 0) > 0 || Number(p.cantidadUnitaria || 0) > 0
      if (!hasQty) continue

      const isLbs = p.esMermaRecorte || isLbsUnit(p.articulo)
      if (isLbs) {
        if (!p.cantidadLibra || Number(p.cantidadLibra) <= 0) {
          showToast(`El artículo ${p.articulo} (${p.nombre || 'N/A'}) requiere cantidad en libras mayor a cero.`, 'error')
          return
        }
      } else {
        if (!p.cantidadUnitaria || Number(p.cantidadUnitaria) <= 0) {
          showToast(`El artículo ${p.articulo} (${p.nombre || 'N/A'}) requiere cantidad unitaria mayor a cero.`, 'error')
          return
        }
      }
    }

    setIsSaving(true)
    try {
      let docNum = editingOrderId
        ? manualCabecera.documentoConsumo
        : `OP-${Math.floor(10000 + Math.random() * 90000)}`
      let exchangeRate = 8.5

      if (serverOnline) {
        try {
          if (!editingOrderId) {
            const resCons = await fetch(`${API_BASE_URL}/consecutivo-ci/siguiente/${encodeURIComponent(prodConfig.consecutivo)}`, {
              method: 'POST'
            })
            if (resCons.ok) {
              const raw = await resCons.json()
              docNum = raw.siguiente
            }
          }

          // Obtener tasa de cambio oficial más reciente
          const rateRes = await fetch(`${API_BASE_URL}/tipo-cambio-hist/ofic/latest`)
          if (rateRes.ok) {
            const rateData = await rateRes.json()
            if (rateData && rateData.monto) {
              exchangeRate = Number(rateData.monto)
            }
          }
        } catch (err) {
          console.error('Error fetching next codes or exchange rate', err)
        }
      }

      const linkPayload = {
        documentoConsumo: docNum,
        documentoEntrada: docNum,
        fecha: manualCabecera.fecha,
        totalLibras: Number(calc.totalLibrasProducidas),
        totalCosto: Number(calc.totalCostoMP),
        materiaPrima: manualMateriaPrima.articulo,
        pesoMateriaPrima: Number(manualMateriaPrima.cantidad),
        costoUnitarioMateriaPrima: Number(manualMateriaPrima.costoUnitario),
        materiasPrimas: manualMateriasPrimas.map(mp => ({
          articulo: mp.articulo,
          cantidad: Number(mp.cantidad || 0),
          costoUnitario: Number(mp.costoUnitario || 0)
        })),
        elaboradoPor: manualCabecera.elaboradoPor,
        mermaLibras: Number(calc.mermaLibras),
        mermaPorcentaje: Number(calc.mermaPorcentaje),
        numeroDocumento: manualCabecera.useConsecutivo ? 'AUTO' : (manualCabecera.numeroDocumento || null),
        bodega: manualCabecera.bodega,
        referencia: manualCabecera.referencia,
        detalles: calc.productos
          .filter((p: any) => {
            const isLbs = p.esMermaRecorte || isLbsUnit(p.articulo)
            return isLbs ? Number(p.cantidadLibra) > 0 : Number(p.cantidadUnitaria) > 0
          })
          .map((p: any, index: number) => ({
            id: Date.now() + index,
            articulo: p.articulo,
            nombre: p.nombre,
            cantidadUnitaria: Number(p.cantidadUnitaria),
            cantidadLibra: Number(p.cantidadLibra),
            nuevoCostoUnitario: Number(p.nuevoCostoUnitario || 0),
            nuevoCostoLibra: Number(p.nuevoCostoLibra || 0),
            costoTotal: Number(p.costoTotal || 0),
            asignacionCosto: Number(p.asignacionCosto || 0) / 100,
            esMermaRecorte: p.esMermaRecorte,
            bodega: p.bodega || manualCabecera.bodega || '01'
          }))
      }

      if (serverOnline) {
        // Link the Documents and save the internal details (PATCH if editing, POST if new)
        const url = editingOrderId
          ? `${API_BASE_URL}/orden-produccion-vinculo/${editingOrderId}`
          : `${API_BASE_URL}/orden-produccion-vinculo`
        const method = editingOrderId ? 'PATCH' : 'POST'

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(linkPayload)
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          const errorMsg = errorData.message || 'Error al registrar la orden y sus documentos en el servidor'
          showToast(errorMsg, 'error')
          setIsSaving(false)
          return
        }
      }

      if (editingOrderId) {
        showToast('Orden de producción y documentos en Softland actualizados exitosamente')
        handleCancelEditOrder()
      } else {
        setOrders(prev => [
          {
            id: Date.now(),
            ...linkPayload,
            fecha: manualCabecera.fecha
          },
          ...prev
        ])
        showToast('Orden de producción y documentos de inventario registrados exitosamente en Softland')

        // Reset form
        setManualMateriaPrima({ articulo: '', nombre: '', cantidad: 0, costoUnitario: 0 })
        setManualMateriasPrimas([{ articulo: '', nombre: '', cantidad: 0, costoUnitario: 0 }])
        setManualProductos([])
        setSelectedRecipeTemplateId('')
        setManualCabecera((prev: any) => ({
          ...prev,
          referencia: '',
          elaboradoPor: user?.usuario?.toUpperCase() || '',
          numeroDocumento: '',
          useConsecutivo: true
        }))
      }
      fetchAllData()
    } catch {
      showToast('Error de red al intentar procesar la orden', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  if (!mounted) {
    return null
  }

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      serverOnline={serverOnline}
      title=""
      subtitle=""
    >
      {activeTab === 'recipes' && (
        <RecipesTab
          recipes={recipes}
          selectedRecipeId={selectedRecipeId}
          setSelectedRecipeId={setSelectedRecipeId}
          selectedRecipe={selectedRecipe}
          selectedRecipeDetailsList={selectedRecipeDetailsList}
          factors={factors}
          editingRecipeId={editingRecipeId}
          newRecipeMPs={newRecipeMPs}
          handleMPLineChange={handleMPLineChange}
          handleAddMPLine={handleAddMPLine}
          handleRemoveMPLine={handleRemoveMPLine}
          handleCancelEditRecipe={handleCancelEditRecipe}
          newRecipeDesc={newRecipeDesc}
          setNewRecipeDesc={setNewRecipeDesc}
          newRecipeOutputs={newRecipeOutputs}
          articulos={articulos}
          articulosRecipesMP={articulosRecipesMP}
          articulosRecipesOutputs={articulosRecipesOutputs}
          serverOnline={serverOnline}
          API_BASE_URL={API_BASE_URL}
          getSelectOptions={getSelectOptions}
          mergeToGlobalArticulos={mergeToGlobalArticulos}
          setArticulosRecipesMP={setArticulosRecipesMP}
          setArticulosRecipesOutputs={setArticulosRecipesOutputs}
          handleStartEditRecipe={handleStartEditRecipe}
          handleSaveRecipe={handleSaveRecipe}
          handleDeleteRecipe={handleDeleteRecipe}
          handleAddOutputLine={handleAddOutputLine}
          handleRemoveOutputLine={handleRemoveOutputLine}
          handleOutputLineChange={handleOutputLineChange}
          setEditingRecipeId={setEditingRecipeId}
          setNewRecipeOutputs={setNewRecipeOutputs}
        />
      )}

      {activeTab === 'factors' && (
        <FactorsTab
          factors={factors}
          newFactorArticulo={newFactorArticulo}
          setNewFactorArticulo={setNewFactorArticulo}
          newFactorValue={newFactorValue}
          setNewFactorValue={setNewFactorValue}
          articulosFactors={articulosFactors}
          serverOnline={serverOnline}
          API_BASE_URL={API_BASE_URL}
          getSelectOptions={getSelectOptions}
          setArticulosFactors={setArticulosFactors}
          mergeToGlobalArticulos={mergeToGlobalArticulos}
          handleCreateFactor={handleCreateFactor}
          handleDeleteFactor={handleDeleteFactor}
          handleUpdateFactor={handleUpdateFactor}
        />
      )}

      {activeTab === 'extractor' && (
        <ExtractorTab
          recipes={recipes}
          factors={factors}
          manualCabecera={manualCabecera}
          setManualCabecera={setManualCabecera}
          manualMateriaPrima={manualMateriaPrima}
          setManualMateriaPrima={setManualMateriaPrima}
          manualMateriasPrimas={manualMateriasPrimas}
          setManualMateriasPrimas={setManualMateriasPrimas}
          handleAddManualMPLine={handleAddManualMPLine}
          handleRemoveManualMPLine={handleRemoveManualMPLine}
          handleManualMPLineChange={handleManualMPLineChange}
          manualProductos={manualProductos}
          setManualProductos={setManualProductos}
          selectedRecipeTemplateId={selectedRecipeTemplateId}
          handleApplyRecipeTemplate={handleApplyRecipeTemplate}
          articulos={articulos}
          articulosRecipesMP={articulosRecipesMP}
          articulosManualOutputs={articulosManualOutputs}
          serverOnline={serverOnline}
          API_BASE_URL={API_BASE_URL}
          getSelectOptions={getSelectOptions}
          mergeToGlobalArticulos={mergeToGlobalArticulos}
          setArticulosRecipesMP={setArticulosRecipesMP}
          setArticulosManualOutputs={setArticulosManualOutputs}
          dynamicManualCalculations={dynamicManualCalculations}
          handleSaveManualOrder={handleSaveManualOrder}
          bodegas={bodegas}
          unidadesMedida={unidadesMedida}
          isValidated={isValidated}
          setIsValidated={setIsValidated}
          isSaving={isSaving}
          editingOrderId={editingOrderId}
          handleCancelEditOrder={handleCancelEditOrder}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          serverOnline={serverOnline}
          API_BASE_URL={API_BASE_URL}
          onEditOrder={handleStartEditOrder}
        />
      )}

      {activeTab === 'transfers' && (
        <TransfersTab
          articulos={articulos}
          bodegas={bodegas}
          serverOnline={serverOnline}
          API_BASE_URL={API_BASE_URL}
          user={user}
          getSelectOptions={getSelectOptions}
          mergeToGlobalArticulos={mergeToGlobalArticulos}
        />
      )}

      {activeTab === 'consecutivos' && (
        <ConsecutivosTab
          serverOnline={serverOnline}
          API_BASE_URL={API_BASE_URL}
        />
      )}
    </AppShell>
  )
}
