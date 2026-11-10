import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

async function schema(url) {
  if (new URL(url).hostname !== "developer.microsoft.com")
    throw new Error("Only Microsoft schemas are accepted");
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Schema unavailable: ${response.status}`);
  return response.json();
}
async function* files(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) yield* files(path);
    else if (entry.name.endsWith(".json")) yield path;
  }
}
const validator = new Ajv({ strict: false, loadSchema: schema });
let count = 0;
for await (const path of files(
  fileURLToPath(
    new URL("../../powerbi/NolaPulse.Report/definition", import.meta.url),
  ),
)) {
  const data = JSON.parse(await readFile(path, "utf8"));
  const validate = await validator.compileAsync({ $ref: data.$schema });
  if (!validate(data))
    throw new Error(`${path}: ${JSON.stringify(validate.errors)}`);
  count++;
}
console.log(
  `Validated ${count} report files against Microsoft schemas. Desktop verification remains required.`,
);
