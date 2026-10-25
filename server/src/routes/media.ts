import { Router } from "express";
import { readFile } from "fs/promises";
import path from "path";
import { IMAGE_CONTENT_TYPES, UPLOAD_DIR, UPLOAD_NAME_PATTERN } from "../lib/uploads";

export const mediaRouter = Router();

const MAX_PROXY_BYTES = 10 * 1024 * 1024;

// Chặn proxy tới máy nội bộ (localhost, mạng LAN) – chỉ cho tải ảnh từ Internet
function isPublicHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || !host.includes(".") && !host.includes(":")) return false;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false;
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return false;
  return true;
}

// GET /api/proxy-image?url= – tải ảnh từ link ngoài qua server (tránh bị chặn hotlink)
mediaRouter.get("/api/proxy-image", async (req, res) => {
  const imageUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!imageUrl) {
    res.status(400).send("Missing URL");
    return;
  }
  if (!isPublicHttpUrl(imageUrl)) {
    res.status(400).send("URL không hợp lệ");
    return;
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
      return;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/") || contentType.includes("svg")) {
      res.status(415).send("Không phải ảnh");
      return;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_PROXY_BYTES) {
      res.status(413).send("Ảnh quá lớn");
      return;
    }

    res.set({ "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" }).send(buffer);
  } catch (error) {
    console.error("[ProxyImage] Error:", error instanceof Error ? error.message : error);
    res.status(502).send("Không tải được ảnh");
  }
});

// GET /uploads/products/:name – ảnh admin đã tải lên
mediaRouter.get("/uploads/products/:name", async (req, res) => {
  const { name } = req.params;
  if (!UPLOAD_NAME_PATTERN.test(name)) {
    res.status(404).send("Not found");
    return;
  }
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    const ext = name.split(".").pop() as string;
    res
      .set({
        "Content-Type": IMAGE_CONTENT_TYPES[ext],
        // Tên file không bao giờ bị ghi đè nên cache lâu được
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      })
      .send(data);
  } catch {
    res.status(404).send("Not found");
  }
});
