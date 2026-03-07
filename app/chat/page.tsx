'use client';

import { MessageSquare } from 'lucide-react';

export default function ChatIndexPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-50 text-gray-400">
      <MessageSquare className="h-16 w-16 text-gray-300" />
      <div className="text-center">
        <p className="text-lg font-medium">เลือกห้องแชทจากด้านซ้าย</p>
        <p className="mt-1 text-sm">เพื่อเริ่มสนทนากับลูกค้า</p>
      </div>
    </div>
  );
}
