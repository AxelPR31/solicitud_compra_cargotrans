# Documentación de Autenticación

## Overview

El sistema de autenticación utiliza usuarios de Softland (`USUARIO` en esquema `ERPADMIN`) para gestionar el acceso a la aplicación. El flujo se basa en JWT tokens y el tipo `UserPrincipal` para representar al usuario autenticado.

## UserPrincipal Interface

El tipo `UserPrincipal` se define en `src/auth/types/user-principal.ts` y representa al usuario autenticado en el sistema:

```typescript
export interface UserPrincipal {
  usuario: string          // Usuario de Softland
  idUser: number           // ID (siempre 0 para Softland)
  nombre: string           // Nombre del usuario
  tipoUsuario: string      // 'SOFTLAND'
  idCliente: string        // Cliente (vacío para Softland)
  caja: string             // Caja (vacío para Softland)
  canViewOtherCashiers: boolean
  isAdmin: boolean
  consecutivo?: number
}
```

## Flujo de Autenticación

### 1. Login (`POST /auth/signin`)

**Endpoint:** `POST /auth/signin`

**Request Body:**
```typescript
{
  usuario: string,
  contrasena: string
}
```

**Flujo:**
1. `auth.controller.signin()` recibe las credenciales
2. `auth.service.signin()` busca el usuario en la tabla `USUARIO` (Softland)
3. `SoftlandPasswordService.verify()` valida la contraseña usando el ejecutable `DecryptClaveSoftland.exe`
4. Si la contraseña es válida, `buildSoftlandPrincipal()` construye el objeto `UserPrincipal`
5. Se genera un JWT token con el payload `{ id: usuario }`
6. Se retorna `{ user: UserPrincipal, token }`
7. El token se guarda en una cookie HTTP-only

**Response:**
```typescript
{
  user: UserPrincipal,
  token: string
}
```

### 2. Request Autenticado

Cualquier endpoint protegido con `@UseGuards(AuthGuard)` sigue este flujo:

**Flujo:**
1. `AuthGuard.canActivate()` intercepta la request
2. Extrae el token de la cookie `AUTH_KEY`
3. Verifica el JWT usando `JwtService.verify()`
4. Busca el usuario en `USUARIO` (Softland) usando el `id` del payload
5. Construye el objeto `UserPrincipal` con los datos del usuario
6. Asigna el objeto a `request.user`
7. El decorador `@User()` inyecta el `UserPrincipal` en los parámetros del controlador

**Ejemplo de uso en controlador:**
```typescript
@UseGuards(AuthGuard)
@Get()
async me(@User() user: UserPrincipal) {
  return user
}
```

### 3. Obtener Usuario Actual (`GET /auth`)

**Endpoint:** `GET /auth`

**Flujo:**
1. `AuthGuard` valida el token y construye `UserPrincipal`
2. `auth.controller.me(@User() user: UserPrincipal)` recibe el usuario
3. Retorna el `UserPrincipal` sin modificaciones

**Response:**
```typescript
UserPrincipal
```

### 4. Refresh Token (`POST /auth/refresh`)

**Endpoint:** `POST /auth/refresh`

**Flujo:**
1. `AuthGuard` valida el token actual
2. `auth.controller.refreshToken(@User() user: UserPrincipal)` recibe el usuario actual
3. `auth.service.refreshToken(user.usuario)` busca el usuario en `USUARIO`
4. `buildSoftlandPrincipal()` construye un nuevo `UserPrincipal`
5. Se genera un nuevo JWT token
6. Se actualiza la cookie con el nuevo token
7. Retorna `{ user: UserPrincipal, token }`

**Response:**
```typescript
{
  user: UserPrincipal,
  token: string
}
```

### 5. Logout (`POST /auth/logout`)

**Endpoint:** `POST /auth/logout`

**Flujo:**
1. `AuthGuard` valida el token
2. `auth.controller.logout(@User() user: UserPrincipal)` recibe el usuario
3. Se limpia la cookie `AUTH_KEY`

**Response:** No content

## Componentes

### AuthService (`src/auth/auth.service.ts`)

- `signin(body: SignInDto)`: Autentica usuario y genera token
- `refreshToken(userId: string)`: Refresca el token de un usuario
- `buildSoftlandPrincipal(softlandUser: UsuarioSoftland): UserPrincipal`: Construye el objeto UserPrincipal desde UsuarioSoftland

### AuthGuard (`src/core/guards/auth.guard.ts`)

- `canActivate(context: ExecutionContext)`: Valida el JWT y construye UserPrincipal
- Asigna el UserPrincipal a `request.user`
- Proporciona logging detallado de intentos de autenticación

### AuthController (`src/auth/auth.controller.ts`)

- `signin()`: Endpoint de login
- `me()`: Endpoint para obtener usuario actual
- `refreshToken()`: Endpoint para refrescar token
- `logout()`: Endpoint para cerrar sesión

### SoftlandPasswordService (`src/auth/softland-password.service.ts`)

- `verify(plainPassword: string, encryptedPassword: string)`: Valida la contraseña usando el ejecutable de Softland
- Soporta Windows (directo) y Mac/Linux (via Wine)

### User Decorator (`src/core/decorators/user.decorator.ts`)

- Inyecta el objeto `request.user` (UserPrincipal) en los parámetros del controlador

## Seguridad

- **JWT Tokens:** Los tokens tienen un tiempo de expiración configurado en `constants.EXPIRES_IN`
- **HTTP-Only Cookies:** Los tokens se almacenan en cookies HTTP-only para prevenir XSS
- **Secure Flag:** En producción, las cookies usan el flag `secure` (HTTPS only)
- **Password Encryption:** Las contraseñas de Softland están encriptadas y se validan usando el ejecutable oficial de Softland
- **Token Expiration Warning:** El AuthGuard advierte cuando el token está cerca de expirar (menos de 5 minutos)

## Migración desde UsuarioCaja

El sistema anteriormente usaba `UsuarioCaja` para la autenticación. Ahora usa directamente `UsuarioSoftland` de la base de datos de Softland:

- **UsuarioCaja:** Eliminado del sistema
- **UsuarioSoftland:** Entidad de Softland (`ERPADMIN.USUARIO`)
- **UserPrincipal:** Interface compartida para representar al usuario autenticado

## Configuración

Las siguientes constantes en `src/core/constants.ts` controlan la autenticación:

- `AUTH_KEY`: Nombre de la cookie para el token
- `AUTH_PREFIX`: Prefijo del token (ej: "Bearer")
- `JWT_SECRET`: Secreto para firmar los JWT
- `EXPIRES_IN`: Tiempo de expiración del token
- `SOFTLAND_DECRYPT_EXE_PATH`: Ruta al ejecutable para desencriptar contraseñas de Softland
- `SOFTLAND_DECRYPT_KEY`: Clave opcional para el ejecutable de desencriptación
