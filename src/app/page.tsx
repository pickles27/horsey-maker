import ClientMaker from "@/components/ClientMaker";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Horsey Maker <span aria-hidden>🐴</span>
        </h1>
      </header>
      <ClientMaker />
    </main>
  );
}
