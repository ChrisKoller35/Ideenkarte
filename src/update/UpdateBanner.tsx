import { useEffect, useState } from 'react';
import { getApi } from '../api';

/** Hinweis oben, sobald eine neue Version geladen ist, mit Knopf zum Neustarten. */
export function UpdateBanner() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const api = getApi();
    api
      .getReadyUpdate()
      .then((v) => v && setVersion(v))
      .catch(() => undefined);
    return api.onUpdateReady(setVersion);
  }, []);

  if (!version) return null;
  return (
    <div className="update-banner" role="status">
      <span>Neue Version {version} ist bereit.</span>
      <button className="btn btn--primary" onClick={() => void getApi().installUpdate()}>
        Neu starten
      </button>
    </div>
  );
}
