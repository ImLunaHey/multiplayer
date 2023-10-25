export const AppShell = () => (
  <html lang="en">
    <head>
      <title>Multiplayer</title>
      <meta name="description" content="Minify things" />
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="view-transition" content="same-origin" />
      <script src="https://cdn.tailwindcss.com" />
      <script src="/script.js" defer />
    </head>
    <body className="h-full w-full bg-[#0e0c15]" />
    <script src="https://fish.lgbt/assets/js/htmx.org@1.9.4.min.js"></script>
  </html>
);
