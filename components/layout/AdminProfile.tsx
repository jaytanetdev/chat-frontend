'use client';

import { LogOut } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';

export default function AdminProfile() {
  const { username, role } = useAuthStore();
  const logout = useLogout();

  return (
    <div className="flex items-center gap-3 border-t border-gray-200 p-4">
      <Avatar name={username} size="md" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{username}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
      <button
        onClick={logout}
        className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
        title="ออกจากระบบ"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
