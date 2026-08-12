// src/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from "dotenv";
import { nodePolyfills } from "vite-plugin-node-polyfills";

dotenv.config({
  quiet: true,
});

export default defineConfig(() => {
  const { HOST, VITE_PORT } = process.env;

  return {
    plugins: [
      react(),
      nodePolyfills({
        protocolImports: true,
      }),
    ],
    server: {
      host: HOST || "0.0.0.0",
      port: parseInt(VITE_PORT || "5173", 10),
    }, 
  };
});
