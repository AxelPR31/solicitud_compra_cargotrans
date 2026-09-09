/*
 * Port a TypeScript del algoritmo encontrado en el .exe (original C#).
 *
 * Nota:
 * - Se preservan operaciones byte/uint con máscaras para replicar overflow de C#.
 * - Esta clase implementa tanto el esquema "RandomKey" (KeySize=34) como XTEA.
 */

export class SoftlandCryptography {
  static readonly KEY_SIZE = 34

  private static bSeeded = false
  private static rand: () => number

  private static readonly aucValueMap = new Uint32Array([
    14, 8, 10, 1, 7, 6, 15, 2, 0, 9, 11, 12, 3, 13, 5, 4,
  ])

  private static readonly aucReverseValueMap = new Uint32Array([
    8, 3, 7, 12, 15, 14, 5, 4, 1, 9, 2, 10, 11, 13, 0, 6,
  ])

  // ---------------------------------------------------------------------------
  // Public API (equivalente al C#)
  // ---------------------------------------------------------------------------

  /**
   * C# EncryptString(Data, Key) ignora Key y usa RandomKey + KeySize=34.
   * Devuelve hex sin % (ej: "0A1B...").
   */
  encryptString(data: string, _key: string): string {
    const dest = new Uint8Array(SoftlandCryptography.KEY_SIZE)
    this.encryptStringRandomKeyString(data, dest, SoftlandCryptography.KEY_SIZE)

    let out = ''
    for (let i = 0; i < dest.length; i++) {
      out += dest[i].toString(16).toUpperCase().padStart(2, '0')
    }
    return out
  }

  decrypt(dataHex: string, _key: string): string {
    const dest = new Uint8Array(SoftlandCryptography.KEY_SIZE)

    // C# itera KeySize*2 y hace Uri.HexUnescape
    for (let i = 0; i < SoftlandCryptography.KEY_SIZE * 2; i += 2) {
      const byteHex = dataHex.substring(i, i + 2)
      dest[i / 2] = parseInt(byteHex, 16) & 0xff
    }

    return this.decryptStringRandomKeyBytes(dest, SoftlandCryptography.KEY_SIZE)
  }

  encryptStringXTEA(data: string, key: string): string {
    if (data.length === 0) {
      throw new Error('Data must be at least 1 character in length.')
    }

    const k = this.formatKey(key)

    if (data.length % 2 !== 0) {
      data += '\0'
    }

    const bytes = Buffer.from(data, 'ascii')

    let out = ''
    const v = new Uint32Array(2)

    for (let i = 0; i < bytes.length; i += 2) {
      v[0] = bytes[i]
      v[1] = bytes[i + 1]
      this.code(v, k)
      out += SoftlandCryptography.convertUIntToString(v[0])
      out += SoftlandCryptography.convertUIntToString(v[1])
    }

    return out
  }

  decryptXTEA(data: string, key: string): string {
    const k = this.formatKey(key)

    const v = new Uint32Array(2)
    const outBytes = new Uint8Array((data.length / 8) * 2)

    let p = 0
    for (let i = 0; i < data.length; i += 8) {
      v[0] = SoftlandCryptography.convertStringToUInt(data.substring(i, i + 4))
      v[1] = SoftlandCryptography.convertStringToUInt(
        data.substring(i + 4, i + 8),
      )
      this.decode(v, k)
      outBytes[p++] = v[0] & 0xff
      outBytes[p++] = v[1] & 0xff
    }

    let out = Buffer.from(outBytes).toString('ascii')
    if (out.length && out[out.length - 1] === '\0') {
      out = out.substring(0, out.length - 1)
    }
    return out
  }

  // ---------------------------------------------------------------------------
  // RandomKey scheme
  // ---------------------------------------------------------------------------

  encryptStringRandomKeyString(
    src: string,
    destBytes: Uint8Array,
    destLen: number,
  ): boolean {
    const bytes = Buffer.from(src, 'utf8')
    const srcU32 = new Uint32Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) srcU32[i] = bytes[i]

    const destU32 = new Uint32Array(destBytes.length)

    const ok = this.encryptStringRandomKeyU32(srcU32, destU32, destLen)

    for (let i = 0; i < destBytes.length; i++) {
      destBytes[i] = destU32[i] & 0xff
    }

    return ok
  }

  decryptStringRandomKeyBytes(src: Uint8Array, srcLen: number): string {
    const srcU32 = new Uint32Array(src.length)
    for (let i = 0; i < src.length; i++) srcU32[i] = src[i]

    const plainU32 = this.decryptStringRandomKeyU32(srcU32, srcLen)

    const plainBytes = new Uint8Array(plainU32.length)
    for (let i = 0; i < plainU32.length; i++) plainBytes[i] = plainU32[i] & 0xff

    return Buffer.from(plainBytes).toString('utf8')
  }

  encryptStringRandomKeyU32(
    src: Uint32Array,
    dest: Uint32Array,
    destLen: number,
  ): boolean {
    const len = src.length
    if (len > destLen + 4) return false

    SoftlandCryptography.seedRandom()

    // C# rand.Next(255) => 0..254
    let wKey = (SoftlandCryptography.rand() | 0) & 0xff

    const ok = this.encryptStringU32(src, dest, destLen - 2, wKey)

    wKey = (wKey ^ 0xfebe) & 0xffff
    dest[destLen - 1] = (wKey >>> 8) & 0xff
    dest[destLen - 2] = wKey & 0xff

    return ok
  }

  decryptStringRandomKeyU32(src: Uint32Array, srcLen: number): Uint32Array {
    let wKey = ((src[srcLen - 1] & 0xff) << 8) >>> 0
    wKey |= src[srcLen - 2] & 0xff
    wKey = (wKey ^ 0xfebe) & 0xffff

    return this.decryptStringU32(src, srcLen - 2, wKey)
  }

  encryptStringU32(
    src: Uint32Array,
    dest: Uint32Array,
    destLen: number,
    wKey: number,
  ): boolean {
    const len = src.length
    if (len > destLen + 2) return false

    SoftlandCryptography.seedRandom()

    // fill random for i+=2
    for (let i = 0; i < destLen; i += 2) {
      dest[i] = (SoftlandCryptography.rand() | 0) & 0xff
    }

    this.encryptData(src, dest, len, wKey)

    const marker = ((len ^ wKey) >>> 0) & 0xffff
    dest[destLen - 1] = marker & 0xff
    dest[destLen - 2] = (marker >>> 8) & 0xff

    return true
  }

  decryptStringU32(
    src: Uint32Array,
    srcLen: number,
    wKey: number,
  ): Uint32Array {
    let len = src[srcLen - 1] & 0xff
    len |= (src[srcLen - 2] & 0xff) << 8
    len = (len ^ wKey) & 0xffff

    const dest = new Uint32Array(len)
    this.decryptData(src, dest, len, wKey)
    return dest
  }

  encryptData(
    src: Uint32Array,
    dest: Uint32Array,
    length: number,
    wKey: number,
  ) {
    for (let i = 0; i < length; i++) {
      const keyByte = (i & 1) === 1 ? (wKey >>> 8) & 0xff : wKey & 0xff
      dest[i] =
        (keyByte ^
          SoftlandCryptography.rotateRight(
            SoftlandCryptography.mapByteValue(src[i] & 0xff),
            i,
          )) &
        0xff
    }
  }

  decryptData(
    src: Uint32Array,
    dest: Uint32Array,
    length: number,
    wKey: number,
  ) {
    for (let i = 0; i < length; i++) {
      const keyByte = (i & 1) === 1 ? (wKey >>> 8) & 0xff : wKey & 0xff
      dest[i] =
        SoftlandCryptography.unmapByteValue(
          SoftlandCryptography.rotateLeft((keyByte ^ src[i]) & 0xff, i),
        ) & 0xff
    }
  }

  // ---------------------------------------------------------------------------
  // XTEA helpers
  // ---------------------------------------------------------------------------

  formatKey(key: string): Uint32Array {
    if (key.length === 0) {
      throw new Error('Key must be between 1 and 16 characters in length')
    }

    key = (key + ' '.repeat(16)).substring(0, 16)

    const out = new Uint32Array(4)
    let p = 0
    for (let i = 0; i < key.length; i += 4) {
      out[p++] = SoftlandCryptography.convertStringToUInt(
        key.substring(i, i + 4),
      )
    }
    return out
  }

  private code(v: Uint32Array, k: Uint32Array) {
    let v0 = v[0] >>> 0
    let v1 = v[1] >>> 0
    let sum = 0 >>> 0
    const delta = 0x9e3779b9 >>> 0
    let rounds = 32

    while (rounds-- !== 0) {
      v0 = (v0 + ((((v1 << 4) ^ (v1 >>> 5)) + v1) ^ (sum + k[sum & 3]))) >>> 0
      sum = (sum + delta) >>> 0
      v1 =
        (v1 +
          ((((v0 << 4) ^ (v0 >>> 5)) + v0) ^ (sum + k[(sum >>> 11) & 3]))) >>>
        0
    }

    v[0] = v0
    v[1] = v1
  }

  private decode(v: Uint32Array, k: Uint32Array) {
    let v0 = v[0] >>> 0
    let v1 = v[1] >>> 0
    let sum = 0xc6ef3720 >>> 0
    const delta = 0x9e3779b9 >>> 0
    let rounds = 32

    while (rounds-- !== 0) {
      v1 =
        (v1 -
          ((((v0 << 4) ^ (v0 >>> 5)) + v0) ^ (sum + k[(sum >>> 11) & 3]))) >>>
        0
      sum = (sum - delta) >>> 0
      v0 = (v0 - ((((v1 << 4) ^ (v1 >>> 5)) + v1) ^ (sum + k[sum & 3]))) >>> 0
    }

    v[0] = v0
    v[1] = v1
  }

  static convertStringToUInt(input: string): number {
    // little-endian 4 chars
    const c0 = input.charCodeAt(0) & 0xff
    const c1 = input.charCodeAt(1) & 0xff
    const c2 = input.charCodeAt(2) & 0xff
    const c3 = input.charCodeAt(3) & 0xff

    return (c0 | (c1 << 8) | (c2 << 16) | (c3 << 24)) >>> 0
  }

  static convertUIntToString(input: number): string {
    const u = input >>> 0
    return String.fromCharCode(
      u & 0xff,
      (u >>> 8) & 0xff,
      (u >>> 16) & 0xff,
      (u >>> 24) & 0xff,
    )
  }

  // ---------------------------------------------------------------------------
  // Byte transforms
  // ---------------------------------------------------------------------------

  private static seedRandom() {
    if (!SoftlandCryptography.bSeeded) {
      // Usamos LCG estable para evitar diferencias entre runtimes.
      let seed = Number(BigInt(Date.now()) & BigInt(0xffffffff)) >>> 0
      SoftlandCryptography.rand = () => {
        // Numerical Recipes LCG
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        // emula Next(255): 0..254
        return seed % 255
      }
      SoftlandCryptography.bSeeded = true
    }
  }

  private static mapByteValue(v: number): number {
    return (
      (SoftlandCryptography.aucValueMap[v & 0x0f] |
        (SoftlandCryptography.aucValueMap[(v >>> 4) & 0x0f] << 4)) &
      0xff
    )
  }

  private static unmapByteValue(v: number): number {
    return (
      (SoftlandCryptography.aucReverseValueMap[v & 0x0f] |
        (SoftlandCryptography.aucReverseValueMap[(v >>> 4) & 0x0f] << 4)) &
      0xff
    )
  }

  private static rotateRight(v: number, bits: number): number {
    bits %= 8
    return ((v >>> bits) | ((v << (8 - bits)) & 0xff)) & 0xff
  }

  private static rotateLeft(v: number, bits: number): number {
    bits %= 8
    return (((v << bits) & 0xff) | (v >>> (8 - bits))) & 0xff
  }
}

