import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    return statSync(fullPath).isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

describe("removed integrations", () => {
  it("keeps social and remote media integrations out of active source", () => {
    const source = listFiles(join(process.cwd(), "src"))
      .filter((file) => /\.(ts|tsx|css)$/.test(file) && !file.includes(`${join("src", "test")}`))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(source).not.toMatch(/Snapchat|Discord|CompanionPanel|CompanionAction|onCall|youtube\.com|youtu\.be|<iframe|Spotify/i);
  });

  it("keeps cloud auth and sync integrations out of active runtime code", () => {
    const activeRuntimeFiles = [
      ...listFiles(join(process.cwd(), "src")).filter((file) => /\.(ts|tsx|css)$/.test(file) && !file.includes(`${join("src", "test")}`)),
      ...listFiles(join(process.cwd(), "server")).filter((file) => /\.(js|ts)$/.test(file)),
      join(process.cwd(), "package.json"),
      join(process.cwd(), ".env.local.example"),
    ].filter((file) => existsSync(file));

    const source = activeRuntimeFiles.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(source).not.toMatch(/DriveSync|googleapis|AUTH_GOOGLE|VITE_AUTH_URL|api\/drive|api\/auth\/login|Sign in with Google|express-session/i);
  });
});
