'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/cn';

interface StickerPackage {
  packageId: string;
  title: string;
  stickerIds: string[];
}

const LINE_STICKER_PACKAGES: StickerPackage[] = [
  {
    packageId: '446',
    title: 'Moon',
    stickerIds: Array.from({ length: 17 }, (_, i) => String(1988 + i)),
  },
  {
    packageId: '789',
    title: 'Sally',
    stickerIds: Array.from({ length: 17 }, (_, i) => String(10855 + i)),
  },
  {
    packageId: '1070',
    title: 'Moon 2',
    stickerIds: Array.from({ length: 17 }, (_, i) => String(17839 + i)),
  },
  {
    packageId: '6136',
    title: 'Making Amends',
    stickerIds: Array.from({ length: 24 }, (_, i) => String(10551376 + i)),
  },
  {
    packageId: '6325',
    title: 'Brown & Cony',
    stickerIds: Array.from({ length: 24 }, (_, i) => String(10979904 + i)),
  },
  {
    packageId: '8515',
    title: 'Pretty Phrases',
    stickerIds: Array.from({ length: 24 }, (_, i) => String(16581242 + i)),
  },
  {
    packageId: '11537',
    title: 'Animated',
    stickerIds: Array.from({ length: 24 }, (_, i) => String(52002734 + i)),
  },
  {
    packageId: '11538',
    title: 'CHOCO',
    stickerIds: Array.from({ length: 24 }, (_, i) => String(51626494 + i)),
  },
  {
    packageId: '11539',
    title: 'BT21',
    stickerIds: Array.from({ length: 24 }, (_, i) => String(52114110 + i)),
  },
];

function getStickerUrl(stickerId: string): string {
  return `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png;compress=true`;
}

function getPackageThumbUrl(pkg: StickerPackage): string {
  return getStickerUrl(pkg.stickerIds[0]);
}

interface StickerPickerProps {
  onSelect: (packageId: string, stickerId: string) => void;
  onClose: () => void;
}

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [activePackage, setActivePackage] = useState(LINE_STICKER_PACKAGES[0]);

  const handleSelect = useCallback(
    (stickerId: string) => {
      onSelect(activePackage.packageId, stickerId);
      onClose();
    },
    [activePackage, onSelect, onClose],
  );

  return (
    <div className="border-t border-gray-100 bg-white">
      {/* Package tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-2 py-1.5">
        {LINE_STICKER_PACKAGES.map((pkg) => (
          <button
            key={pkg.packageId}
            onClick={() => setActivePackage(pkg)}
            className={cn(
              'shrink-0 rounded-lg p-1 transition-colors',
              activePackage.packageId === pkg.packageId
                ? 'bg-primary-50 ring-1 ring-primary-300'
                : 'hover:bg-gray-50',
            )}
            title={pkg.title}
          >
            <img
              src={getPackageThumbUrl(pkg)}
              alt={pkg.title}
              className="h-8 w-8 object-contain"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="grid max-h-52 grid-cols-4 gap-1 overflow-y-auto p-2 sm:grid-cols-5 md:grid-cols-6">
        {activePackage.stickerIds.map((stickerId) => (
          <button
            key={stickerId}
            onClick={() => handleSelect(stickerId)}
            className="flex items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <img
              src={getStickerUrl(stickerId)}
              alt={`sticker-${stickerId}`}
              className="h-14 w-14 object-contain"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
