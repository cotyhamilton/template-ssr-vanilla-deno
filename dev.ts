import { Hono } from "hono";
import { connectToWeb } from "vike-node";

// Constants
const base = Deno.env.get("BASE") || "/";

// Create http server
const app = new Hono();

// Add Vite or respective production middlewares
const { createServer } = await import("vite");
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  base,
});
app.use(async (c, next) => {
  const response = await connectToWeb(vite.middlewares)(c.req.raw);
  if (response) {
    return response;
  }
  await next();
});

// Serve HTML
app.get(base, async (c) => {
  try {
    const url = c.req.url.replace(base, "");
    let template: string;
    const render = (await vite.ssrLoadModule("./src/entry-server.ts")).render;
    // Always read fresh template in development
    template = await Deno.readTextFile("./index.html");
    template = await vite.transformIndexHtml(url, template);

    const rendered = render(url);

    const html = template
      // @ts-ignore todo: fix type
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "");

    return c.html(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e as Error);
    console.log((e as Error).stack);
    return c.text((e as Error).stack!);
  }
});

if (import.meta.main) {
  // Start http server
  Deno.serve({
    onListen: () => {
      console.log(`Server started at http://localhost:8000`);
    },
  }, app.fetch);
}
