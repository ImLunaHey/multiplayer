import { NotFound } from "./components/not-found";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "./components/app";
import { AppShell } from "./app-shell";

const server = Bun.serve({
  port: process.env.PORT ?? 3000,
  websocket: {
    open: (ws) => {
      console.info({ message: "Client connected" });
      ws.subscribe("/");
    },
    message: (ws, message) => {
      ws.publish("/", message);
    },
    close: (ws) => {
      console.info({ message: "Client disconnected" });
    },
  },
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/connect") {
      const upgraded = server.upgrade(request);
      if (!upgraded) {
        return new Response("Upgrade failed", { status: 400 });
      }
    }

    if (url.pathname === "/") {
      return new Response(renderToStaticMarkup(<AppShell />), {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    if (url.pathname === "/script.js") {
      const script = await Bun.build({
        entrypoints: ["./src/home.tsx"],
        minify: false,
        target: "browser",
        sourcemap: "none",
        define: {
          global: "window",
        },
      });
      if (!script.success) {
        return new Response("", {
          headers: {
            "Content-Type": "application/javascript",
          },
        });
      }
      return new Response(await script.outputs[0].text(), {
        headers: {
          "Content-Type": "application/javascript",
        },
      });
    }

    return new Response(
      "<!doctype html>" +
        renderToStaticMarkup(
          <App>
            <NotFound />
          </App>
        ),
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  },
});

console.info({
  message: `Server started at http://localhost:${server.port}`,
});
