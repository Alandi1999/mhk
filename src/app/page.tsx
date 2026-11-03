import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight">MHK Moto Repuestos</h1>
      <p className="max-w-md text-muted-foreground">
        Tienda mayorista para talleres y locales de repuestos de motos.
        Próximamente.
      </p>
      <Button disabled>Ingresar</Button>
    </main>
  );
}
