// Función de Vercel para /mcp (y /api/mcp): el MCP de PrepTest en línea (output/mcp-http.mjs).
let atenderMcp;
try {
  ({ atenderMcp } = await import("../output/mcp-http.mjs"));
} catch (error) {
  console.error("El MCP no arrancó:", error);
}

export default (req, res) => {
  if (atenderMcp) return atenderMcp(req, res, req.body);
  res.statusCode = 500;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "PrepTest no está disponible en este momento." }, id: null }));
};
