const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const PORT = Number(process.env.PORT || 3000);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, data, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'self'; form-action 'self'"
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 40_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

const instructions = {
  chat: "You are Nexora AI, a helpful, honest general-purpose assistant. Give clear and useful answers. Do not claim to have performed actions you have not performed.",
  writer: "You are an expert writing assistant. Produce polished, useful writing based on the user's request. Ask for missing context only when necessary.",
  social: "You are a social media strategist. Create engaging, platform-appropriate hooks, scripts, captions and ideas. Avoid promising virality or guaranteed results.",
  business: "You are a practical small-business assistant. Give actionable business, marketing and product ideas. Clearly distinguish estimates from facts and never guarantee profits.",
  cv: "You are a CV and cover-letter assistant. Help present real experience clearly and professionally. Never invent qualifications, employment or achievements."
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, JSON.stringify({ ok: true, configured: Boolean(process.env.OPENAI_API_KEY) }));
  }

  if (req.method === "POST" && url.pathname === "/api/generate") {
    let body;
    try { body = await readBody(req); }
    catch (e) { return send(res, 400, JSON.stringify({ error: e.message })); }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const mode = typeof body.mode === "string" ? body.mode : "chat";
    if (!prompt) return send(res, 400, JSON.stringify({ error: "Please enter a prompt first." }));
    if (prompt.length > 8000) return send(res, 400, JSON.stringify({ error: "Please keep your request under 8,000 characters." }));
    if (!Object.hasOwn(instructions, mode)) return send(res, 400, JSON.stringify({ error: "Unknown tool selected." }));
    if (!process.env.OPENAI_API_KEY) {
      return send(res, 503, JSON.stringify({
        error: "AI is not connected yet. Add your API key to a local .env file and restart the server. See README.md for setup."
      }));
    }

    try {
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          messages: [
            { role: "system", content: instructions[mode] },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        const message = data?.error?.message || "The AI provider request failed.";
        return send(res, 502, JSON.stringify({ error: message }));
      }
      const output = data?.choices?.[0]?.message?.content;
      if (!output) return send(res, 502, JSON.stringify({ error: "The AI returned an empty response. Please try again." }));
      return send(res, 200, JSON.stringify({ output }));
    } catch {
      return send(res, 502, JSON.stringify({ error: "Could not reach the AI provider. Check your internet connection and try again." }));
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, JSON.stringify({ error: "Method not allowed." }));
  }

  const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const filePath = path.resolve(PUBLIC, requested);
  if (!filePath.startsWith(PUBLIC + path.sep) && filePath !== path.join(PUBLIC, "index.html")) {
    return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
    send(res, 200, data, MIME[path.extname(filePath)] || "application/octet-stream");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Nexora AI is running at http://localhost:${PORT}`);
});
