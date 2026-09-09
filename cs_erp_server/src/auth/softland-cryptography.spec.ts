import { SoftlandCryptography } from './softland-cryptography'

describe('SoftlandCryptography', () => {
  const crypto = new SoftlandCryptography()

  it('RandomKey decrypt(encrypt(x)) devuelve x (utf8)', () => {
    const samples = [
      'a',
      'admin',
      '123456',
      'áéíóúñ',
      'ClaveConEspacios  ',
      '🔥 unicode',
    ]

    for (const s of samples) {
      const enc = crypto.encryptString(s, '')
      expect(enc).toHaveLength(SoftlandCryptography.KEY_SIZE * 2)

      const dec = crypto.decrypt(enc, '')
      expect(dec).toBe(s)
    }
  })

  it('XTEA decrypt(encrypt(x)) devuelve x (ascii)', () => {
    const key = 'mi_clave'
    const samples = ['a', 'admin', 'abc', '1234', 'abcde']

    for (const s of samples) {
      const enc = crypto.encryptStringXTEA(s, key)
      const dec = crypto.decryptXTEA(enc, key)
      expect(dec).toBe(s)
    }
  })
})

