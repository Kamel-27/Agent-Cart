import { NextResponse } from "next/server";
import { seedCatalog } from "@/lib/seed-catalog";

export async function POST() {
  try {
    const catalogPath = new URL("../../../../../data/catalog/products.json", import.meta.url);
    const result = await seedCatalog(catalogPath);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Reseed failed" },
      { status: 500 }
    );
  }
}
