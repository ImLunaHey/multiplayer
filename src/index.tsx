import { NotFound } from "./components/not-found";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "./components/app";
import { AppShell } from "./app-shell";

const script = await Bun.build({
  entrypoints: ["./src/home.tsx"],
  minify: false,
  target: "browser",
  sourcemap: "none",
  define: {
    global: "window",
  },
});

const server = Bun.serve<{
  uuid: string;
}>({
  port: process.env.PORT ?? 3000,
  websocket: {
    open: (ws) => {
      console.info({ message: "Client connected", uuid: ws.data.uuid });
      ws.subscribe("/");
      ws.publish(
        "/",
        JSON.stringify(
          {
            type: "join",
            uuid: ws.data.uuid,
          },
          null,
          0
        )
      );
    },
    message: (ws, message: string) => {
      ws.publish(
        "/",
        JSON.stringify(
          {
            type: "update",
            uuid: ws.data.uuid,
            ...JSON.parse(message),
          },
          null,
          0
        )
      );
    },
    close: (ws) => {
      ws.publish(
        "/",
        JSON.stringify(
          {
            type: "leave",
            uuid: ws.data.uuid,
          },
          null,
          0
        )
      );
      console.info({ message: "Client disconnected", uuid: ws.data.uuid });
    },
  },
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/connect") {
      const upgraded = server.upgrade(request, {
        data: {
          uuid: url.searchParams.get("uuid"),
        },
      });
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
