import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Zap, Loader2 } from "lucide-react";

export default function Signup() {
  const { user, isPending, redirectToLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (isPending) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-surface)" }}
    >
      <div
        className="w-full max-w-[420px] p-8 space-y-6 rounded-2xl shadow-lg"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center gradient-brand"
          >
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Magnet Lab
          </h1>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Create your account
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            Start building traffic magnets free
          </p>
        </div>

        {/* Note: Since Mocha uses Google OAuth, we'll just show the Google button */}
        <div className="space-y-4">
          <button
            onClick={redirectToLogin}
            className="w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-95"
            style={{
              background: "white",
              color: "#1f2937",
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Free forever. No credit card required.
          </p>
        </div>

        {/* Sign in link */}
        <div className="text-center pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--brand)" }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
