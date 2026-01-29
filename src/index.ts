import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import * as z from "zod";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

// TODO: Implement login, logout and delete user.

const User = z.object({
  email: z.string(),
  password: z.string().min(8),
});

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

app.post("/register", sValidator("form", User), async (c) => {
  const clerkClient = c.get("clerk");
  const data = c.req.valid("form");

  await clerkClient.users.createUser({
    emailAddress: [data.email],
    password: data.password,
  });

  return c.json({ message: "You have registered!" }, 201);
});

app.post("/login", sValidator("form", User), async (c) => {
  // const clerkClient = c.get("clerk");
  // const data = c.req.valid("form");
  //
  // await clerkClient.users.createUser({
  //   emailAddress: [data.email],
  //   password: data.password,
  // });
  //
  // return c.json({ message: "You have registered!" }, 201);
});

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
