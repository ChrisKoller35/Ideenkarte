/** Anzeigetexte für Werte aus projekt.json. */
import type { Markierung, ProjektStatus } from '../../shared/types';

export const MARKIERUNG_LABEL: Record<Markierung, string> = {
  'mehr-ich': 'Mehr ich',
  'mehr-ki': 'Mehr KI',
  gemischt: 'Gemischt',
};

export const STATUS_LABEL: Record<ProjektStatus, string> = {
  idee: 'Idee',
  aktiv: 'Aktiv',
  pausiert: 'Pausiert',
  fertig: 'Fertig',
  archiviert: 'Archiviert',
};

export function markierungLabel(value: string): string {
  return MARKIERUNG_LABEL[value as Markierung] ?? value;
}

export function statusLabel(value: string): string {
  return STATUS_LABEL[value as ProjektStatus] ?? value;
}
