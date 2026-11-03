import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";

// Separate from the usual dev server on 4321 so both can run side by side.
const PORT = 4329;

declare module "vitest" {
  export interface ProvidedContext {
    baseURL: string;
  }
}

// Serves the site from an Astro dev server whose agenda comes from the mock
// feed (see devServer.mjs).
export default async function setup(project: TestProject) {
  // Without Vitest's own variables, which switch Astro's dev server off.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("VITEST")),
  );
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(new URL("./devServer.mjs", import.meta.url)),
      fileURLToPath(new URL("../../../", import.meta.url)),
      String(PORT),
    ],
    { env, stdio: ["ignore", "pipe", "inherit"] },
  );

  const port = await new Promise<string>((resolve, reject) => {
    child.stdout.on("data", (chunk: Buffer) => {
      const match = /ready (\d+)/.exec(chunk.toString());
      if (match) resolve(match[1]);
    });
    child.once("exit", (code) =>
      reject(new Error(`Astro dev server exited early (code ${code})`)),
    );
  });
  project.provide("baseURL", `http://localhost:${port}`);

  return async () => {
    if (child.exitCode !== null) return;
    child.kill("SIGTERM");
    await once(child, "exit");
  };
}
