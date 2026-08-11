import { readFile, writeFile, mkdir } from "node:fs/promises";
import { unzipSync } from "node:zlib";

async function main() {
  const filePath = "C:/Users/kamel/Downloads/Mobilia Phone Store.html";
  const html = await readFile(filePath, "utf8");

  // Extract Manifest
  const manifestMatch = html.match(/<script type="__bundler\/manifest">\s*([\s\S]*?)\s*<\/script>/);
  const templateMatch = html.match(/<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/);

  const outDir = new URL("../extracted_design/", import.meta.url);
  await mkdir(outDir, { recursive: true });

  if (manifestMatch?.[1]) {
    const manifest = JSON.parse(manifestMatch[1]);
    for (const [uuid, entry] of Object.entries(manifest) as any) {
      const bytes = Buffer.from(entry.data, "base64");
      const decompressed = entry.compressed ? unzipSync(bytes) : bytes;
      const ext = entry.mime.includes("javascript") ? "js" : entry.mime.includes("json") ? "json" : "txt";
      await writeFile(new URL(`${uuid}.${ext}`, outDir), decompressed);
      console.log(`Extracted asset ${uuid}.${ext} (${decompressed.length} bytes)`);
    }
  }

  if (templateMatch?.[1]) {
    const template = JSON.parse(templateMatch[1]);
    await writeFile(new URL("template.html", outDir), template);
    console.log(`Extracted template.html (${template.length} bytes)`);
  }
}

main().catch(console.error);
