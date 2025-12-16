"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const token = searchParams.get("token"); // Assuming token is passed in URL if verified via link
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // If we have a token (link click), verify immediately
    // Note: better-auth usually handles the route itself if you configured baseURL/verify-email
    // But if we are redirecting here after signup saying "check your email", status is idle.
    if (!token && email) {
      // Just showing "Check your email" state
      setStatus("idle");
    }
  }, [token, email]);

  const handleResend = async () => {
    if (!email) return;
    setStatus("loading");
    try {
        await authClient.sendVerificationEmail({
            email,
            callbackURL: window.location.origin + "/dashboard" // Redirect to dashboard after verification
        });
      // Mock success for resend for now or handle real response
      // better-auth client usually returns void or result
      setStatus("idle");
      alert("Verification email sent!");
    } catch (e) {
      setStatus("error");
      setErrorMessage("Failed to send verification email. Please try again.");
    } finally {
        if(status === 'loading') setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          <div className="p-8 flex flex-col items-center text-center">
            {status === "loading" && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6"
                >
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </motion.div>
            )}

            {status === "success" && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6"
                >
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                </motion.div>
            )}

             {status === "error" && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6"
                >
                    <XCircle className="w-8 h-8 text-red-400" />
                </motion.div>
            )}
            
            {status === "idle" && (
                 <motion.div
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="w-20 h-20 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10"
             >
                 <Mail className="w-10 h-10 text-white" />
             </motion.div>
            )}

            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 mb-2">
              {status === "success" ? "Email Verified!" : status === "error" ? "Verification Failed" : "Check your inbox"}
            </h1>

            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              {status === "success" 
                ? "Your email has been successfully verified. You can now access all features of the platform."
                : status === "error"
                ? errorMessage || "Something went wrong providing your email."
                : `We've sent a verification link to ${email || 'your email'}. Please click the link to activate your account.`
              }
            </p>

            {/* Actions */}
            <div className="w-full space-y-3">
              {status === "success" ? (
                 <button
                 onClick={() => router.push("/dashboard")}
                 className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
               >
                 Go to Dashboard
                 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
              ) : (
                <>
                <button
                    onClick={handleResend}
                    disabled={status === "loading"}
                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === "loading" ? "Sending..." : "Resend Verification Email"}
                </button>
                
                <Link 
                    href="/login"
                    className="block text-xs text-gray-500 hover:text-gray-300 transition-colors mt-4"
                >
                    Back to Login
                </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer info using glassmorphism */}
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-600">
                Did not receive the email? Check your spam folder or contact support.
            </p>
        </div>
      </motion.div>
    </div>
  );
}
