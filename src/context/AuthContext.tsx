import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authApi, setSessionEndedHandler, tokenStore } from "@/lib/api";
import type { User } from "@/types";

interface AuthApi {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** True only while restoring a stored session on first load. */
  isRestoring: boolean;
  signIn: (credential: string) => Promise<void>;
  signOut: () => void;
  /** Opens the sign-in modal from anywhere (guards, nav, CTAs). */
  promptSignIn: () => void;
  signInOpen: boolean;
  closeSignIn: () => void;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(() => Boolean(tokenStore.access()));
  const [signInOpen, setSignInOpen] = useState(false);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    // Anything cached under an authenticated identity has to go with it.
    queryClient.clear();
  }, [queryClient]);

  // The axios layer calls this when a refresh fails, which is the one place
  // that knows a session is unrecoverable.
  useEffect(() => {
    setSessionEndedHandler(() => {
      setUser(null);
      queryClient.clear();
    });
  }, [queryClient]);

  // Restore on load: the token in storage is only a claim, so it is verified
  // against /auth/me before the user is treated as signed in.
  useEffect(() => {
    if (!tokenStore.access()) {
      setIsRestoring(false);
      return;
    }

    let cancelled = false;
    authApi
      .me()
      .then((restored) => {
        if (!cancelled) setUser(restored);
      })
      .catch(() => {
        if (!cancelled) tokenStore.clear();
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (credential: string) => {
      const tokens = await authApi.google(credential);
      tokenStore.set(tokens.access_token, tokens.refresh_token);
      // The token response carries no profile, so fetch it before announcing
      // that the user is signed in.
      const profile = await authApi.me();
      setUser(profile);
      setSignInOpen(false);
      queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const value = useMemo<AuthApi>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === "admin",
      isRestoring,
      signIn,
      signOut,
      promptSignIn: () => setSignInOpen(true),
      signInOpen,
      closeSignIn: () => setSignInOpen(false),
    }),
    [user, isRestoring, signIn, signOut, signInOpen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
