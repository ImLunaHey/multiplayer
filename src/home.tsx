/// <reference lib="dom" />
import { memo, useEffect, useMemo, useState } from "react";
import { Text } from "./components/text";
import { Cursor } from "./components/cursor";
import { useWebSocket } from "react-use-websocket/src/lib/use-websocket";
import { createRoot } from "react-dom/client";
import { Link } from "./components/link";
import { Title } from "./components/title";
import { randomUUID } from "crypto";
import { ReadyState } from "react-use-websocket";

if (!("randomUUID" in global.crypto))
  // https://stackoverflow.com/a/2117523/2800218
  // LICENSE: https://creativecommons.org/licenses/by-sa/4.0/legalcode
  crypto.randomUUID = function randomUUID() {
    return (
      // @ts-expect-error
      ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
        /[018]/g,
        // @ts-expect-error
        (c) =>
          (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
          ).toString(16)
      )
    );
  };

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

const Alert: React.FC<{ text: string }> = ({ text }) => (
  <div
    className="fixed flex items-center w-full max-w-xs p-4 rounded-lg right-5 bottom-5 text-white border bg-[#0e0c15]"
    role="alert"
  >
    <div className="text-sm font-normal">{text}</div>
  </div>
);

const uuid = randomUUID();

const Home: React.FC = () => {
  const alerts: { text: string; uuid: string }[] = [];
  const cursors: { [key: string]: { x: number; y: number } } = {};
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    `${location.origin.replace("http", "ws")}/connect?uuid=${uuid}`,
    {
      retryOnError: true,
      reconnectAttempts: 10,
      reconnectInterval: 6000,
      shouldReconnect: (closeEvent) => true,
    }
  );

  if (lastMessage) {
    const data = JSON.parse(lastMessage.data);
    const eventType = data.type;
    if (eventType === "join") {
      // Dont add a duplicate alert
      if (!alerts.find((alert) => alert.uuid === data.uuid)) {
        alerts.push({
          text: `${stringToColour(data.uuid)} has joined the game!`,
          uuid: data.uuid,
        });

        // Remove the alert after 5 seconds
        setTimeout(() => {
          alerts.splice(1);
        }, 5_000);
      }
    }
    if (eventType === "update") {
      cursors[data.uuid] = { x: data.x, y: data.y };
    }
    if (eventType === "leave") {
      delete cursors[data.uuid];
      alerts.push({
        text: `${stringToColour(data.uuid)} has left the game!`,
        uuid: data.uuid,
      });

      // Remove the alert after 5 seconds
      setTimeout(() => {
        alerts.splice(1);
      }, 5_000);
    }
  }

  useEffect(() => {
    const sendMouseMovement = (event: MouseEvent) => {
      if (ReadyState.OPEN === readyState) {
        sendMessage(
          JSON.stringify({ x: event.clientX, y: event.clientY }),
          false
        );
      }
    };
    const sendTouchMovement = (event: TouchEvent) => {
      if (ReadyState.OPEN === readyState) {
        sendMessage(
          JSON.stringify({
            uuid,
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          }),
          false
        );
      }
    };
    window.addEventListener("mousemove", sendMouseMovement);
    window.addEventListener("touchmove", sendTouchMovement);
    return () => {
      window.removeEventListener("mousemove", sendMouseMovement);
      window.removeEventListener("touchmove", sendTouchMovement);
    };
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
        <Text>
          <Link href="https://github.com/ImLunaHey/multiplayer" external>
            github.com/ImLunaHey/multiplayer
          </Link>
        </Text>
        {useMemo(
          () =>
            Object.entries(cursors).map(([uuid, { x, y }]) => (
              <Cursor key={uuid} colour={stringToColour(uuid)} x={x} y={y} />
            )),
          [cursors]
        )}
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

      {alerts.map(({ uuid, text }, index) => (
        <Alert key={uuid} text={text} />
      ))}
    </>
  );
};

const root = createRoot(document.body);
root.render(<Home />);
