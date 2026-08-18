"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
  daysUntilOpen,
  isCapsuleOpen,
  listMyCapsules,
  type CapsuleRecord,
} from "@/lib/capsules";
import { isDev } from "@/lib/dev";
import { getFirebaseAuth } from "@/lib/firebase";

type CapsuleItem = CapsuleRecord & { id: string };

export function DevPanel() {
  const [open, setOpen] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [capsules, setCapsules] = useState<CapsuleItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isDev) {
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), async (user) => {
      setUid(user?.uid ?? null);
      setError(null);

      if (!user) {
        setCapsules([]);
        setLoadedAt(null);
        return;
      }

      try {
        const next = await listMyCapsules(user.uid);
        setCapsules(next);
        setLoadedAt(new Date().toLocaleTimeString("ko-KR"));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "query failed");
      }
    });
  }, []);

  const stats = useMemo(() => {
    const photoCount = capsules.reduce((sum, item) => sum + item.photos.length, 0);
    const openCount = capsules.filter((item) => isCapsuleOpen(item.openDate)).length;

    return {
      capsules: capsules.length,
      photos: photoCount,
      open: openCount,
      sealed: capsules.length - openCount,
    };
  }, [capsules]);

  if (!isDev) {
    return null;
  }

  return (
    <aside className="fixed right-4 bottom-4 z-30 w-[min(100%-2rem,22rem)] font-mono text-[11px] leading-relaxed">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1c1917]/92 text-[#e7e5e4] shadow-[0_20px_50px_-24px_rgb(0_0_0/0.55)]">
        <button
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span className="tracking-[0.16em] uppercase">Dev</span>
          <span className="text-[#a8a29e]">
            {stats.capsules} capsules · {open ? "hide" : "show"}
          </span>
        </button>

        {open ? (
            <div className="max-h-[min(50dvh,28rem)] space-y-3 overflow-auto border-t border-white/10 px-3.5 py-3">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#d6d3d1]">
              <dt className="text-[#a8a29e]">env</dt>
              <dd>development</dd>
              <dt className="text-[#a8a29e]">project</dt>
              <dd className="truncate">
                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "missing"}
              </dd>
              <dt className="text-[#a8a29e]">uid</dt>
              <dd className="truncate">{uid ?? "signed out"}</dd>
              <dt className="text-[#a8a29e]">loaded</dt>
              <dd>{loadedAt ?? "—"}</dd>
            </dl>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                ["capsules", stats.capsules],
                ["photos", stats.photos],
                ["open", stats.open],
                ["sealed", stats.sealed],
              ].map(([label, value]) => (
                <div className="rounded-xl bg-white/5 px-2 py-2 text-center" key={label}>
                  <p className="text-base font-medium text-white">{value}</p>
                  <p className="mt-0.5 text-[10px] tracking-wide text-[#a8a29e] uppercase">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {error ? <p className="text-[#f87171]">{error}</p> : null}

            {capsules.length > 0 ? (
              <ul className="space-y-2">
                {capsules.map((capsule) => (
                  <li className="rounded-xl bg-white/5 px-2.5 py-2" key={capsule.id}>
                    <p className="truncate text-[#f5f5f4]">
                      {capsule.recipient || "(no recipient)"}
                    </p>
                    <p className="truncate text-[#a8a29e]">{capsule.id}</p>
                    <p className="text-[#a8a29e]">
                      {isCapsuleOpen(capsule.openDate) ? "OPEN" : `SEALED ${daysUntilOpen(capsule.openDate)}d`}
                      {" · "}
                      {capsule.photos.length} photos
                      {capsule.aura ? ` · ${capsule.aura.shape}` : ""}
                    </p>
                    {capsule.aura ? (
                      <p className="truncate text-[#78716c]">{capsule.aura.keywords.join(" · ")}</p>
                    ) : null}
                    {capsule.photos[0] ? (
                      <p className="truncate text-[#78716c]">{capsule.photos[0].path}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#a8a29e]">no capsule docs yet</p>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
