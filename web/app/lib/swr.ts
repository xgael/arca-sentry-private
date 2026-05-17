"use client";

import useSWR, { type SWRConfiguration } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
};

export function usePolling<T>(
  key: string | null,
  refreshMs = 3000,
  opts?: SWRConfiguration<T>,
) {
  return useSWR<T>(key, fetcher, {
    refreshInterval: refreshMs,
    revalidateOnFocus: true,
    keepPreviousData: true,
    ...opts,
  });
}

export function useOnce<T>(key: string | null) {
  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });
}
