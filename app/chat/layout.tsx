'use client';

import { useState } from 'react';
import AuthProvider from '@/providers/AuthProvider';
import Sidebar from '@/components/chat/Sidebar';
import { useSocket } from '@/hooks/useSocket';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';

function ChatLayoutInner({ children }: { children: React.ReactNode }) {
  useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col lg:ml-0">
        {/* Mobile header with menu button */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">แชท</h1>
        </div>
        {children}
      </main>
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
