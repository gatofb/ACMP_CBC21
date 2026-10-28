// Función de Vercel para /api/explicar: le pasa el pedido al servidor de la app (output/server.mjs).
// Si el servidor no arranca, responde el motivo en JSON y lo deja en los logs de Vercel.
let servidor;
let falla;
try {
  ({ servidor } = await import("../output/server.mjs"));
} catch (error) {
  falla = error;
  console.error("El servidor no arrancó:", error);
}

export default (req, res) => {
  if (servidor) return servidor.emit("request", req, res);
  res.statusCode = 500;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: `El servidor no arrancó: ${falla?.message}` }));
};
