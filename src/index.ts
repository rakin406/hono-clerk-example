import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

const app = new Hono();

app.use("*", clerkMiddleware());

app.get("/", (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401,
    );
  }

  return c.json({
    message: "You are logged in!",
    userId: auth.userId,
  });
});

app.post("/register", async (c) => {
  const clerkClient = c.get("clerk");
  const body = await c.req.formData();

  const email = body.get("email");
  const password = body.get("password");

  if (!email || !password) {
    return c.json(
      {
        message: "You gave insufficient data.",
      },
      401,
    );
  }

  await clerkClient.users.createUser({
    emailAddress: [email.toString()],
    password: password.toString(),
  });

  return c.json({ message: "You have registered!" }, 201);
});

app.get("/login", async (c) => {});

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
