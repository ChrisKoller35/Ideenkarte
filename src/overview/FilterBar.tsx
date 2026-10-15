import type { KartenFilter } from '../../shared/projektInfo';
import { MARKIERUNGEN, PROJEKT_STATUS } from '../../shared/types';
import { MARKIERUNG_LABEL, STATUS_LABEL } from './labels';

interface Props {
  filter: KartenFilter;
  onChange: (filter: KartenFilter) => void;
}

/** Filter der Übersicht: Markierung als Knöpfe, Status als Auswahl. */
export function FilterBar({ filter, onChange }: Props) {
  const markierungen = [{ value: '', label: 'Alle' }].concat(
    MARKIERUNGEN.map((m) => ({ value: m, label: MARKIERUNG_LABEL[m] })),
  );
  return (
    <div className="filter-bar" role="toolbar" aria-label="Filter">
      <div className="chips" role="group" aria-label="Markierung">
        {markierungen.map((m) => (
          <button
            key={m.value || 'alle'}
            type="button"
            className={`chip ${m.value ? `chip--${m.value}` : ''} ${
              filter.markierung === m.value ? 'chip--active' : ''
            }`}
            aria-pressed={filter.markierung === m.value}
            onClick={() => onChange({ ...filter, markierung: m.value })}
          >
            {m.label}
          </button>
        ))}
      </div>
      <label className="filter-bar__status">
        Status
        <select
          value={filter.status}
          onChange={(e) => onChange({ ...filter, status: e.target.value })}
        >
          <option value="ohne-archiv">Alle ohne Archiv</option>
          <option value="">Alle</option>
          {PROJEKT_STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
