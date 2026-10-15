import type { KartenAenderung, ProjektKarte } from '../../shared/types';
import type { useCards } from '../state/useCards';
import { FilterBar } from './FilterBar';
import { ProjectCard } from './ProjectCard';

interface Props {
  cards: ReturnType<typeof useCards>;
  onOpen: (karte: ProjektKarte) => void;
  onShowFolder: (ordner: string) => void;
}

/** Übersicht aller Projekte als Karten, mit Filter und Wurzelordner. */
export function Overview({ cards, onOpen, onShowFolder }: Props) {
  const onChange = (datei: string, aenderung: KartenAenderung) =>
    void cards.update(datei, aenderung);

  return (
    <div className="overview">
      <header className="overview__head">
        <h1 className="brand">Ideenkarte</h1>
        <div className="overview__root">
          <span className="overview__path" title={cards.einstellungen?.wurzelordner}>
            {cards.einstellungen?.wurzelordner ?? '…'}
          </span>
          <button className="btn btn--ghost" onClick={() => void cards.chooseRoot()}>
            Ordner ändern
          </button>
          <button className="btn btn--ghost" onClick={() => void cards.reload()}>
            Neu laden
          </button>
        </div>
      </header>
      <FilterBar filter={cards.filter} onChange={cards.setFilter} />
      {cards.error && <div className="error">{cards.error}</div>}
      <p className="overview__count">
        {cards.laedt
          ? 'Suche Projekte …'
          : `${cards.sichtbar.length} von ${cards.karten.length} Projekten`}
      </p>
      {!cards.laedt && cards.karten.length === 0 && (
        <p className="viewer__hint overview__empty">
          Keine projekt.json gefunden. Wähle oben einen anderen Ordner.
        </p>
      )}
      <div className="cards">
        {cards.sichtbar.map((karte) => (
          <ProjectCard
            key={karte.datei}
            karte={karte}
            onOpen={onOpen}
            onShowFolder={onShowFolder}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}
