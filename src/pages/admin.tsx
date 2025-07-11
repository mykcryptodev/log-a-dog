import Head from "next/head";
import { useState } from "react";

const defaultQuery = `query Judges($start: BigInt!, $end: BigInt!) {
  votes(where: { votedAt_gte: $start, votedAt_lte: $end, isValid: true }) {
    items {
      voter
      logId
      votedAt
    }
  }
}`;

export default function AdminPage() {
  const [query, setQuery] = useState(defaultQuery);
  const [variables, setVariables] = useState("{\n  \"start\": 0,\n  \"end\": 0\n}");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const runQuery = async () => {
    setLoading(true);
    try {
      const vars = variables ? JSON.parse(variables) : undefined;
      const res = await fetch("/api/ghostgraph", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, variables: vars }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setResult("Error running query");
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Admin - Log a Dog</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col gap-4 px-4 py-16 max-w-3xl">
          <h1 className="text-5xl font-extrabold tracking-tight">Admin</h1>
          <textarea
            className="textarea textarea-bordered h-48"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <textarea
            className="textarea textarea-bordered h-24"
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
          />
          <button className="btn btn-primary w-32" onClick={() => void runQuery()} disabled={loading}>
            {loading ? "Running..." : "Run Query"}
          </button>
          {result && (
            <pre className="bg-base-200 p-4 rounded-lg overflow-auto whitespace-pre-wrap">
              {result}
            </pre>
          )}
        </div>
      </main>
    </>
  );
}
