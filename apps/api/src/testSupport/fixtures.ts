import path from "node:path";

const fixturesRoot = path.resolve(import.meta.dirname, "../../../../fixtures");

export function fixturePath(...segments: string[]): string {
  return path.join(fixturesRoot, ...segments);
}
