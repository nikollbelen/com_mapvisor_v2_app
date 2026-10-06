import crypto from "node:crypto";

const R2_REGION = "auto";
const EXPIRES_SECONDS = 300;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function hmac(key: string | Buffer, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodePathPart(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, R2_REGION);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
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

function buildPresignedPutUrl(key: string) {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const bucket = requireEnv("R2_BUCKET_NAME");

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${R2_REGION}/s3/aws4_request`;
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${bucket}/${key.split("/").map(encodePathPart).join("/")}`;
  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(EXPIRES_SECONDS),
    "X-Amz-SignedHeaders": "host",
  });

  const canonicalQueryString = Array.from(query.entries())
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
    .sort()
    .join("&");
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQueryString,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");
  const signature = crypto
    .createHmac("sha256", getSigningKey(secretAccessKey, dateStamp))
    .update(stringToSign)
    .digest("hex");

  query.set("X-Amz-Signature", signature);
  return `https://${host}${canonicalUri}?${query.toString()}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const { fileName, fileType, lotId } = req.body || {};
    if (!fileName || typeof fileName !== "string") {
      res.status(400).json({ ok: false, error: "fileName requerido" });
      return;
    }
    if (
      typeof fileType !== "string" ||
      (!fileType.startsWith("image/") && !fileType.startsWith("video/"))
    ) {
      res.status(400).json({ ok: false, error: "Tipo de archivo no permitido" });
      return;
    }

    const publicBaseUrl = requireEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
    const safeLotId = String(lotId || "lote").replace(/[^a-zA-Z0-9-_]/g, "-");
    const key = `lotes/${safeLotId}/${safeFileName(fileName)}`;
    const uploadUrl = buildPresignedPutUrl(key);

    res.status(200).json({
      ok: true,
      key,
      uploadUrl,
      publicUrl: `${publicBaseUrl}/${key.split("/").map(encodePathPart).join("/")}`,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message || "Error R2" });
  }
}
