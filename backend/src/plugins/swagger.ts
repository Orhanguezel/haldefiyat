import fp from "fastify-plugin";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { env } from "@/core/env";

export default fp(async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Hal Fiyatlari API",
        version: "0.1.0",
        description: "Gunluk hal fiyatlari — ekosistem tuketicileri icin REST.",
      },
      servers: [{ url: env.PUBLIC_URL || "http://localhost:8088" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/api/docs",
    uiConfig: { docExpansion: "list", deepLinking: false },
  });
});
