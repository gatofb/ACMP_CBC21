// MCP de PrepTest en local (stdio): para usarlo desde un asistente de IA en esta computadora.
// Las herramientas están en mcp-servidor.mjs; acá el mapa además se guarda en ~/.preptest/mapa.json.
// La versión en línea es mcp-http.mjs (https://acmp-cbc21.vercel.app/mcp).
//
// Uso: node output/mcp.mjs   (se registra en el asistente, ver output/README.md)

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { crearServidor } from "./mcp-servidor.mjs";

await crearServidor({ local: true }).connect(new StdioServerTransport());
