# Documentación: Sistema de Permisos por Proyecto

## Overview

El sistema implementa control de acceso basado en proyectos para restringir qué cuentas bancarias y proyectos puede ver/operar cada usuario.

## Recursos Fundamentales

### 1. CB_USUARIOS_PROYECTO (usuarios-proyecto)

Relaciona usuarios de Softland con los proyectos a los que tienen acceso.

**Campos:**

- `USUARIO`: Nombre de usuario de Softland
- `CODIGO_PROYECTO`: Código del proyecto asignado

### 2. CB_PROYECTO_CUENTA_BANCARIA (proyecto-cuenta-bancaria)

Relaciona proyectos con las cuentas bancarias que pueden usar.

**Campos:**

- `CUENTA_BANCO`: Número de cuenta bancaria
- `CODIGO_PROYECTO`: Código del proyecto

### 3. CB_ENT_PROY (cb-ent-proy)

Registra entradas a las cuentas bancarias según el proyecto.

## Lógica de Permisos

### Regla 1: Usuarios solo ven sus proyectos asignados

Un usuario solo puede trabajar en los proyectos que están registrados en `CB_USUARIOS_PROYECTO` para su usuario.

### Regla 2: Cuentas bancarias filtradas por proyecto

Cuando se selecciona un proyecto, solo deben mostrarse las cuentas bancarias asignadas a ese proyecto en `CB_PROYECTO_CUENTA_BANCARIA`.

### Regla 3: Validación en operaciones

Antes de crear facturas o entradas, el backend debe validar que:

- El usuario tiene acceso al proyecto seleccionado
- La cuenta bancaria seleccionada pertenece al proyecto

## Endpoints Disponibles

> **Actualización (mayo 2026): integración “sin endpoints nuevos”**
>
> Para reducir trabajo en frontend, el backend ahora aplica el sistema de permisos **directamente en los GET existentes** de:
>
> - `GET /proyecto`
> - `GET /proyecto/:codigo`
> - `GET /cuenta-bancaria`
> - `GET /cuenta-bancaria/:cuentaBanco`
>
> Esto significa que el frontend puede seguir usando los endpoints “normales” y recibirá únicamente lo permitido para el usuario autenticado.
>
> **La identidad del usuario se obtiene del token JWT guardado en cookie HTTP-only** (cookie `AUTH_KEY`, ver `docs/AUTENTICACION.md`).
>
> - Si el usuario no está autenticado: el backend responderá `403`.
> - Si el recurso existe pero no está permitido por permisos: el backend responderá `403`.

### Usuarios-Proyecto

#### Obtener proyectos de un usuario

```
GET /usuarios-proyecto/usuario/{usuario}
Query Params: limit, offset
```

**Respuesta:** Array de relaciones usuario-proyecto con paginación

#### Obtener solo códigos de proyectos de un usuario

```
GET /usuarios-proyecto/usuario/{usuario}/proyectos
```

**Respuesta:** Array de strings con códigos de proyecto

```json
["COD-001", "COD-002", "COD-003"]
```

### Proyecto-Cuenta-Bancaria

#### Obtener cuentas por proyecto

```
GET /proyecto-cuenta-bancaria/proyecto/{codigoProyecto}
Query Params: limit, offset
```

**Respuesta:** Array de relaciones proyecto-cuenta con paginación

#### Obtener cuentas bancarias únicas por proyecto

```
GET /proyecto-cuenta-bancaria/proyecto/{codigoProyecto}/cuentas
```

**Respuesta:** Array de strings con números de cuenta

```json
["001-0023456-7", "001-0098765-4"]
```

#### Obtener cuentas de un usuario (a través de sus proyectos)

```
GET /proyecto-cuenta-bancaria/usuario/{usuario}
Query Params: limit, offset
```

**Respuesta:** Array de relaciones proyecto-cuenta filtradas por los proyectos del usuario

## Flujo de Implementación en Frontend

### Enfoque recomendado (sin endpoints extra)

El frontend **no necesita** implementar rutas nuevas como `/usuarios-proyecto/usuario/:usuario/proyectos` ni `/proyecto-cuenta-bancaria/proyecto/:codigo/cuentas` para que el filtrado funcione.

En su lugar:

1. El frontend hace login (como siempre).
2. El backend guarda el token en cookie HTTP-only.
3. En adelante, el frontend usa los GET existentes (`/proyecto`, `/cuenta-bancaria`) y el backend responde ya filtrado.

### Requisito clave: enviar cookies en requests

Si el frontend y el backend están en **orígenes distintos** (dominio o puerto distinto), el frontend debe enviar cookies:

```typescript
// fetch
await fetch('/proyecto', {
  credentials: 'include',
})

// axios
await axios.get('/proyecto', {
  withCredentials: true,
})
```

Si frontend y backend están en el **mismo origen**, normalmente no requiere cambios.

### Paso 1: Cargar proyectos disponibles (ya filtrados por usuario)

```typescript
// Después del login, obtener los proyectos.
// El backend devuelve únicamente los proyectos asignados al usuario autenticado.
const response = await fetch(`/proyecto`, { credentials: 'include' })
const proyectos = await response.json()
```

### Paso 2: Selector de proyecto

```typescript
// Mostrar dropdown con los proyectos del usuario
<select onChange={handleProyectoChange}>
  {proyectos.map(codigo => (
    <option key={codigo} value={codigo}>{codigo}</option>
  ))}
</select>
```

### Paso 3: Cargar cuentas bancarias (ya filtradas por permisos)

```typescript
// Opción A (simple): cargar todas las cuentas permitidas para el usuario
// y filtrar en memoria por el proyecto seleccionado si el UI lo requiere.
// El backend devuelve únicamente cuentas que pertenecen a algún proyecto del usuario.
const cargarCuentasPermitidas = async () => {
  const response = await fetch(`/cuenta-bancaria`, { credentials: 'include' })
  return await response.json()
}

// Opción B (si el UI necesita que se refresquen al cambiar de proyecto):
// el backend no requiere endpoint nuevo; el frontend puede filtrar el listado.
// (Si se requiere exactitud por proyecto 1:1, se pueden usar los endpoints específicos
// documentados arriba, pero ya no son obligatorios.)
```

### Paso 4: Selector de cuenta bancaria

```typescript
<select>
  {cuentasBancarias.map(cuenta => (
    <option key={cuenta} value={cuenta}>{cuenta}</option>
  ))}
</select>
```

### Paso 5: Enviar datos al backend

```typescript
const crearFactura = async (data) => {
  const payload = {
    ...data,
    codigoProyecto: proyectoSeleccionado,
    cuentaBanco: cuentaSeleccionada,
  }
  // El backend validará que el usuario tenga acceso al proyecto
  // y que la cuenta pertenezca al proyecto
  await fetch('/cb-factura', { method: 'POST', body: JSON.stringify(payload) })
}
```

## Validaciones en Frontend (Opcionales pero recomendadas)

### Validar cambio de proyecto

```typescript
const handleProyectoChange = (nuevoProyecto) => {
  // Limpiar cuenta bancaria seleccionada (ya no es válida para el nuevo proyecto)
  setCuentaSeleccionada(null)
  setCuentasBancarias([])
  cargarCuentasDelProyecto(nuevoProyecto)
}
```

### Validar antes de enviar

```typescript
const validarFormulario = () => {
  if (!proyectoSeleccionado) {
    throw new Error('Debe seleccionar un proyecto')
  }
  if (!cuentaSeleccionada) {
    throw new Error('Debe seleccionar una cuenta bancaria')
  }
  if (!cuentasBancarias.includes(cuentaSeleccionada)) {
    throw new Error('La cuenta seleccionada no pertenece al proyecto')
  }
}
```

## Notas Importantes

1. **Orden de rutas:** Los nuevos endpoints con parámetros (`/usuario/:usuario`, `/proyecto/:codigoProyecto`) deben colocarse ANTES de las rutas con parámetros genéricos (`/:id`) en el controlador para evitar conflictos de routing.

2. **Autenticación:** Todos estos endpoints se usan con la cookie HTTP-only (`AUTH_KEY`). El backend usa el decorator `@User()` para obtener el `UserPrincipal` autenticado.

3. **Paginación:** Los endpoints que soportan paginación aceptan `limit` y `offset` como query params.

4. **Backend validation:** Aunque el frontend filtre las opciones, el backend DEBE validar permisos en operaciones (create/update).

- Además, los GET “normales” (`/proyecto`, `/cuenta-bancaria`) ya vienen filtrados por permisos.

## Ejemplo Completo de Flujo

```typescript
// 1. Usuario hace login
const { user } = await login(credentials)

// 2. Cargar proyectos disponibles (ya filtrados por usuario autenticado)
const proyectos = await fetch(`/proyecto`, {
  credentials: 'include',
}).then((r) => r.json())

// 3. Usuario selecciona proyecto "COD-001"
const proyectoSeleccionado = 'COD-001'

// 4. Cargar cuentas bancarias permitidas
const cuentas = await fetch(`/cuenta-bancaria`, {
  credentials: 'include',
}).then((r) => r.json())
// Resultado: array de cuentas bancarias permitidas por permisos.

// 5. Usuario selecciona cuenta "001-0023456-7"
const cuentaSeleccionada = '001-0023456-7'

// 6. Usuario crea factura con esos datos
await fetch('/cb-factura', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    codigoProyecto: proyectoSeleccionado,
    cuentaBanco: cuentaSeleccionada,
    // ... otros datos de la factura
  }),
})
```

## Servicios Backend Disponibles

### UsuariosProyectoService

- `findProyectosByUsuario(usuario, paginationDto)`: Obtiene relaciones con paginación
- `usuarioTieneAccesoProyecto(usuario, codigoProyecto)`: Valida acceso (boolean)
- `getProyectosCodesByUsuario(usuario)`: Obtiene solo códigos de proyecto

### ProyectoCuentaBancariaService

- `findCuentasByProyecto(codigoProyecto, paginationDto)`: Obtiene relaciones con paginación
- `getCuentasBancariasUnicasByProyecto(codigoProyecto)`: Obtiene solo números de cuenta
- `findCuentasByUsuario(usuario, paginationDto)`: Obtiene cuentas a través de proyectos del usuario
- `cuentaPerteneceProyecto(cuentaBanco, codigoProyecto)`: Valida pertenencia (boolean)

