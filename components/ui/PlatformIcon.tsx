'use client';

import { cn } from '@/lib/cn';
import { MessageCircle, Facebook, Instagram, ShoppingBag, Package } from 'lucide-react';
import { PlatformType } from '@/types/api';

interface PlatformIconProps {
  type: PlatformType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const colorClasses: Record<PlatformType, string> = {
  [PlatformType.LINE]: 'text-green-500',
  [PlatformType.FACEBOOK]: 'text-blue-600',
  [PlatformType.INSTAGRAM]: 'text-pink-500',
  [PlatformType.SHOPEE]: 'text-orange-500',
  [PlatformType.LAZADA]: 'text-blue-500',
};

const iconMap: Record<PlatformType, React.ComponentType<{ className?: string }>> = {
  [PlatformType.LINE]: MessageCircle,
  [PlatformType.FACEBOOK]: Facebook,
  [PlatformType.INSTAGRAM]: Instagram,
  [PlatformType.SHOPEE]: ShoppingBag,
  [PlatformType.LAZADA]: Package,
};

export default function PlatformIcon({ type, size = 'md', className }: PlatformIconProps) {
  const Icon = iconMap[type] ?? MessageCircle;
  return <Icon className={cn(sizeClasses[size], colorClasses[type], className)} />;
}
