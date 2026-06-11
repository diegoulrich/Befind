import { spawn } from "node:child_process";

const children = new Set();

function run(name, command, args, env = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  children.add(child);

  child.on("exit", (code, signal) => {
    children.delete(child);
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.log(`[${name}] exited with ${reason}`);
  });

  return child;
}

function shutdown() {
  for (const child of children) {
    child.kill("SIGTERM");
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(143);
});

console.log("Starting Befind on Replit...");
console.log("- API: http://localhost:3001");
console.log("- Web: http://localhost:5173");

run("api", "npm", ["run", "dev:api"], { PORT: "3001" });
run("web", "npm", [
  "run",
  "dev",
  "--workspace",
  "@workspace/business-finder",
  "--",
  "--host",
  "0.0.0.0",
  "--port",
  "5173",
]);
