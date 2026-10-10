type Env = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  APP_ORIGIN: string;
  R2_PUBLIC_BASE_URL: string;
  SESSION_COOKIE_NAME: string;
  SESSION_SECRET: string;
};

type AppUser = {
  id: string;
  email: string;
  full_name: string;
};

type LotInput = {
  id?: unknown;
  nombre?: unknown;
  tipo_propiedad?: unknown;
  tipoPropiedad?: unknown;
  operacion?: unknown;
  estado?: unknown;
  precio?: unknown;
  area?: unknown;
  ciudad?: unknown;
  distrito?: unknown;
  dormitorios?: unknown;
  banos?: unknown;
  etapa?: unknown;
  manzana?: unknown;
  lote?: unknown;
  coordenadas?: unknown;
  visibility?: unknown;
  media?: unknown;
};

type LotMediaInput = {
  type?: unknown;
  url?: unknown;
  key?: unknown;
  r2_key?: unknown;
  name?: unknown;
  size_bytes?: unknown;
  mime_type?: unknown;
};

const SESSION_DAYS = 30;
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};
const DEFAULT_ALLOWED_ORIGINS = [
  "https://com-tupu-app.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
];

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers || {}),
    },
  });
}

function corsHeaders(env: Env, request: Request) {
  const origin = request.headers.get("Origin") || "";
  const configuredOrigins = (env.APP_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set([...configuredOrigins, ...DEFAULT_ALLOWED_ORIGINS]));
  const fallbackOrigin = configuredOrigins[0] || DEFAULT_ALLOWED_ORIGINS[0];
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : fallbackOrigin;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    Vary: "Origin",
  };
}

function withCors(response: Response, env: Env, request: Request) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(env, request)).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const text = normalizeText(value);
  return text || null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalInteger(value: unknown) {
  const parsed = optionalNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function parseMediaInput(value: unknown): LotMediaInput[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as LotMediaInput[];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeFileName(name: string) {
  const extension = name.includes(".") ? name.split(".").pop() : "";
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "archivo"}-${crypto.randomUUID()}${extension ? `.${extension.toLowerCase()}` : ""}`;
}

function encodePathPart(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function toBase64(bytes: ArrayBuffer) {
  let value = "";
  new Uint8Array(bytes).forEach((byte) => {
    value += String.fromCharCode(byte);
  });
  return btoa(value);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: 100000,
    },
    key,
    256
  );
  return `pbkdf2:100000:${toBase64(salt.buffer)}:${toBase64(bits)}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [scheme, iterationsText, saltText, digest] = storedHash.split(":");
  if (scheme !== "pbkdf2" || !iterationsText || !saltText || !digest) return false;
  const iterations = Number(iterationsText);
  if (!Number.isFinite(iterations)) return false;
  const salt = fromBase64(saltText);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    key,
    256
  );
  return toBase64(bits) === digest;
}

async function signSession(sessionId: string, env: Env) {
  return sha256Hex(`${sessionId}:${env.SESSION_SECRET}`);
}

function parseCookies(request: Request) {
  const cookie = request.headers.get("Cookie") || "";
  return Object.fromEntries(
    cookie
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [name, ...rest] = item.split("=");
        return [name, decodeURIComponent(rest.join("="))];
      })
  );
}

async function getCurrentUser(request: Request, env: Env): Promise<AppUser | null> {
  const authHeader = request.headers.get("Authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const token = bearerToken || parseCookies(request)[env.SESSION_COOKIE_NAME];
  if (!token) return null;

  const [sessionId, signature] = token.split(".");
  if (!sessionId || !signature) return null;
  if ((await signSession(sessionId, env)) !== signature) return null;

  const row = await env.DB.prepare(
    `SELECT users.id, users.email, users.full_name
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = ? AND sessions.expires_at > CURRENT_TIMESTAMP`
  )
    .bind(sessionId)
    .first<AppUser>();

  return row || null;
}

async function createSession(userId: string, env: Env) {
  const sessionId = randomId("sess");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(sessionId, userId, expiresAt)
    .run();
  return `${sessionId}.${await signSession(sessionId, env)}`;
}

function sessionCookie(token: string, env: Env) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${env.SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAge}`;
}

function clearSessionCookie(env: Env) {
  return `${env.SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`;
}

async function requireUser(request: Request, env: Env) {
  const user = await getCurrentUser(request, env);
  if (!user) throw new Response(JSON.stringify({ ok: false, error: "No autenticado" }), { status: 401, headers: JSON_HEADERS });
  return user;
}

function validateLotInput(input: LotInput) {
  const nombre = normalizeText(input.nombre);
  const tipoPropiedad = normalizeText(input.tipo_propiedad || input.tipoPropiedad);
  const operacion = normalizeText(input.operacion);
  const estado = normalizeText(input.estado) || "disponible";
  const coordenadas = normalizeText(input.coordenadas);
  const visibility = normalizeText(input.visibility) || "public";

  if (!nombre) return { error: "nombre es obligatorio" };
  if (!["departamento", "casa", "lote"].includes(tipoPropiedad)) {
    return { error: "tipo_propiedad debe ser departamento, casa o lote" };
  }
  if (!["venta", "alquiler"].includes(operacion)) {
    return { error: "operacion debe ser venta o alquiler" };
  }
  if (!["disponible", "reservado", "negociacion", "vendido"].includes(estado)) {
    return { error: "estado inválido" };
  }
  if (!["public", "private"].includes(visibility)) {
    return { error: "visibility inválido" };
  }
  if (!coordenadas) return { error: "coordenadas es obligatorio" };

  return {
    value: {
      nombre,
      tipoPropiedad,
      operacion,
      estado,
      precio: optionalNumber(input.precio),
      area: optionalNumber(input.area),
      ciudad: optionalText(input.ciudad),
      distrito: optionalText(input.distrito),
      dormitorios: optionalInteger(input.dormitorios),
      banos: optionalNumber(input.banos),
      etapa: optionalText(input.etapa),
      manzana: optionalText(input.manzana),
      lote: optionalText(input.lote),
      coordenadas,
      visibility,
      media: parseMediaInput(input.media)
        .map((item) => ({
          type: normalizeText(item.type),
          url: normalizeText(item.url),
          r2Key: optionalText(item.r2_key) || optionalText(item.key),
          name: optionalText(item.name),
          sizeBytes: optionalInteger(item.size_bytes),
          mimeType: optionalText(item.mime_type),
        }))
        .filter((item) => ["image", "video", "youtube"].includes(item.type) && item.url),
    },
  };
}

async function replaceLotMedia(
  env: Env,
  lotId: string,
  ownerUserId: string,
  media: Array<{
    type: string;
    url: string;
    r2Key: string | null;
    name: string | null;
    sizeBytes: number | null;
    mimeType: string | null;
  }>
) {
  await env.DB.prepare("DELETE FROM lot_media WHERE lot_id = ? AND owner_user_id = ?")
    .bind(lotId, ownerUserId)
    .run();

  for (const item of media) {
    await env.DB.prepare(
      `INSERT INTO lot_media (
        id, lot_id, owner_user_id, type, url, r2_key, name, size_bytes, mime_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        randomId("media"),
        lotId,
        ownerUserId,
        item.type,
        item.url,
        item.r2Key,
        item.name,
        item.sizeBytes,
        item.mimeType
      )
      .run();
  }
}

async function attachMediaToLots(env: Env, lots: any[]) {
  for (const lot of lots) {
    const media = await env.DB.prepare(
      `SELECT type, url, r2_key AS key, name, size_bytes, mime_type
       FROM lot_media
       WHERE lot_id = ?
       ORDER BY created_at ASC`
    )
      .bind(lot.id)
      .all();
    lot.media = JSON.stringify(media.results || []);
  }
  return lots;
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Response(JSON.stringify({ ok: false, error: "JSON inválido" }), { status: 400, headers: JSON_HEADERS });
  }
}

async function register(request: Request, env: Env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const fullName = normalizeText(body.full_name || body.fullName);
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !fullName || password.length < 8) {
    return json({ ok: false, error: "Nombre, email y contraseña de mínimo 8 caracteres son obligatorios." }, { status: 400 });
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return json({ ok: false, error: "Ya existe una cuenta con ese correo." }, { status: 409 });
  }

  const id = randomId("user");
  const passwordHash = await hashPassword(password);
  await env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)"
  )
    .bind(id, email, passwordHash, fullName)
    .run();

  const token = await createSession(id, env);
  return json(
    { ok: true, token, user: { id, email, full_name: fullName } },
    { headers: { "Set-Cookie": sessionCookie(token, env) } }
  );
}

async function login(request: Request, env: Env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  const row = await env.DB.prepare(
    "SELECT id, email, full_name, password_hash FROM users WHERE email = ?"
  )
    .bind(email)
    .first<AppUser & { password_hash: string }>();

  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return json({ ok: false, error: "Credenciales inválidas." }, { status: 401 });
  }

  const token = await createSession(row.id, env);
  return json(
    { ok: true, token, user: { id: row.id, email: row.email, full_name: row.full_name } },
    { headers: { "Set-Cookie": sessionCookie(token, env) } }
  );
}

async function logout(request: Request, env: Env) {
  const token = parseCookies(request)[env.SESSION_COOKIE_NAME];
  const sessionId = token?.split(".")[0];
  if (sessionId) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  }
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie(env) } });
}

async function listLots(request: Request, env: Env) {
  const user = await getCurrentUser(request, env);
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "1";

  if (mine) {
    if (!user) return json({ ok: false, error: "No autenticado" }, { status: 401 });
    const result = await env.DB.prepare(
      `SELECT * FROM lots
       WHERE owner_user_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`
    )
      .bind(user.id)
      .all();
    return json({ ok: true, lots: await attachMediaToLots(env, result.results || []) });
  }

  const result = await env.DB.prepare(
    `SELECT * FROM lots
     WHERE visibility = 'public' AND deleted_at IS NULL
     ORDER BY created_at DESC`
  ).all();
  return json({ ok: true, lots: await attachMediaToLots(env, result.results || []) });
}

async function createLot(request: Request, env: Env) {
  const user = await requireUser(request, env);
  const body = (await readJson(request)) as LotInput;
  const parsed = validateLotInput(body);
  if ("error" in parsed) return json({ ok: false, error: parsed.error }, { status: 400 });

  const lot = parsed.value;
  const requestedId = normalizeText(body.id).replace(/[^a-zA-Z0-9_-]/g, "");
  const id = requestedId || randomId("lot");
  await env.DB.prepare(
    `INSERT INTO lots (
      id, owner_user_id, nombre, tipo_propiedad, operacion, estado, precio, area,
      ciudad, distrito, dormitorios, banos, etapa, manzana, lote, coordenadas, visibility
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      user.id,
      lot.nombre,
      lot.tipoPropiedad,
      lot.operacion,
      lot.estado,
      lot.precio,
      lot.area,
      lot.ciudad,
      lot.distrito,
      lot.dormitorios,
      lot.banos,
      lot.etapa,
      lot.manzana,
      lot.lote,
      lot.coordenadas,
      lot.visibility
    )
    .run();

  await replaceLotMedia(env, id, user.id, lot.media);

  return json(
    { ok: true, lot: { id, owner_user_id: user.id, ...lot, media: JSON.stringify(lot.media) } },
    { status: 201 }
  );
}

async function updateLot(request: Request, env: Env, lotId: string) {
  const user = await requireUser(request, env);
  const existing = await env.DB.prepare(
    "SELECT id FROM lots WHERE id = ? AND owner_user_id = ? AND deleted_at IS NULL"
  )
    .bind(lotId, user.id)
    .first();
  if (!existing) return json({ ok: false, error: "Lote no encontrado" }, { status: 404 });

  const parsed = validateLotInput((await readJson(request)) as LotInput);
  if ("error" in parsed) return json({ ok: false, error: parsed.error }, { status: 400 });
  const lot = parsed.value;

  await env.DB.prepare(
    `UPDATE lots SET
      nombre = ?, tipo_propiedad = ?, operacion = ?, estado = ?, precio = ?, area = ?,
      ciudad = ?, distrito = ?, dormitorios = ?, banos = ?, etapa = ?, manzana = ?,
      lote = ?, coordenadas = ?, visibility = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND owner_user_id = ?`
  )
    .bind(
      lot.nombre,
      lot.tipoPropiedad,
      lot.operacion,
      lot.estado,
      lot.precio,
      lot.area,
      lot.ciudad,
      lot.distrito,
      lot.dormitorios,
      lot.banos,
      lot.etapa,
      lot.manzana,
      lot.lote,
      lot.coordenadas,
      lot.visibility,
      lotId,
      user.id
    )
    .run();

  await replaceLotMedia(env, lotId, user.id, lot.media);

  return json({ ok: true });
}

async function deleteLot(request: Request, env: Env, lotId: string) {
  const user = await requireUser(request, env);
  const media = await env.DB.prepare(
    "SELECT r2_key FROM lot_media WHERE lot_id = ? AND owner_user_id = ? AND r2_key IS NOT NULL"
  )
    .bind(lotId, user.id)
    .all<{ r2_key: string }>();

  const result = await env.DB.prepare(
    "DELETE FROM lots WHERE id = ? AND owner_user_id = ?"
  )
    .bind(lotId, user.id)
    .run();

  if (!result.meta.changes) return json({ ok: false, error: "Lote no encontrado" }, { status: 404 });

  await Promise.all((media.results || []).map((item) => env.MEDIA_BUCKET.delete(item.r2_key)));
  return json({ ok: true });
}

async function uploadMedia(request: Request, env: Env) {
  const user = await requireUser(request, env);
  const form = await request.formData();
  const file = form.get("file");
  const lotId = normalizeText(form.get("lotId"));

  if (!(file instanceof File)) {
    return json({ ok: false, error: "Archivo requerido" }, { status: 400 });
  }
  if (!lotId) {
    return json({ ok: false, error: "lotId requerido" }, { status: 400 });
  }
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return json({ ok: false, error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  const safeLotId = lotId.replace(/[^a-zA-Z0-9-_]/g, "-");
  const key = `lotes/${safeLotId}/${safeFileName(file.name)}`;
  await env.MEDIA_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      owner_user_id: user.id,
      lot_id: lotId,
      original_name: file.name,
    },
  });

  return json({
    ok: true,
    key,
    publicUrl: `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key
      .split("/")
      .map(encodePathPart)
      .join("/")}`,
  });
}

async function route(request: Request, env: Env) {
  const url = new URL(request.url);
  const method = request.method;

  if (method === "OPTIONS") return new Response(null, { status: 204 });
  if (method === "POST" && url.pathname === "/api/auth/register") return register(request, env);
  if (method === "POST" && url.pathname === "/api/auth/login") return login(request, env);
  if (method === "POST" && url.pathname === "/api/auth/logout") return logout(request, env);
  if (method === "GET" && url.pathname === "/api/auth/me") {
    return json({ ok: true, user: await getCurrentUser(request, env) });
  }
  if (method === "GET" && url.pathname === "/api/lots") return listLots(request, env);
  if (method === "POST" && url.pathname === "/api/lots") return createLot(request, env);
  if (method === "POST" && url.pathname === "/api/r2-upload") return uploadMedia(request, env);

  const lotMatch = url.pathname.match(/^\/api\/lots\/([^/]+)$/);
  if (lotMatch && method === "PUT") return updateLot(request, env, lotMatch[1]);
  if (lotMatch && method === "DELETE") return deleteLot(request, env, lotMatch[1]);

  return json({ ok: false, error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      return withCors(await route(request, env), env, request);
    } catch (error) {
      if (error instanceof Response) return withCors(error, env, request);
      const message = error instanceof Error ? error.message : "Error interno";
      return withCors(json({ ok: false, error: message }, { status: 500 }), env, request);
    }
  },
};
