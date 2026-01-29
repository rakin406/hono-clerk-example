import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { sValidator } from "@hono/standard-validator";
import * as z from "zod";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

// DISCLAIMER: You need a frontend.

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

  const auth = getAuth(c);
  const sessionId = auth.sessionId ?? "";
  setCookie(c, "__session", sessionId, {
    secure: true,
    httpOnly: true,
  });

  return c.json({ message: "You have registered!" }, 201);
});

app.delete("/delete", async (c) => {
  const clerkClient = c.get("clerk");
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401,
    );
  }

  await clerkClient.users.deleteUser(auth.userId);
  deleteCookie(c, "__session");

  return c.json({ message: "You have deleted your account!" });
});

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
