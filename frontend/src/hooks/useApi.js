import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client.js';

/** Fetches `url` (GET) with params and exposes { data, loading, error, reload }. Pass url=null to skip. */
export default function useApi(url, params, deps = []) {
  const [state, setState] = useState({ data: null, loading: Boolean(url), error: null });
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    if (!url) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.get(url, { params });
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: getErrorMessage(err) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
