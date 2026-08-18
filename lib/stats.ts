import {
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";

export function formatMakerCount(count: unknown) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 1) {
    return "";
  }

  return `지금까지 ${n.toLocaleString("ko-KR")}명이 캡슐을 묻었어요.`;
}

export async function fetchMakerCount() {
  try {
    const snapshot = await getDoc(doc(getFirebaseFirestore(), "stats", "public"));
    if (!snapshot.exists()) {
      return null;
    }

    const count = Number(snapshot.data().makerCount);
    if (!Number.isFinite(count) || count < 1) {
      return null;
    }

    return count;
  } catch {
    return null;
  }
}

export async function recordCapsuleBury(uid: string) {
  const db = getFirebaseFirestore();
  const statsRef = doc(db, "stats", "public");
  const makerRef = doc(db, "makers", uid);

  await runTransaction(db, async (transaction) => {
    const statsSnap = await transaction.get(statsRef);
    const makerSnap = await transaction.get(makerRef);
    const isNewMaker = !makerSnap.exists();

    if (isNewMaker) {
      transaction.set(makerRef, { createdAt: serverTimestamp() });
    }

    if (!statsSnap.exists()) {
      transaction.set(statsRef, {
        buriedCount: 1,
        makerCount: 1,
      });
      return;
    }

    transaction.update(statsRef, {
      buriedCount: increment(1),
      ...(isNewMaker ? { makerCount: increment(1) } : {}),
    });
  });
}
