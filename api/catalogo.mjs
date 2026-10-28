// Función de Vercel para /api/catalogo: le pasa el pedido al servidor de la app (output/server.mjs).
import { servidor } from "../output/server.mjs";

export default (req, res) => servidor.emit("request", req, res);
