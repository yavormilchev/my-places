import { build } from "esbuild";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url)),
);

// Bundle our own code — including workspace packages like @my-places/shared,
// which resolve through a node_modules symlink but are local source, not a
// real npm install — while keeping genuine third-party dependencies external
// (installed normally via `npm ci` in production, not inlined into the
// bundle). `--packages=external` on the CLI can't make this distinction; it
// treats everything under node_modules, symlinked workspace packages
// included, as external.
const external = Object.keys(pkg.dependencies).filter(
  (name) => !name.startsWith("@my-places/"),
);

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.js",
  external,
});
