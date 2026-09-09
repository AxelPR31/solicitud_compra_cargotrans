'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X, ChevronDown, Search, CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type Primitive = string | number
type Item = Record<string, any>

interface Props {
  label?: string
  value?: Primitive
  onChange: (value: Primitive) => void

  clearable?: boolean
  options: Item[]

  displayKey: string
  valueKey: string
  placeholder?: string
  fallbackLabel?: string
  formatOptionLabel?: (item: Item) => string
  formatOptionParts?: (item: Item) => { code: string; description: string }
  tooltipKey?: string
  maxLabelLength?: number
  disabled?: boolean
  onSearch?: (search: string) => Promise<Item[]> | any
}

export function SelectorRelacionalComboBox({
  label,
  value,
  onChange,
  options,
  displayKey,
  valueKey,
  placeholder = 'Seleccionar...',
  fallbackLabel,
  clearable = true,
  formatOptionLabel,
  formatOptionParts,
  tooltipKey,
  maxLabelLength,
  disabled = false,
  onSearch,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [localOptions, setLocalOptions] = useState<Item[]>(options)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  const valueStr = value !== undefined && value !== null && value !== '' ? String(value) : undefined

  const clearSelection = () => {
    onChange('')
    setSearch('')
    setOpen(false)
    inputRef.current?.blur()
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  const filteredOptions = useMemo(() => {
    // If we have a custom onSearch handler and search is active, return the fetched localOptions
    if (onSearch && search.trim()) {
      return localOptions
    }

    if (!search.trim()) return options
    const searchLower = search.toLowerCase()
    return options.filter((item) => {
      const displayValue = safeToString(item[displayKey]).toLowerCase()
      const valueValue = safeToString(item[valueKey]).toLowerCase()
      return displayValue.includes(searchLower) || valueValue.includes(searchLower)
    })
  }, [options, localOptions, search, displayKey, valueKey, onSearch])

  const selectedItem = useMemo(() => {
    let found = options.find((i) => safeToString(i[valueKey]) === valueStr)
    if (!found) {
      found = localOptions.find((i) => safeToString(i[valueKey]) === valueStr)
    }
    return found
  }, [options, localOptions, valueStr, valueKey])

  const renderLabel = (item: Item): string => {
    if (formatOptionParts) {
      const { code, description } = formatOptionParts(item)
      return description ? `${code} - ${description}` : code
    }
    if (formatOptionLabel) return formatOptionLabel(item)
    return safeToString(item[displayKey])
  }

  const renderOptionParts = (item: Item) => {
    if (formatOptionParts) return formatOptionParts(item)
    const label = renderLabel(item)
    return { code: label, description: '' }
  }

  const rawSelectedLabel = selectedItem
    ? renderLabel(selectedItem)
    : valueStr
      ? (fallbackLabel ?? placeholder)
      : placeholder

  const selectedLabel = truncateLabel(rawSelectedLabel, maxLabelLength)
  const tooltipLabel = selectedItem && tooltipKey ? safeToString(selectedItem[tooltipKey]) : ''
  const tooltipText = tooltipLabel || rawSelectedLabel
  const shouldShowTooltip =
    Boolean(maxLabelLength) &&
    rawSelectedLabel !== placeholder &&
    rawSelectedLabel.length > (maxLabelLength ?? 0) &&
    Boolean(tooltipText)

  const hasValue = Boolean(valueStr) && rawSelectedLabel !== placeholder

  useEffect(() => {
    if (!onSearchRef.current) return

    if (!search.trim()) {
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const fetchFunc = onSearchRef.current
        if (fetchFunc) {
          const res = fetchFunc(search)
          if (res instanceof Promise) {
            const data = await res
            if (Array.isArray(data)) {
              setLocalOptions(data)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching search results locally:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const triggerContent = (
    <button
      type='button'
      title={hasValue ? rawSelectedLabel : undefined}
      disabled={disabled}
      onClick={() => {
        if (!disabled) setOpen((v) => !v)
      }}
      className={cn(
        // base
        'group relative flex h-10 w-full items-center justify-between gap-2',
        'rounded-xl border border-border/70 bg-background px-3.5 shadow-sm',
        'text-sm ring-offset-background outline-none',
        'transition-all duration-150',
        // hover / focus
        !disabled && 'hover:border-border hover:shadow-md',
        !disabled && 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        // open state
        open && !disabled && 'border-ring/60 shadow-md ring-1 ring-ring/20',
        disabled && 'cursor-not-allowed bg-slate-100 text-slate-500 opacity-80',
      )}
    >
      <span
        className={cn(
          'flex-1 truncate text-left',
          hasValue ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {selectedLabel}
      </span>

      <span className='flex shrink-0 items-center gap-1'>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground/70 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </span>
    </button>
  )

  return (
    <div className='flex w-full min-w-0 flex-col gap-1.5'>
      {label && (
        <label className='text-xs font-medium tracking-wide text-muted-foreground/80 uppercase'>
          {label}
        </label>
      )}

      <Popover
        open={disabled ? false : open}
        onOpenChange={(next) => {
          if (disabled) return
          if (!next) {
            inputRef.current?.blur()
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
            setSearch('')
          } else {
            setTimeout(() => inputRef.current?.focus(), 0)
          }
          setOpen(next)
        }}
      >
        <div className='relative w-full'>
          {shouldShowTooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side='top'>
                  <p className='text-xs'>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
          )}

          {/* Botón X para limpiar */}
          {clearable && valueStr && (
            <button
              type='button'
              className={cn(
                'absolute right-8 top-1/2 z-10 -translate-y-1/2',
                'flex h-5 w-5 items-center justify-center rounded-md',
                'text-muted-foreground/60 transition-colors',
                'hover:bg-accent/80 hover:text-foreground',
              )}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                clearSelection()
              }}
              title='Limpiar selección'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          )}
        </div>

        <PopoverContent
          side='bottom'
          align='start'
          sideOffset={4}
          collisionPadding={12}
          sticky='partial'
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            'z-50 !w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-1.5rem)] p-0 shadow-xl',
            'rounded-xl border border-border/60',
            'overflow-hidden',
          )}
        >
          {/* Buscador */}
          <div className='border-b border-border/50 bg-muted/30 px-2.5 py-2'>
            <div className='relative'>
              <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60' />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar...'
                className={cn(
                  'h-8 pl-8 pr-3 text-sm',
                  'border-transparent bg-background/70 shadow-sm',
                  'focus-visible:border-border focus-visible:bg-background',
                )}
              />
              {search && (
                <button
                  type='button'
                  className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground'
                  onPointerDown={(e) => {
                    e.preventDefault()
                    setSearch('')
                    inputRef.current?.focus()
                  }}
                >
                  <X className='h-3 w-3' />
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className='max-h-[200px] overflow-y-auto overflow-x-hidden overscroll-contain p-1.5'>
            {loading ? (
              <div className='flex flex-col items-center justify-center min-h-[120px] py-8 text-center'>
                <span className='text-xs text-muted-foreground animate-pulse'>
                  Buscando...
                </span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className='flex flex-col items-center justify-center min-h-[120px] py-8 text-center'>
                <span className='text-xs text-muted-foreground'>
                  {search ? `Sin resultados para "${search}"` : 'Sin opciones disponibles'}
                </span>
              </div>
            ) : (
              filteredOptions.map((item, idx) => {
                const itemValue = safeToString(item[valueKey])
                const isSelected = itemValue === valueStr
                const optionParts = formatOptionParts ? renderOptionParts(item) : null

                return (
                  <button
                    key={itemValue || `${idx}`}
                    type='button'
                    className={cn(
                      'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2',
                      'text-left text-sm outline-none',
                      'transition-colors duration-100',
                      isSelected
                        ? 'bg-accent/70 text-foreground'
                        : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground',
                    )}
                    onClick={() => {
                      setOpen(false)
                      inputRef.current?.blur()
                      if (document.activeElement instanceof HTMLElement)
                        document.activeElement.blur()
                      onChange(itemValue)
                    }}
                  >
                    {/* Check indicator */}
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        'border transition-colors duration-100',
                        isSelected
                          ? 'border-foreground/30 bg-foreground/10'
                          : 'border-border/50 group-hover:border-border',
                      )}
                    >
                      {isSelected && <CheckIcon className='h-2.5 w-2.5' />}
                    </span>

                    {optionParts ? (
                      <span className='flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden py-0.5'>
                        <span className='truncate font-mono text-[11px] leading-tight text-muted-foreground'>
                          {optionParts.code}
                        </span>
                        {optionParts.description && (
                          <span className='line-clamp-2 text-xs leading-snug text-foreground'>
                            {optionParts.description}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className='flex-1 truncate'>{renderLabel(item)}</span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeToString(v: unknown): string {
  if (v === undefined || v === null) return ''
  return String(v)
}

function truncateLabel(label: string, maxLength?: number): string {
  if (!maxLength || maxLength <= 0) return label
  if (label.length <= maxLength) return label
  return `${label.slice(0, Math.max(0, maxLength - 1))}…`
}
