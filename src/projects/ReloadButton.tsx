import { useEffect, useState } from 'react';

interface Props {
  onReload: () => Promise<void>;
}

type Zustand = 'bereit' | 'laedt' | 'fertig';

/** Knopf «Neu laden» mit Rückmeldung, damit man sieht, dass etwas passiert ist. */
export function ReloadButton({ onReload }: Props) {
  const [zustand, setZustand] = useState<Zustand>('bereit');

  useEffect(() => {
    if (zustand !== 'fertig') return;
    const t = window.setTimeout(() => setZustand('bereit'), 1500);
    return () => window.clearTimeout(t);
  }, [zustand]);

  async function reload() {
    setZustand('laedt');
    try {
      await onReload();
    } finally {
      setZustand('fertig');
    }
  }

  return (
    <button
      className="btn btn--ghost"
      onClick={() => void reload()}
      disabled={zustand === 'laedt'}
      title="Ordnerbaum und geöffnete Datei neu einlesen"
    >
      {zustand === 'laedt' ? 'Lädt …' : zustand === 'fertig' ? 'Neu geladen ✓' : 'Neu laden'}
    </button>
  );
}
