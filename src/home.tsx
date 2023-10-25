/// <reference lib="dom" />
import { useEffect, useState } from "react";
import { Text } from "./components/text";
import { Cursor } from "./components/cursor";
import { useWebSocket } from "react-use-websocket/src/lib/use-websocket";
import { createRoot } from "react-dom/client";
import { Link } from "./components/link";
import { Title } from "./components/title";
import { randomUUID } from "crypto";
import { ReadyState } from "react-use-websocket";

// string to random hex colour
const stringToColour = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    // eslint-disable-next-line no-bitwise
    const value = (hash >> (i * 8)) & 0xff;
    colour += `00${value.toString(16)}`.substr(-2);
  }
  return colour;
};

const uuid = randomUUID();

const Home: React.FC = () => {
  const cursors: {
    [key: string]: { x: number; y: number };
  } = {};
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    `${location.origin.replace("http", "ws")}/connect`
  );

  if (lastMessage) {
    const data = JSON.parse(lastMessage.data);
    if (data.uuid !== uuid) {
      cursors[data.uuid] = { x: data.x, y: data.y };
    }
  }

  useEffect(() => {
    const setFromEvent = (event: MouseEvent) => {
      if (ReadyState.OPEN === readyState) {
        sendMessage(
          JSON.stringify({ uuid, x: event.clientX, y: event.clientY }),
          false
        );
      }
    };
    window.addEventListener("mousemove", setFromEvent);
    return () => window.removeEventListener("mousemove", setFromEvent);
  }, [readyState]);

  return (
    <>
      <header
        className="sm:w-4/6 w-5/6 container mx-auto mb-5"
        style={{
          viewTransitionName: "main",
        }}
      >
        <Link href="/">
          <Title>Multiplayer</Title>
        </Link>
      </header>

      <main className="sm:w-4/6 w-5/6 container mx-auto mb-5">
        <Text>Hi</Text>
        {Object.entries(cursors).map(([uuid, { x, y }]) => (
          <Cursor key={uuid} colour={stringToColour(uuid)} x={x} y={y} />
        ))}
      </main>

      <footer className="sm:w-4/6 w-5/6 container mx-auto mb-5">
        <Text>
          &copy; {new Date().getFullYear()} Multiplayer. All rights reserved.
        </Text>
        <img
          style={{
            display: "none",
          }}
          src="https://v.fish.lgbt/pixel.gif?id=multiplayer.fish.lgbt"
        />
      </footer>
    </>
  );
};

const root = createRoot(document.body);
root.render(<Home />);
