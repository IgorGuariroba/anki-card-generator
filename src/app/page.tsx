import Link from 'next/link';

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">English practice, made simple</p>
        <h1 id="page-title">English Light Verbs</h1>
        <p className="hero-copy">Crie cards com frases naturais, imagens e áudio para aprender inglês com mais fluidez.</p>
        <Link className="primary-button" href="/login">Começar</Link>
      </section>
    </main>
  );
}
