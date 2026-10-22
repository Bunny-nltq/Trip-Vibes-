"use client";

import { useEffect, useState } from "react";

interface TrangThaiAI {
  aiBat: boolean;
  loading: boolean;
}

let cachedTrangThai: boolean | null = null;
let healthPromise: Promise<boolean> | null = null;

function fetchTrangThai(): Promise<boolean> {
  if (cachedTrangThai !== null) {
    return Promise.resolve(cachedTrangThai);
  }
  if (!healthPromise) {
    healthPromise = fetch("/api/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const isLive = Boolean(data && data.liveAiEnabled === true);
        cachedTrangThai = isLive;
        return isLive;
      })
      .catch(() => {
        cachedTrangThai = false;
        return false;
      });
  }
  return healthPromise;
}

/**
 * Hook useTrangThaiAI: Đọc /api/health đúng 1 lần trong vòng đời ứng dụng.
 * Trả về { aiBat, loading }.
 */
export function useTrangThaiAI(): TrangThaiAI {
  const [aiBat, setAiBat] = useState<boolean>(cachedTrangThai ?? false);
  const [loading, setLoading] = useState<boolean>(cachedTrangThai === null);

  useEffect(() => {
    let isMounted = true;
    fetchTrangThai().then((bat) => {
      if (isMounted) {
        setAiBat(bat);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return { aiBat, loading };
}
