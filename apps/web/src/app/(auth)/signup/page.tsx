import type { Metadata } from "next";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Sign Up – EchoLeads",
  description: "Create your EchoLeads account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">EchoLeads</span>
          </div>
          <p className="text-slate-400 text-sm">Start finding leads on Reddit today.</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-white mb-1">Create an account</h1>
          <p className="text-slate-400 text-sm mb-6">Free to start, no credit card required</p>
          <SignupForm />
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
