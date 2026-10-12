"use client";

import { useState } from "react";
import { backupAndReset } from "@/lib/storage";

// Last-resort recovery (review P2): if the demo fails while rendering, the visitor can keep
// a byte-for-byte copy of the saved data and restart from the fictional seed.
export default function DemoError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [message, setMessage] = useState("");
  function restore() {
    try {
      const key = backupAndReset(window.localStorage);
      setMessage(key ? `Se guardó una copia sin cambios en «${key}». Reiniciando…` : "Reiniciando con los datos ficticios iniciales…");
    } catch {
      setMessage("El navegador no permitió guardar la copia; los datos no se borraron.");
      return;
    }
    window.location.reload();
  }
  return <main className="flex min-h-screen items-center justify-center bg-canvas p-6 text-ink">
    <div role="alert" className="card max-w-lg p-6 sm:p-8">
      <p className="eyebrow">DentistApp · demo</p>
      <h1 className="mt-2 text-2xl font-bold">La demo no pudo mostrar los datos guardados</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Puede deberse a datos de prueba dañados en este navegador. Puedes reintentar o guardar una copia de los datos y volver a los datos ficticios iniciales. Las versiones anteriores de la demo no se modifican.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={restore}>Guardar copia y restablecer demo</button>
        <button type="button" className="btn-soft" onClick={reset}>Reintentar</button>
      </div>
      {message && <p role="status" className="mt-4 text-sm">{message}</p>}
    </div>
  </main>;
}
