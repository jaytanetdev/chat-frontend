'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { PlatformType } from '@/types/api';
import { getPlatformTheme } from '@/lib/platform-theme';

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

const FB_EMOJI_STICKERS: StickerPackage[] = [
  {
    packageId: 'fb_smileys',
    title: '😊 Smileys',
    stickerIds: [
      '1f600', '1f601', '1f602', '1f603', '1f604', '1f605', '1f606',
      '1f609', '1f60a', '1f60b', '1f60c', '1f60d', '1f60e', '1f60f',
      '1f610', '1f612', '1f613', '1f614', '1f616', '1f618', '1f61a',
      '1f61c', '1f61d', '1f61e', '1f620', '1f621', '1f622', '1f623',
      '1f624', '1f625', '1f628', '1f629', '1f62a', '1f62b', '1f62d',
      '1f630', '1f631', '1f632', '1f633', '1f635', '1f637',
    ],
  },
  {
    packageId: 'fb_gestures',
    title: '👋 Gestures',
    stickerIds: [
      '1f44d', '1f44e', '1f44b', '1f44c', '1f44f', '1f450',
      '1f4aa', '270a', '270b', '270c', '261d',
      '1f64c', '1f64f', '1f91d', '1f91b', '1f91c',
    ],
  },
  {
    packageId: 'fb_hearts',
    title: '❤️ Hearts',
    stickerIds: [
      '2764', '1f495', '1f496', '1f497', '1f498', '1f499',
      '1f49a', '1f49b', '1f49c', '1f49d', '1f49e', '1f49f',
      '1f48b', '1f48c', '1f48d', '1f48e',
    ],
  },
  {
    packageId: 'fb_animals',
    title: '🐱 Animals',
    stickerIds: [
      '1f431', '1f436', '1f42d', '1f439', '1f430', '1f43b',
      '1f43c', '1f428', '1f42f', '1f981', '1f434', '1f437',
      '1f438', '1f435', '1f649', '1f64a', '1f412', '1f427',
      '1f426', '1f414', '1f422', '1f40d', '1f433', '1f420',
    ],
  },
  {
    packageId: 'fb_food',
    title: '🍔 Food',
    stickerIds: [
      '1f354', '1f355', '1f32e', '1f32f', '1f37f', '1f366',
      '1f370', '1f382', '1f36d', '1f369', '1f36a', '1f36b',
      '2615', '1f37a', '1f377', '1f379', '1f37d', '1f353',
      '1f34e', '1f34a', '1f347', '1f349', '1f34c', '1f34b',
    ],
  },
  {
    packageId: 'fb_activities',
    title: '⚽ Activities',
    stickerIds: [
      '26bd', '1f3c0', '1f3c8', '26be', '1f3be', '1f3d0',
      '1f3b1', '1f3b3', '1f3af', '26f3', '1f3c6', '1f3c5',
      '1f3a4', '1f3a8', '1f3ad', '1f3ae', '1f3b2', '1f3b0',
    ],
  },
  {
    packageId: 'fb_objects',
    title: '🎉 Party',
    stickerIds: [
      '1f389', '1f38a', '1f388', '1f381', '1f386', '1f387',
      '2728', '1f31f', '1f4ab', '1f525', '1f4a5', '1f4af',
      '1f4a4', '1f4a8', '1f4a6', '1f4a3', '1f4a2', '1f4a1',
    ],
  },
];

function codePointToEmoji(codepoint: string): string {
  try {
    return String.fromCodePoint(parseInt(codepoint, 16));
  } catch {
    return '?';
  }
}

function getLineStickerUrl(stickerId: string): string {
  return `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png;compress=true`;
}

interface StickerPickerProps {
  platformType: PlatformType;
  onSelect: (packageId: string, stickerId: string) => void;
  onClose: () => void;
}

export default function StickerPicker({ platformType, onSelect, onClose }: StickerPickerProps) {
  const isLine = platformType === PlatformType.LINE;
  const theme = getPlatformTheme(platformType);

  const packages = useMemo(
    () => (isLine ? LINE_STICKER_PACKAGES : FB_EMOJI_STICKERS),
    [isLine],
  );

  const [activePackage, setActivePackage] = useState(packages[0]);

  useEffect(() => {
    setActivePackage(packages[0]);
  }, [packages]);

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
        {packages.map((pkg) => (
          <button
            key={pkg.packageId}
            onClick={() => setActivePackage(pkg)}
            className={cn(
              'shrink-0 rounded-lg p-1 transition-colors',
              activePackage.packageId === pkg.packageId
                ? cn('ring-1', theme.activeTab)
                : 'hover:bg-gray-50',
            )}
            title={pkg.title}
          >
            {isLine ? (
              <img
                src={getLineStickerUrl(pkg.stickerIds[0])}
                alt={pkg.title}
                className="h-8 w-8 object-contain"
                loading="lazy"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center text-xl">
                {pkg.title.split(' ')[0]}
              </span>
            )}
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
            {isLine ? (
              <img
                src={getLineStickerUrl(stickerId)}
                alt={`sticker-${stickerId}`}
                className="h-14 w-14 object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-4xl leading-none">
                {codePointToEmoji(stickerId)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
