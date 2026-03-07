'use client';

import AuthProvider from '@/providers/AuthProvider';
import Sidebar from '@/components/chat/Sidebar';
import { useSocket } from '@/hooks/useSocket';

function ChatLayoutInner({ children }: { children: React.ReactNode }) {
  useSocket();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col ">{children}</main>
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ChatLayoutInner>{children}</ChatLayoutInner>
    </AuthProvider>
  );
}
