'use client';

import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        void authApi.logout().finally(() => router.replace('/login'));
      }}
      className="h-9 rounded-[8px] border border-[#d8d4ca] bg-white px-3 text-[12px] font-medium text-[#1a1a18]"
    >
      Выйти
    </button>
  );
}
