import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { HttpsProxyAgent } from "https-proxy-agent";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyUrl =
    env.HTTPS_PROXY ||
    env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    "";

  // Corporate networks often need an HTTP proxy for Node (Vite) outbound HTTPS.
  const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api/gov": {
          target: "https://data.gov.il",
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/gov/, ""),
          ...(agent ? { agent } : {}),
        },
      },
    },
  };
});
