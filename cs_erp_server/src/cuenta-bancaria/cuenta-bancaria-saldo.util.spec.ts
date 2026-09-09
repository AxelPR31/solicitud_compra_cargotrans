import {
  calcDeltaSaldoCuenta,
  calcNuevoSaldoCuenta,
  TIPOS_AUMENTAN_SALDO,
  TIPOS_DISMINUYEN_SALDO,
} from './cuenta-bancaria-saldo.util'

describe('calcDeltaSaldoCuenta', () => {
  it('resta saldo en egresos (CHQ)', () => {
    expect(calcDeltaSaldoCuenta('CHQ', 25.12)).toBe(-25.12)
  })

  it('suma saldo en ingresos (DEP)', () => {
    expect(calcDeltaSaldoCuenta('DEP', 100)).toBe(100)
  })

  it('conserva decimales en el delta (DEP 20.30)', () => {
    expect(calcDeltaSaldoCuenta('DEP', 20.3)).toBe(20.3)
  })

  it('conserva decimales al recalcular saldo', () => {
    expect(calcNuevoSaldoCuenta(0, 20.3)).toBe(20.3)
    expect(calcNuevoSaldoCuenta(16, -15.7)).toBe(0.3)
  })

  it('revierte el efecto al anular', () => {
    expect(calcDeltaSaldoCuenta('CHQ', 25.12, true)).toBe(25.12)
    expect(calcDeltaSaldoCuenta('DEP', 100, true)).toBe(-100)
  })

  it('retorna 0 si monto es cero', () => {
    expect(calcDeltaSaldoCuenta('CHQ', 0)).toBe(0)
  })

  it('soporta todos los tipos definidos', () => {
    for (const tipo of TIPOS_DISMINUYEN_SALDO) {
      expect(calcDeltaSaldoCuenta(tipo, 10)).toBeLessThan(0)
    }
    for (const tipo of TIPOS_AUMENTAN_SALDO) {
      expect(calcDeltaSaldoCuenta(tipo, 10)).toBeGreaterThan(0)
    }
  })
})
