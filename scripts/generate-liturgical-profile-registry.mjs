import fs from "node:fs/promises";
import path from "node:path";

const PROFILES_ROOT = path.resolve("content/liturgical-profiles");
const OUTPUT_PATH = path.resolve(
  "content/liturgical-calendar/generated-profile-registry.json"
);
const CHECK_ONLY = process.argv.includes("--check");

async function listJsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return files;
}

async function main() {
  const files = (await listJsonFiles(PROFILES_ROOT)).sort((a, b) =>
    a.localeCompare(b)
  );
  const profiles = [];

  for (const file of files) {
    profiles.push(JSON.parse(await fs.readFile(file, "utf8")));
  }

  profiles.sort((a, b) => a.slug.localeCompare(b.slug));
  const serialized = `${JSON.stringify(profiles, null, 2)}\n`;

  if (CHECK_ONLY) {
    let existing = "";
    try {
      existing = await fs.readFile(OUTPUT_PATH, "utf8");
    } catch {
      throw new Error(
        `Missing generated profile registry: ${path.relative(process.cwd(), OUTPUT_PATH)}`
      );
    }

    if (existing !== serialized) {
      throw new Error(
        "Generated liturgical profile registry is stale. Run npm run generate:liturgical-profile-registry."
      );
    }

    console.log(`Liturgical profile registry is current (${profiles.length} profiles).`);
    return;
  }

  await fs.writeFile(OUTPUT_PATH, serialized, "utf8");
  console.log(`Generated ${path.relative(process.cwd(), OUTPUT_PATH)} (${profiles.length} profiles).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
