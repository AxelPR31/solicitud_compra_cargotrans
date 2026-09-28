# Manual de instalación — Módulo Solicitud de Compra (CS ERP)

## 1. Resumen

| Componente        | Descripción                                 | Puerto sugerido       |
| ----------------- | ------------------------------------------- | --------------------- |
| **API**           | Servicio backend Node.js (NestJS compilado) | `7500` (configurable) |
| **Web**           | Interfaz Next.js (compilada)                | `3000` (configurable) |
| **Base de datos** | Microsoft SQL Server (Softland)             | `1433` (típico)       |

Flujo: **Navegador → Web → API → SQL Server**.  
Autenticación con **usuarios Softland**.

---

## 2. Requisitos

- **Sistema operativo:** Windows Server 2019 o superior (64 bits)
- **Node.js:** versión **20 LTS** — [https://nodejs.org](https://nodejs.org)
- **npm:** incluido con Node (verificar con `node -v` y `npm -v`).
- **Red:** el servidor del API debe alcanzar el SQL Server (reglas de firewall).
- **HTTPS:** recomendado en producción (IIS, nginx u otro reverse proxy).
- **Softland:** usuario SQL con permisos acordados con el DBA; usuarios ERP para iniciar sesión en la aplicación.

## 3. Paquetes recibidos

1. `CS_SolicitudCompra_API.zip`
2. `CS_SolicitudCompra_WEB.zip`

Carpetas sugeridas en el servidor:

- `C:\Apps\CS_SolicitudCompra\api`
- `C:\Apps\CS_SolicitudCompra\web`

(Ajustar rutas según la política interna de TI.)

---

## 4. Instalación del API

### 4.1 Descomprimir

1. Crear la carpeta del API (ej. `C:\Apps\CS_SolicitudCompra\api`).
2. Extraer el contenido del ZIP del API en esa carpeta.
3. Debe existir la carpeta `dist\` y el archivo `package.json`.

### 4.2 Instalar dependencias (solo producción)

Abrir **Símbolo del sistema** o **PowerShell**:

```bat
cd C:\Apps\CS_SolicitudCompra\api
npm ci --omit=dev
```

- Usar **`npm ci`** para respetar el archivo de bloqueo (`package-lock.json`) del proveedor.
- La primera instalación puede tardar varios minutos.
- Si falla un módulo nativo (por ejemplo `bcrypt`), confirmar **Node 20 de 64 bits** y permisos de escritura en la carpeta.

### 4.3 Configurar variables de entorno

1. Copiar `.env.template` a `.env` en la misma carpeta del API.
2. Completar los valores (anexo confidencial del proveedor o DBA):

| Variable                      | Descripción                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| `DATABASE_HOST`               | Servidor SQL                                                              |
| `DATABASE_PORT`               | Puerto SQL (ej. `1433`)                                                   |
| `DATABASE_USER`               | Usuario SQL                                                               |
| `DATABASE_PASSWORD`           | Contraseña SQL                                                            |
| `DATABASE_NAME`               | Base de datos                                                             |
| `DATABASE_SCHEMA`             | Esquema                                                                   |
| `SERVER_PORT`                 | Puerto en el que escucha el API (ej. `7500`)                              |
| `NODE_ENV`                    | `production`                                                              |
| `JWT_SECRET`                  | Cadena larga y aleatoria (**secreto**; no compartir)                      |
| `EXPIRES_IN`                  | Vigencia del token (ej. `24h`)                                            |
| `CORS_ADDITIONAL_ORIGIN`      | URL **exacta** del frontend. Varios orígenes separados por coma si aplica |
| `SOFTLAND_DECRYPT_EXE_PATH`   | Ruta al ejecutable de desencriptación (solo si aplica)                    |
| `SOFTLAND_DECRYPT_KEY`        | Clave del ejecutable (solo si aplica)                                     |
| `SOFTLAND_DECRYPT_TIMEOUT_MS` | Tiempo máximo en ms (opcional, ej. `3000`)                                |

**CORS:** el navegador solo podrá consumir el API si el origen de la web (protocolo, dominio y puerto) está permitido, configurar variable de entorno `CORS_ADDITIONAL_ORIGIN`

### 4.4 Probar arranque manual

```bat
cd C:\Apps\CS_SolicitudCompra\api
npm run start:prod
```

Equivalente: `node dist\main.js`

- El servicio debe quedar escuchando en el puerto definido en `SERVER_PORT`.
- Detener con `Ctrl+C` tras la prueba.

### 4.5 Servicio permanente (Windows)

Registrar el API como servicio (NSSM, PM2 para Windows, o herramienta estándar de TI) con:

- **Directorio de trabajo:** carpeta del API
- **Comando:** `node dist\main.js` o `npm run start:prod`
- **Reinicio automático** ante fallo

---

## 5. Instalación de la interfaz web

### 5.1 Descomprimir

1. Crear la carpeta web (ej. `C:\Apps\CS_SolicitudCompra\web`).
2. Extraer el ZIP web. Debe incluir `.next\`, `public\`, `package.json`, `next.config.ts` y `package-lock.json`.

### 5.2 Instalar dependencias

```bat
cd C:\Apps\CS_SolicitudCompra\web
npm ci --omit=dev
```

### 5.3 URL del API

Con **IIS como proxy inverso** (recomendado): no se configura URL del API en el frontend. Next escucha en `127.0.0.1:3000` y IIS reenvía las rutas del API al puerto `7500`. Ver archivo **`docs/IIS_PROXY.md`** y el archivo **`iis/web.config`**.

### 5.4 Probar arranque manual

```bat
cd C:\Apps\CS_SolicitudCompra\web
set PORT=3000
npm run start
```

Abrir en navegador: `http://SERVIDOR:3000` (o la URL pública tras el proxy).

### 5.5 Servicio permanente

- **Directorio:** carpeta web
- **Comando:** `npm run start`
- Variable de entorno `PORT` si no se usa el puerto 3000 por defecto

---

## 6. IIS, proxy y HTTPS (recomendado)

1. Instalar **URL Rewrite** y **ARR**; activar **Enable proxy** en ARR.
2. Copiar `iis/web.config` a la carpeta física del sitio IIS.
3. Binding **HTTPS** (ej. `https://compras.empresa.com`).
4. Mantener API en `127.0.0.1:7500` y Next en `127.0.0.1:3000` (solo red local).
5. En `.env` del API: `CORS_ADDITIONAL_ORIGIN=https://compras.empresa.com` (misma URL pública, sin barra final).

Detalle paso a paso: **`docs/IIS_PROXY.md`**.

---

## 7. Firewall

| Origen             | Destino      | Puerto         |
| ------------------ | ------------ | -------------- |
| Servidor web       | Servidor API | Puerto del API |
| Servidor API       | SQL Server   | Puerto SQL     |
| Usuarios (LAN/VPN) | Proxy HTTPS  | 443            |

No exponer SQL Server a Internet.

---

## 8. Verificación funcional

1. API en ejecución sin errores en consola o log.
2. La web muestra la pantalla de inicio de sesión.
3. Login con usuario Softland de prueba.
4. Crear o consultar una solicitud de compra de prueba.
5. Si aparece error de CORS en el navegador: revisar URL pública de la web y `CORS_ADDITIONAL_ORIGIN`.

---

## 9. Actualizaciones

1. Detener servicios API y web.
2. Respaldar las carpetas `api` y `web` (**conservar el `.env` del API**).
3. Extraer los nuevos ZIP del proveedor según sus instrucciones.
4. En cada carpeta: `npm ci --omit=dev`
5. Reiniciar servicios.
6. Repetir la verificación (sección 8).
