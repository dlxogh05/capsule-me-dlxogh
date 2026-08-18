import { FirebaseError } from "firebase/app";
import { signInWithPopup, type UserCredential } from "firebase/auth";
import { trackEvent } from "@/lib/analytics";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";

export function authErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.";
  }

  switch (error.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "로그인이 완료되지 않았어요. Google 창을 닫지 말고 계정을 선택한 뒤 권한을 허용해 주세요.";
    case "auth/unauthorized-domain":
      return "이 도메인은 Firebase 인증에 허용되어 있지 않아요. Authorized domains에 localhost가 있는지 확인해 주세요.";
    case "auth/popup-blocked":
      return "팝업이 차단되었어요. 브라우저에서 팝업을 허용해 주세요.";
    case "auth/operation-not-allowed":
      return "Firebase Console에서 Google 로그인이 활성화되어 있지 않아요.";
    default:
      return `로그인에 실패했어요. (${error.code})`;
  }
}

export function isAuthError(error: unknown) {
  return error instanceof FirebaseError && error.code.startsWith("auth/");
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const credential = await signInWithPopup(getFirebaseAuth(), googleProvider);
  trackEvent("login", { method: "google" });
  return credential;
}
