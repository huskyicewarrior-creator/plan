'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile } from '@/lib/storage';
import ProfileSelector from '@/components/ProfileSelector';

export default function RootPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const profile = getActiveProfile();
    if (profile) {
      router.replace('/home');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#15130F' }}>
        <div
          className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#C2793B', borderRightColor: 'rgba(194,121,59,0.3)' }}
        />
      </div>
    );
  }

  return <ProfileSelector />;
}
