// Función de Vercel para /api/transcribir: le pasa el pedido al servidor de la app (output/server.mjs).
// Si el servidor no arranca, el motivo queda en los logs de Vercel y el alumno ve un aviso general.
let servidor;
try {
  ({ servidor } = await import("../output/server.mjs"));
} catch (error) {
  console.error("El servidor no arrancó:", error);
}

export default (req, res) => {
  if (servidor) return servidor.emit("request", req, res);
  res.statusCode = 500;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "La app no está disponible en este momento. Probá de nuevo en unos minutos." }));
};
