import type { KartenAenderung, Markierung, ProjektKarte, ProjektStatus } from '../../shared/types';
import { MARKIERUNGEN, PROJEKT_STATUS } from '../../shared/types';
import { MARKIERUNG_LABEL, markierungLabel, STATUS_LABEL, statusLabel } from './labels';

interface Props {
  karte: ProjektKarte;
  onOpen: (karte: ProjektKarte) => void;
  onShowFolder: (ordner: string) => void;
  onChange: (datei: string, aenderung: KartenAenderung) => void;
}

const MAX_AUFGABEN = 3;

/** Eine Projekt-Karte: Name, Typ, Status, Markierung, nächste Aufgaben, Aktionen. */
export function ProjectCard({ karte, onOpen, onShowFolder, onChange }: Props) {
  const info = karte.info;
  if (!info) {
    return (
      <article className="card card--fehler">
        <h2 className="card__title">{karte.ordner.split(/[\\/]/).pop()}</h2>
        <p className="card__desc">projekt.json konnte nicht gelesen werden: {karte.fehler}</p>
        <p className="card__path" title={karte.datei}>
          {karte.datei}
        </p>
      </article>
    );
  }

  const aufgaben = info.naechsteAufgaben.slice(0, MAX_AUFGABEN);
  const weitere = info.naechsteAufgaben.length - aufgaben.length;

  return (
    <article className={`card card--${info.markierung} card--status-${info.status}`}>
      <header className="card__head">
        <span className="card__typ">{info.typ}</span>
        <span className={`badge badge--status-${info.status}`}>{statusLabel(info.status)}</span>
      </header>
      <h2 className="card__title">
        <button type="button" className="card__open" onClick={() => onOpen(karte)}>
          {info.name}
        </button>
      </h2>
      {info.stand && <p className="card__desc">{info.stand}</p>}

      {aufgaben.length > 0 && (
        <ul className="card__tasks" aria-label="Nächste Aufgaben">
          {aufgaben.map((a, i) => (
            <li key={i}>
              <span className={`wer wer--${a.wer}`}>{a.wer === 'ich' ? 'Ich' : 'KI'}</span>
              <span>{a.text}</span>
            </li>
          ))}
          {weitere > 0 && <li className="card__more">+ {weitere} weitere</li>}
        </ul>
      )}

      <div className="card__edit">
        <label>
          Markierung
          <select
            value={info.markierung}
            onChange={(e) => onChange(karte.datei, { markierung: e.target.value as Markierung })}
          >
            {!MARKIERUNGEN.includes(info.markierung as Markierung) && (
              <option value={info.markierung}>{markierungLabel(info.markierung)}</option>
            )}
            {MARKIERUNGEN.map((m) => (
              <option key={m} value={m}>
                {MARKIERUNG_LABEL[m]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={info.status}
            onChange={(e) => onChange(karte.datei, { status: e.target.value as ProjektStatus })}
          >
            {!PROJEKT_STATUS.includes(info.status as ProjektStatus) && (
              <option value={info.status}>{statusLabel(info.status)}</option>
            )}
            {PROJEKT_STATUS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        {!info.markierungGeprueft && (
          <span className="card__hint" title="Markierung wurde noch nicht bestätigt">
            ungeprüft
          </span>
        )}
      </div>

      <footer className="card__actions">
        <button type="button" className="btn btn--primary" onClick={() => onOpen(karte)}>
          Öffnen
        </button>
        <button type="button" className="btn" onClick={() => onShowFolder(karte.ordner)}>
          Im Explorer
        </button>
        {info.repo && (
          <span className="card__repo" title={info.repo}>
            GitHub
          </span>
        )}
      </footer>
    </article>
  );
}
