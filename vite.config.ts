import { readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { defineConfig } from "vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const projectRootDir = __dirname;
const ignoredHtmlSearchDirs = new Set([".git", "dist", "node_modules", "src-tauri", "target"]);

function getHtmlEntryPoints(dir: string = projectRootDir): Record<string, string> {
  const entryPoints: Record<string, string> = {};

  for (const dirent of readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = resolve(dir, dirent.name);

    if (dirent.isDirectory()) {
      if (ignoredHtmlSearchDirs.has(dirent.name) || dirent.name.startsWith(".")) {
        continue;
      }

      Object.assign(entryPoints, getHtmlEntryPoints(absolutePath));
      continue;
    }

    if (!dirent.isFile() || !dirent.name.endsWith(".html")) {
      continue;
    }

    const relativePath = relative(projectRootDir, absolutePath);
    const entryName = relativePath.slice(0, -".html".length).split(sep).join("/");
    entryPoints[entryName] = absolutePath;
  }

  return entryPoints;
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  build: {
    rollupOptions: {
      // Bundle every HTML page in the app so navigation keeps working as pages are added.
      input: getHtmlEntryPoints(),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
