import Link from "next/link";
import { ResultsGrid } from "@/components/studio/ResultsGrid";

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Link href="/" className="text-sm text-body underline-offset-4 hover:underline">
        ← Studio
      </Link>
      <h1 className="mt-2 mb-6 text-xl font-semibold text-heading">Batch results</h1>
      <ResultsGrid batchId={id} />
    </main>
  );
}
