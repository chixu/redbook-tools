import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const [command, ...args] = process.argv.slice(2);
const project = args[0] && !args[0].startsWith("-") ? args.shift() : "inventory";

if (!["dev", "build", "start", "typecheck"].includes(command)) {
  console.error(`Unsupported command: ${command}`);
  process.exit(1);
}

const projectDir = path.join(root, project);
if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(project) ||
    !existsSync(path.join(projectDir, "next.config.mjs"))) {
  console.error(`Unknown project: ${project}. Expected <project>/next.config.mjs.`);
  process.exit(1);
}

const cli = require.resolve(command === "typecheck" ? "typescript/bin/tsc" : "next/dist/bin/next");
const cliArgs = command === "typecheck" ? ["--noEmit", ...args] : [command, ...args];
const child = spawn(process.execPath, [cli, ...cliArgs], {
  cwd: projectDir,
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
