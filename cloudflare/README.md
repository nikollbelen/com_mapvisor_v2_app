# Cloudflare backend para Mapvisor

Este backend reemplaza Google Sheets para lotes y usuarios. R2 se conserva para imagenes y videos; D1 guarda usuarios, lotes, sesiones y la relacion con multimedia.

## Recursos

- Worker API: `mapvisor-api`
- D1 database: `mapvisor-db`
- R2 bucket: el bucket que ya usas para multimedia

## Configuracion inicial

1. Instala o usa Wrangler:

```bash
npx wrangler login
```

2. Crea la base D1:

```bash
npx wrangler d1 create mapvisor-db
```

3. Copia `wrangler.example.toml` a `wrangler.toml` y reemplaza:

- `database_id`
- `bucket_name`
- `APP_ORIGIN`
- `R2_PUBLIC_BASE_URL`

4. Crea el secreto de sesiones:

```bash
npx wrangler secret put SESSION_SECRET
```

Usa un valor largo y aleatorio.

5. Ejecuta migraciones:

```bash
npx wrangler d1 migrations apply mapvisor-db --local
npx wrangler d1 migrations apply mapvisor-db --remote
```

6. Ejecuta local:

```bash
npx wrangler dev
```

7. Publica:

```bash
npx wrangler deploy
```

## Endpoints

- `POST /api/claims` (público; valida y guarda reclamos y quejas en D1)

### Libro de Reclamaciones

Aplicar `0002_claims.sql` antes de desplegar el Worker y el frontend con el formulario conectado:

```bash
npx wrangler d1 migrations apply mapvisor-db --remote
npx wrangler deploy
```

Ejecutar estos comandos desde `cloudflare`. El frontend usa `VITE_MAPVISOR_API_URL`.
Los envíos no requieren cuenta. D1 guarda los datos, código, fecha y estado de atención.
Si falla el almacenamiento, no se muestra una confirmación de éxito. Los reintentos del mismo
envío conservan su constancia. Los datos personales no tienen endpoint de consulta público.
La constancia se descarga desde la pantalla; no se envían correos automáticamente.

Para consultar y atender los registros, usar la consola D1 de Cloudflare (acceso de la cuenta
administradora), tabla `claims`. Consultar pendientes, responder por el correo del proyecto
y actualizar `status`, `response` y `responded_at`. No hay panel de atención en el frontend.

```sql
SELECT receipt_number, created_at, name, email, type, service, detail, consumer_request, status
FROM claims WHERE status != 'resolved' ORDER BY created_at ASC;
```

Prueba local sin escribir en producción: `node scripts/test-claims.mjs`, desde la raíz.
Los datos del titular y RUC se configuran en `src/config/publicSite.ts` y se muestran
discretamente en la información legal, el Libro y su constancia. Antes del lanzamiento,
verificar la dirección proporcionada.

### Autenticación y lotes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/lots`
- `GET /api/lots?mine=1`
- `POST /api/lots`
- `PUT /api/lots/:id`
- `DELETE /api/lots/:id`

## Campos de lote

- `nombre`
- `tipo_propiedad`: `departamento`, `casa`, `lote`
- `operacion`: `venta`, `alquiler`
- `estado`: `disponible`, `reservado`, `negociacion`, `vendido`
- `precio`
- `area`
- `ciudad`
- `distrito`
- `dormitorios`
- `banos`
- `etapa`
- `manzana`
- `lote`
- `coordenadas`
- `visibility`: `public`, `private`

## Estado de integracion

El frontend ya usa el Worker para:

- registro, login, sesion actual y logout;
- listado publico de lotes desde D1;
- listado de "Mis lotes" con `GET /api/lots?mine=1`;
- creacion y edicion con `POST /api/lots` y `PUT /api/lots/:id`;
- eliminacion con `DELETE /api/lots/:id`;
- subida de multimedia a R2 con `POST /api/r2-upload`.

Google Sheets ya no forma parte del flujo activo de datos.
