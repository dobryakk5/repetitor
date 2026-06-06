'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearCachedAuthUser, getCachedAuthUser } from '@/lib/api/auth-cache';

const PUBLIC_PATHS = ['/', '/login', '/register', '/training', '/tracking'];

export function AppAuthBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const [allowed, setAllowed] = useState(isPublic);

  useEffect(() => {
    let active = true;
    if (isPublic) {
      setAllowed(true);
      return () => { active = false; };
    }

    setAllowed(false);
    void getCachedAuthUser()
      .then(() => {
        if (active) setAllowed(true);
      })
      .catch(() => {
        clearCachedAuthUser();
        if (active) router.replace('/login');
      });

    return () => { active = false; };
  }, [isPublic, router]);

  if (!allowed) {
    return <main className="min-h-screen bg-[#f5f4f0] p-6 text-[14px] text-[#73726c]">Проверка доступа...</main>;
  }

  return <>{children}</>;
}
