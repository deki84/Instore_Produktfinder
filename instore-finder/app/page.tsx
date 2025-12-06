import  ArtikelForm  from "./ArtikelListe/page";

export default function Home() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full flex-col dark:bg-black sm:items-start">
        <ArtikelForm />
        <div>
        </div>
      </main>
    </div>
  );
}
