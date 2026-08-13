import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/context/ThemeContext";
import { errorMessage } from "@/lib/api";

const CLIENT_ID_SET = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export function SignInModal() {
  const { signInOpen, closeSignIn, signIn } = useAuth();
  const { theme } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const handleCredential = async (credential?: string) => {
    if (!credential) {
      toast.error("Google didn't return a credential. Try again.");
      return;
    }
    setBusy(true);
    try {
      await signIn(credential);
      toast.success("Signed in");
    } catch (error) {
      toast.error(errorMessage(error, "Sign-in failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={signInOpen} onClose={closeSignIn} label="Sign in to HireSignal">
      <div className="p-32">
        <h2 className="text-h3 text-text-primary">Sign in to HireSignal</h2>
        <p className="text-body-sm text-text-secondary mt-8">
          Track companies, upload your resume, get matched jobs.
        </p>

        <div className="mt-24 flex justify-center">
          {CLIENT_ID_SET ? (
            <div aria-busy={busy}>
              <GoogleLogin
                onSuccess={(response) => void handleCredential(response.credential)}
                onError={() => toast.error("Google sign-in was cancelled or blocked.")}
                theme={theme === "dark" ? "filled_black" : "outline"}
                shape="pill"
                text="continue_with"
                width="320"
              />
            </div>
          ) : (
            <p className="text-mono-sm text-signal-red text-center">
              VITE_GOOGLE_CLIENT_ID is not set. Add it to .env and restart the dev server.
            </p>
          )}
        </div>

        <p className="text-mono-xs text-text-muted mt-24 text-center">
          Google sign-in only. HireSignal never stores a password.
        </p>
      </div>
    </Modal>
  );
}
