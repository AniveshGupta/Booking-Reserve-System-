import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function GoogleSignInButton({ onError, onSuccess }) {
  const buttonRef = useRef(null);
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const user = await loginWithGoogle(response.credential);
          onSuccess?.(user);
        } catch (err) {
          onError?.(err.response?.data?.message || "Google sign-in failed");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 360,
      text: "continue_with",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return (
      <p style={{ fontSize: 12, opacity: 0.6, textAlign: "center" }}>
        Google sign-in not configured — set VITE_GOOGLE_CLIENT_ID in frontend/.env
      </p>
    );
  }

  return <div ref={buttonRef} style={{ display: "flex", justifyContent: "center" }} />;
}
