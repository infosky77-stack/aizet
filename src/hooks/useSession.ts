'use client';

import { useState, useEffect } from 'react';
import type { PublicSession } from '@/types/auth';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useSession() {
  const [session, setSession] = useState<PublicSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSession(data); setStatus(data ? 'authenticated' : 'unauthenticated'); })
      .catch(() => setStatus('unauthenticated'));
  }, []);

  function signOut() {
    fetch('/api/auth/signout', { method: 'POST' }).then(() => { window.location.href = '/'; });
  }

  return { session, status, signOut };
}
