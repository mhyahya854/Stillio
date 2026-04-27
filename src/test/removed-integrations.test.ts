import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function listFiles(dir: string): string[] {
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
});
