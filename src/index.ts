import type { Env } from "@/env";
import { setupRoutes } from "@/routes";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";

const app = new OpenAPIHono<{
  Bindings: Env;
}>();

app.use(
  "*",
  cors({
    origin: ["*"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 3600,
  })
);

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

app.get("/ui", swaggerUI({ url: "/openapi" }));

app.doc("/openapi", {
  openapi: "3.1.0",
  info: {
    title: "API",
    version: "1.0.0",
    description: "API",
  },
});

// Set up all routes from the routes directory
setupRoutes(app);

export default app;
