# IIS — Proxy inverso (frontend + API)

Un solo sitio HTTPS en IIS sirve la aplicación al usuario. IIS reenvía:

- Rutas del **API Nest** → `http://127.0.0.1:7500`
- El resto (páginas, `/_next`, `public`) → **Next.js** en `http://127.0.0.1:3000`

El navegador solo ve un dominio (ej. `https://compras.empresa.com`), así las cookies de sesión funcionan sin CORS entre dominios.

Archivo de reglas: [`iis/web.config`](../deploy/iis/web.config)

---

## 1. Requisitos en Windows Server

1. **IIS** con rol Web Server.
2. **URL Rewrite Module 2.x**  
   [https://www.iis.net/downloads/microsoft/url-rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
3. **Application Request Routing (ARR) 3.x**  
   [https://www.iis.net/downloads/microsoft/application-request-routing](https://www.iis.net/downloads/microsoft/application-request-routing)
4. Tras instalar ARR: IIS Manager → servidor (nodo raíz) → **Application Request Routing Cache** → **Server Proxy Settings** → marcar **Enable proxy** → Apply.
5. **Node.js 20 LTS** con API y Web en ejecución (servicios Windows o PM2).

---

## 2. Variables de entorno

### API (`cs_erp_server/.env`)

- `NODE_ENV=production`
- `SERVER_PORT=7500` (o el puerto interno elegido)
- `CORS_ADDITIONAL_ORIGIN=https://compras.empresa.com` (URL pública del sitio IIS; sin barra final)
- Resto: SQL Server, `JWT_SECRET`, etc.

## 3. Crear el sitio en IIS

1. **Sitio** nuevo o existente, carpeta física (ej. `C:\inetpub\cs-solicitud-compra`).
2. Copiar [`deploy/iis/web.config`](../deploy/iis/web.config) a esa carpeta.
3. **Binding** HTTPS con certificado (hostname `compras.empresa.com`).
4. Si los procesos Node no usan `127.0.0.1:3000` / `7500`, editar las URLs en `web.config`.

---

## 4. Variables de servidor en URL Rewrite (importante)

Las reglas usan `HTTP_X_FORWARDED_*`. En IIS:

1. IIS Manager → sitio → **URL Rewrite**.
2. Vista lateral **View Server Variables…** → Allow:
   - `HTTP_X_FORWARDED_PROTO`
   - `HTTP_X_FORWARDED_HOST`
   - `HTTP_X_FORWARDED_FOR`
3. Si IIS lo pide, en el **servidor** (nodo raíz) → URL Rewrite → **View Server Variables** → las mismas.

Sin esto, las reglas con `<serverVariables>` pueden fallar al guardar o en runtime.

---

## 5. Redirección HTTP → HTTPS (opcional)

En el sitio o a nivel servidor, regla adicional **antes** del proxy:

```xml
<rule name="Redirect_HTTP_to_HTTPS" stopProcessing="true">
  <match url="(.*)" />
  <conditions>
    <add input="{HTTPS}" pattern="^OFF$" />
  </conditions>
  <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
</rule>
```

Colocarla como **primera** regla dentro de `<rules>`.

---

## 6. Rutas que IIS envía al API

Coinciden con los controladores Nest:

`auth`, `solicitud-oc`, `globales-co`, `departamento`, `centrocosto`, `centro-cuenta`, `cuentacontable`, `articulo`, `articulo-cuenta`, `usuario-softland`, `tenant`, `docs`

Cualquier otra ruta (`/`, `/_next/static/...`, archivos en `public/`) va a Next.js.
