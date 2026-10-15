import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Einstellungen, KartenAenderung, ProjektKarte } from '../../shared/types';
import {
  filterKarten,
  sortKarten,
  STANDARD_FILTER,
  type KartenFilter,
} from '../../shared/projektInfo';
import { getApi } from '../api';

/** Projekt-Karten der Übersicht: laden, filtern, Status/Markierung ändern, Wurzelordner wählen. */
export function useCards() {
  const [einstellungen, setEinstellungen] = useState<Einstellungen | null>(null);
  const [karten, setKarten] = useState<ProjektKarte[]>([]);
  const [filter, setFilter] = useState<KartenFilter>(STANDARD_FILTER);
  const [laedt, setLaedt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLaedt(true);
    try {
      const api = getApi();
      setEinstellungen(await api.getSettings());
      setKarten(await api.listCards());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLaedt(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const update = useCallback(async (datei: string, aenderung: KartenAenderung) => {
    try {
      const neu = await getApi().updateCard(datei, aenderung);
      setKarten((prev) => prev.map((k) => (k.datei === datei ? neu : k)));
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const chooseRoot = useCallback(async () => {
    try {
      const neu = await getApi().chooseRootFolder();
      if (neu) await reload();
    } catch (e) {
      setError(String(e));
    }
  }, [reload]);

  const sichtbar = useMemo(() => sortKarten(filterKarten(karten, filter)), [karten, filter]);

  return {
    einstellungen,
    karten,
    sichtbar,
    filter,
    setFilter,
    laedt,
    error,
    reload,
    update,
    chooseRoot,
  };
}
