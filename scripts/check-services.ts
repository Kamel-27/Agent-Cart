import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SERVICES_DIR = new URL("../src/services", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

function check(dir: string): void {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      check(fullPath);
    } else if (fullPath.endsWith(".ts")) {
      const content = readFileSync(fullPath, "utf8");
      if (content.includes('from "next') || content.includes("from 'next'")) {
        console.error(`❌ Violation in ${fullPath}: files in src/services must not import from next/`);
        process.exit(1);
      }
    }
  }
}

check(SERVICES_DIR);
console.log("✅ Services layer is 100% decoupled from Next.js!");
