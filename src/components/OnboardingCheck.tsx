'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface OnboardingCheckProps {
  children: React.ReactNode;
}

export function OnboardingCheck({ children }: OnboardingCheckProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [cloudMode, setCloudMode] = useState(false);

  useEffect(() => {
    if (status === 'loading') return; // Still loading session
    checkOnboardingStatus();
  }, [status, session, pathname]);

  const checkOnboardingStatus = async () => {
    try {
      // Skip check if we're already on auth or onboarding pages
      if (pathname === '/onboarding' || pathname?.startsWith('/auth/')) {
        setIsChecking(false);
        return;
      }

      // Check configuration for cloud mode and onboarding status
      const configResponse = await fetch('/api/config?section=auth');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        const isCloudMode = configData.data?.cloudEnabled || false;
        setCloudMode(isCloudMode);

        // If cloud mode is enabled and user is not authenticated, redirect to sign-in
        if (isCloudMode && !session) {
          router.push('/auth/signin');
          return;
        }
      }

      // Check onboarding status from configuration
      const onboardingResponse = await fetch('/api/config?section=onboarding');
      if (onboardingResponse.ok) {
        const onboardingData = await onboardingResponse.json();
        const onboardingConfig = onboardingData.data;
        
        if (onboardingConfig?.firstTime && !onboardingConfig?.onboardingComplete) {
          setShouldShowOnboarding(true);
          router.push('/onboarding');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  if (status === 'loading' || isChecking) {
    return (
      <div className="onboarding-bg">
        <div className="onboarding-content min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-3 spinner-glow mx-auto mb-6"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border border-red-500/20 glow-border mx-auto"></div>
            </div>
            <p className="text-glass text-lg font-medium">
              {status === 'loading' ? 'Authenticating...' : 'Checking setup status...'}
            </p>
            <p className="text-muted-glass mt-2">Initializing neural pathways</p>
          </div>
        </div>
      </div>
    );
  }

  if (shouldShowOnboarding && pathname !== '/onboarding') {
    return null; // Router will handle redirect
  }

  return <>{children}</>;
}
