import Head from "next/head";

export default function AdminPage() {
  return (
    <>
      <Head>
        <title>Admin - Log a Dog</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col gap-4 px-4 py-16 max-w-3xl">
          <h1 className="text-5xl font-extrabold tracking-tight">Admin</h1>
          <p className="opacity-60">GhostGraph explorer removed — Ghost Protocol is deprecated.</p>
        </div>
      </main>
    </>
  );
}
