import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  parseAura,
  parseWeather,
  type CapsuleAura,
  type WeatherSnapshot,
} from "@/lib/capsule-aura";
import { trackEvent } from "@/lib/analytics";
import { getFirebaseFirestore, getFirebaseStorage } from "@/lib/firebase";
import { recordCapsuleBury } from "@/lib/stats";

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

export type CapsulePhoto = {
  path: string;
  url: string;
};

export type CapsuleRecord = {
  recipient: string;
  letter: string;
  openDate: string;
  photos: CapsulePhoto[];
  ownerUid: string;
  createdAt: Timestamp | null;
  weather: WeatherSnapshot | null;
  aura: CapsuleAura | null;
};

export type BuriedCapsule = {
  id: string;
  recipient: string;
  letter: string;
  openDate: string;
  photos: CapsulePhoto[];
  weather: WeatherSnapshot | null;
  aura: CapsuleAura | null;
};

export type BuryProgress =
  | { phase: "aura" }
  | { phase: "photos"; current: number; total: number }
  | { phase: "document" };

function safeExtension(file: File) {
  const fromName = file.name.match(/\.([a-zA-Z0-9]+)$/);
  if (fromName) {
    return fromName[1].toLowerCase();
  }

  return MIME_EXTENSION[file.type] ?? "bin";
}

export async function buryCapsule(input: {
  uid: string;
  recipient: string;
  letter: string;
  openDate: string;
  files: File[];
  weather: WeatherSnapshot;
  aura: CapsuleAura;
  onProgress?: (progress: BuryProgress) => void;
}): Promise<BuriedCapsule> {
  const db = getFirebaseFirestore();
  const storage = getFirebaseStorage();
  const capsuleRef = doc(collection(db, "capsules"));
  const files = input.files.slice(0, 10);
  const photos: CapsulePhoto[] = [];

  for (const [index, file] of files.entries()) {
    input.onProgress?.({
      phase: "photos",
      current: index + 1,
      total: files.length,
    });

    const path = `capsules/${input.uid}/${capsuleRef.id}/${index}.${safeExtension(file)}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file, {
      contentType: file.type || "application/octet-stream",
    });
    const url = await getDownloadURL(fileRef);
    photos.push({ path, url });
  }

  input.onProgress?.({ phase: "document" });

  await setDoc(capsuleRef, {
    recipient: input.recipient,
    letter: input.letter,
    openDate: input.openDate,
    photos,
    ownerUid: input.uid,
    createdAt: serverTimestamp(),
    weather: input.weather,
    aura: input.aura,
  });

  try {
    await recordCapsuleBury(input.uid);
  } catch {
    // Capsule is already saved; social-proof counts can lag.
  }

  trackEvent("bury_capsule", {
    photo_count: photos.length,
    has_recipient: Boolean(input.recipient),
  });

  return {
    id: capsuleRef.id,
    recipient: input.recipient,
    letter: input.letter,
    openDate: input.openDate,
    photos,
    weather: input.weather,
    aura: input.aura,
  };
}

function parsePhotos(value: unknown): CapsulePhoto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "path" in item &&
      "url" in item &&
      typeof item.path === "string" &&
      typeof item.url === "string"
    ) {
      return [{ path: item.path, url: item.url }];
    }

    return [];
  });
}

export function parseCapsule(id: string, data: DocumentData): CapsuleRecord & { id: string } {
  return {
    id,
    recipient: typeof data.recipient === "string" ? data.recipient : "",
    letter: typeof data.letter === "string" ? data.letter : "",
    openDate: typeof data.openDate === "string" ? data.openDate : "",
    photos: parsePhotos(data.photos),
    ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
    createdAt: data.createdAt ?? null,
    weather: parseWeather(data.weather),
    aura: parseAura(data.aura),
  };
}

export function formatOpenDate(value: string) {
  if (!value) {
    return "열람일 없음";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function isCapsuleOpen(openDate: string, now = new Date()) {
  if (!openDate) {
    return true;
  }

  const open = new Date(`${openDate}T00:00:00`);
  if (Number.isNaN(open.getTime())) {
    return true;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today.getTime() >= open.getTime();
}

export function daysUntilOpen(openDate: string, now = new Date()) {
  if (isCapsuleOpen(openDate, now) || !openDate) {
    return 0;
  }

  const open = new Date(`${openDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((open.getTime() - today.getTime()) / 86_400_000);
}

export async function getCapsule(id: string): Promise<(CapsuleRecord & { id: string }) | null> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), "capsules", id));

  if (!snapshot.exists()) {
    return null;
  }

  return parseCapsule(snapshot.id, snapshot.data());
}

export async function listMyCapsules(uid: string) {
  const snapshot = await getDocs(
    query(collection(getFirebaseFirestore(), "capsules"), where("ownerUid", "==", uid)),
  );

  return snapshot.docs
    .map((item) => parseCapsule(item.id, item.data()))
    .sort((left, right) => (right.createdAt?.toMillis() ?? 0) - (left.createdAt?.toMillis() ?? 0));
}
