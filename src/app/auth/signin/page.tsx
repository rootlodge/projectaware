'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Github, Mail, User, Lock, ArrowRight } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleOAuthSignIn = async (provider: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signIn(provider, {
        callbackUrl: '/onboarding',
        redirect: false,
      });
      
      if (result?.error) {
        setError('Authentication failed. Please try again.');
      } else if (result?.ok) {
        router.push('/onboarding');
      }
    } catch (error) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await signIn('credentials', {
        username: credentials.username,
        password: credentials.password,
        callbackUrl: '/onboarding',
        redirect: false,
      });
      
      if (result?.error) {
        setError('Invalid credentials. Please try again.');
      } else if (result?.ok) {
        router.push('/onboarding');
      }
    } catch (error) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalMode = () => {
    router.push('/onboarding');
  };

  return (
    <div className="onboarding-bg">
      <div className="onboarding-content min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-soft">
              <span className="text-4xl">🧠</span>
            </div>
            <h1 className="text-3xl font-bold text-glass mb-2 text-glow">Welcome Back</h1>
            <p className="text-muted-glass text-lg">Sign in to continue your AI journey</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </p>
            </div>
          )}

          {/* Main Card */}
          <div className="glass-card rounded-2xl p-8 border border-slate-600/50 space-y-6">
            
            {/* OAuth Providers */}
            {(process.env.NEXT_PUBLIC_GITHUB_ID || process.env.NEXT_PUBLIC_GOOGLE_ID) && (
              <>
                <div className="space-y-3">
                  {process.env.NEXT_PUBLIC_GITHUB_ID && (
                    <button
                      onClick={() => handleOAuthSignIn('github')}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-6 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl font-medium transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50"
                    >
                      <Github className="w-5 h-5 mr-3" />
                      Continue with GitHub
                    </button>
                  )}
                  
                  {process.env.NEXT_PUBLIC_GOOGLE_ID && (
                    <button
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50"
                    >
                      <Mail className="w-5 h-5 mr-3" />
                      Continue with Google
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-900/50 text-muted-glass">or</span>
                  </div>
                </div>
              </>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="input-dark w-full pl-12 pr-4 py-4 rounded-xl text-lg"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="input-dark w-full pl-12 pr-4 py-4 rounded-xl text-lg"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !credentials.username || !credentials.password}
                className="w-full flex items-center justify-center px-6 py-4 btn-primary-glow text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>

            {/* Local Mode Option */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/50 text-muted-glass">or</span>
              </div>
            </div>

            <button
              onClick={handleLocalMode}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 glass-dark hover:bg-slate-700/30 text-muted-glass hover:text-glass rounded-xl font-medium transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50"
            >
              Continue without account (Local only)
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-muted-glass text-sm">
              New to the neural network?{' '}
              <span className="text-blue-400 hover:text-blue-300 cursor-pointer">
                Your journey begins here
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
