# App de PrepTest para la nube. Se construye desde la carpeta "CBC Preptest" porque el servidor
# lee las preguntas y fichas de rules/. La clave de la API no va en la imagen: se carga como
# variable de entorno ANTHROPIC_API_KEY en el panel del proveedor.
FROM node:22-slim

WORKDIR /app
COPY output/package.json output/package-lock.json output/
RUN cd output && npm ci --omit=dev

COPY rules/ rules/
COPY output/ output/

# HOST=0.0.0.0 para recibir pedidos de afuera; TUTOR_PROVIDER=api para usar siempre la API.
# El dictado no está en la imagen (whisper.cpp corre solo en local): la app pide escribir.
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 TUTOR_PROVIDER=api
EXPOSE 8080
USER node
CMD ["node", "output/server.mjs"]
