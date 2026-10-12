import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "next.cmd" : "next";
const result = spawnSync(command, ["build"], {
  stdio: "inherit",
  env: { ...process.env, DENTISTAPP_STATIC_EXPORT: "1" },
});
process.exit(result.status ?? 1);
