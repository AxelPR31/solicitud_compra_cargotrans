import { Injectable } from '@nestjs/common'
import { SoftlandCryptography } from './softland-cryptography'

@Injectable()
export class SoftlandPasswordService {
  private readonly crypto = new SoftlandCryptography()

  async verify(plainPassword: string, encryptedPassword: string) {
    try {
      // Nuevo: descifrado nativo (sin exe, cross-platform)
      const decrypted = this.crypto.decrypt(encryptedPassword, '')
      return (
        decrypted.trim().toLowerCase() === plainPassword.trim().toLowerCase()
      )
    } catch (error: any) {
      console.error('❌ Error ejecutando Softland EXE:', error)
      return false
    }
  }
}

