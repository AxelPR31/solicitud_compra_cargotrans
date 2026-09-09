# Frontend: implementación "Usuario de consulta" (solo reportes)

Este documento describe los cambios recomendados en el **frontend** para soportar la lógica implementada en el backend:

- `permisoTotal`: usuario con acceso global (todos los módulos/endpoints).
- `esConsulta`: usuario **solo-reportes**.

> Objetivo UX: si el usuario es `esConsulta`, el frontend debe **mostrar únicamente pantallas de reportes** y bloquear/ocultar el resto del sistema.

---

## 1) Contrato funcional (lo que debes asumir)

### Autenticación

- El backend autentica y mantiene sesión vía **cookie** (no necesitas guardar el token en `localStorage`).
- El backend puede responder:
  - **401**: no autenticado / sesión expirada.
  - **403**: autenticado pero sin permiso para ese endpoint.

### Autorización por rol

- `permisoTotal = true` → acceso a todo.
- `esConsulta = true` → acceso permitido **solo** a endpoints bajo `/reportes/**` y endpoints de auth (`/auth/**`).
- Usuario normal (`permisoTotal = false` y `esConsulta = false`) → acceso según proyectos asignados.

> Nota: si el usuario consulta no tiene proyectos asignados, algunos reportes pueden devolver vacío (por filtro de proyectos). Eso es esperado.

---

## 2) Cambios necesarios en el flujo de Login

### 2.1 Capturar flags del usuario

En la respuesta del login/refresh, el backend incluye (o debe incluir) los flags:

- `permisoTotal`
- `esConsulta`

**Acción**: guardar esos flags en tu estado global (store) junto con los datos del usuario.

Recomendación:

- `auth.user.permisoTotal`
- `auth.user.esConsulta`

### 2.2 Redirección post-login

Implementa redirección basada en rol:

- Si `auth.user.esConsulta === true`:
  - redirigir a la pantalla principal de reportes (ej: `/reportes`).
- Caso contrario:
  - redirigir al dashboard normal.

---

## 3) Enrutamiento (router): proteger rutas por rol

### 3.1 Guard / middleware de rutas

Agrega un guard de rutas del lado del frontend:

- Si `auth.user.esConsulta === true`:

  - permitir navegación **solo** a rutas UI de reportes (por ejemplo, prefijo `/reportes`).
  - bloquear el resto con:
    - redirect a `/reportes`
    - o mostrar una pantalla “Solo tiene acceso a reportes”.

- Si no está autenticado:
  - redirect a `/login`.

Ejemplos de whitelist para `esConsulta`:

- `/reportes`
- `/reportes/*`
- `/logout` (si existe)
- `/perfil` (solo si tu backend no lo bloquea y lo consideras necesario)

> Recomendación: mantén el whitelist lo más pequeño posible. Ideal: solo `/reportes/**`.

---

## 4) Navegación/UI: ocultar módulos para usuario consulta

Cuando `auth.user.esConsulta === true`:

- Oculta del menú lateral/superior:

- Muestra únicamente:

  - sección de **Reportes**
  - botón de cerrar sesión

- Opcional: mostrar un tag/label visible:
  - "Modo consulta" o "Solo reportes"

---

## 5) Cliente HTTP: manejo estandarizado de errores 401/403

### 5.1 401 (no autenticado)

- Limpiar estado de sesión local.
- Redirigir a `/login`.

### 5.2 403 (forbidden)

Caso típico para usuario consulta cuando intenta llamar a algo fuera de reportes.

**Acción recomendada**:

- Si `auth.user.esConsulta === true`:

  - mostrar mensaje: `Solo tiene acceso a reportes`.
  - redirigir a `/reportes`.

- Si no es consulta:
  - mostrar mensaje `No tiene permisos`.

**Mensaje del backend** esperado (ej):

- `Usuario de consulta: acceso permitido solo a reportes`

---

## 6) Pantallas de reportes: consideraciones específicas

### 6.1 Filtros de fechas

Muchos reportes reciben:

- `desde` (inicio del día)
- `hasta` (fin del día)

**Acción**:

- enviar fechas en formato ISO o `YYYY-MM-DD` (según tu frontend actual).
- validar que `desde <= hasta`.

### 6.2 Filtro por proyecto

Algunos endpoints filtran por proyectos asignados al usuario.

**Acción**:

- Si el usuario consulta no tiene proyectos asignados:
  - mostrar un estado vacío claro, ejemplo:
    - "No tiene proyectos asignados para consultar".

---

## 7) Pruebas rápidas (escenarios)

### Escenario A: usuario consulta

1. Login con usuario que esté en `CB_USUARIO_CONSULTA`.
2. Debe entrar y ir a `/reportes`.
3. Debe poder consultar reportes.
4. Si intenta navegar (UI o directo URL) a `/centrocosto`, `/proyecto`, etc.
   - el frontend debe bloquear/redirect.
   - si se fuerza la llamada API, el backend devolverá 403.

### Escenario B: usuario permiso total

1. Login con usuario en `cb_permiso_total`.
2. Debe ver todo.

### Escenario C: usuario normal sin proyectos

1. Login con usuario que NO sea consulta, NO tenga permiso total y NO tenga proyectos.
2. Debe fallar el login (401/forbidden según implementación del backend).

---

## 8) Checklist de implementación (corto)

- [ ] Guardar `permisoTotal` y `esConsulta` en el estado del frontend.
- [ ] Redirección post-login basada en `esConsulta`.
- [ ] Guard de rutas: si `esConsulta` permitir solo `/reportes/**`.
- [ ] Ocultar módulos del menú si `esConsulta`.
- [ ] Interceptor HTTP: 401 → login, 403 → mensaje + redirect (especial para consulta).
- [ ] Estado vacío claro cuando no haya proyectos asignados.

---

## Notas

- Si tu frontend consume endpoints que no están bajo `/reportes/**` pero conceptualmente son “reportes”, es mejor **moverlos** / exponerlos bajo el controlador de reportes, para que el comportamiento sea consistente.

