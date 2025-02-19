import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { compress } from "hono/compress";

// Constants
const base = Deno.env.get("BASE") || "/";

// Cached production assets
const template = await Deno.readTextFile("./dist/client/index.html");

// Create http server
const app = new Hono();

// Serve HTML
app.get(base, async (c) => {
  try {
    const url = c.req.url.replace(base, "");

    const render =
      (await import("./dist/server/entry-server.mjs" as unknown as string))
        .render;

    const rendered = render(url);

    const html = template
      // @ts-ignore todo: fix type
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "");

    return c.html(html);
  } catch (e) {
    console.log((e as Error).stack);
    return c.text((e as Error).stack!);
  }
});

app.use(compress());
app.use(base + "*", serveStatic({ root: "./dist/client" }));

export default {
  fetch: app.fetch,
} satisfies Deno.ServeDefaultExport;
