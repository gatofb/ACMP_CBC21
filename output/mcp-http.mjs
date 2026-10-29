// MCP de PrepTest en línea (Streamable HTTP, sin estado): lo que se agrega como conector personalizado
// pegando https://acmp-cbc21.vercel.app/mcp. Cada pedido arma su propio servidor; la sesión y el mapa
// viajan en los códigos de mcp-servidor.mjs. Si alguien abre la dirección en el navegador, va al
// instructivo de la app.

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { crearServidor } from "./mcp-servidor.mjs";

const errorJson = (res, status, mensaje) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: mensaje }, id: null }));
};

export async function atenderMcp(req, res, cuerpo) {
  // Para clientes que corren en el navegador (por ejemplo, el inspector de MCP).
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "POST, GET, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, accept, authorization, mcp-protocol-version, mcp-session-id");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  if (req.method === "GET" && /text\/html/.test(req.headers.accept || "")) {
    res.writeHead(302, { location: "/#/mcp" });
    return res.end();
  }
  if (req.method !== "POST") return errorJson(res, 405, "Method not allowed.");

  const servidor = crearServidor({ local: false });
  const transporte = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => {
    transporte.close();
    servidor.close();
  });
  try {
    await servidor.connect(transporte);
    await transporte.handleRequest(req, res, cuerpo);
  } catch (error) {
    console.error("Error en el MCP:", error);
    if (!res.headersSent) errorJson(res, 500, "Internal server error");
  }
}
