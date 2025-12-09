import  ArtikelForm  from "./ArtikelListe/page";

export default function Home() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black w-full">
      <main className="flex min-h-screen flex-col justify-between bg-white dark:bg-black w-full">
        <ArtikelForm />
        <div>
        </div>
      </main>
    </div>
  );
}
