import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Node.js!"));
app.get("/login", (c) => c.text("Login endpoint"));
app.get("/logout", (c) => c.text("Logout endpoint"));
app.get("/delete", (c) => c.text("Delete endpoint"));

const server = serve(app);

// Graceful shutdown
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
