import { PlatformType } from '@/types/api';

export interface PlatformTheme {
  bubble: string;
  bubbleHover: string;
  text: string;
  timeText: string;
  senderName: string;
  inputFocus: string;
  sendBtn: string;
  sendBtnHover: string;
  activeTab: string;
  scrollBtn: string;
  scrollBtnHover: string;
  badgeText: string;
  unreadTime: string;
  activeRoom: string;
}

const LINE_THEME: PlatformTheme = {
  bubble: 'bg-[#06C755] text-white',
  bubbleHover: 'hover:bg-[#05b34d]',
  text: 'text-white',
  timeText: 'text-green-200',
  senderName: 'text-[#06C755]',
  inputFocus: 'focus:border-[#06C755] focus:ring-[#06C755]',
  sendBtn: 'bg-[#06C755] text-white',
  sendBtnHover: 'hover:bg-[#05b34d]',
  activeTab: 'bg-[#06C755]/10 text-[#06C755] ring-[#06C755]/30',
  scrollBtn: 'bg-[#06C755] hover:bg-[#05b34d]',
  scrollBtnHover: 'hover:bg-[#05b34d]',
  badgeText: 'text-[#06C755]',
  unreadTime: 'text-[#06C755]',
  activeRoom: 'bg-[#06C755]/5 hover:bg-[#06C755]/5',
};

const FACEBOOK_THEME: PlatformTheme = {
  bubble: 'bg-[#0084FF] text-white',
  bubbleHover: 'hover:bg-[#0073e6]',
  text: 'text-white',
  timeText: 'text-blue-200',
  senderName: 'text-[#0084FF]',
  inputFocus: 'focus:border-[#0084FF] focus:ring-[#0084FF]',
  sendBtn: 'bg-[#0084FF] text-white',
  sendBtnHover: 'hover:bg-[#0073e6]',
  activeTab: 'bg-[#0084FF]/10 text-[#0084FF] ring-[#0084FF]/30',
  scrollBtn: 'bg-[#0084FF] hover:bg-[#0073e6]',
  scrollBtnHover: 'hover:bg-[#0073e6]',
  badgeText: 'text-[#0084FF]',
  unreadTime: 'text-[#0084FF]',
  activeRoom: 'bg-[#0084FF]/5 hover:bg-[#0084FF]/5',
};

const INSTAGRAM_THEME: PlatformTheme = {
  bubble: 'bg-[#E1306C] text-white',
  bubbleHover: 'hover:bg-[#c4256d]',
  text: 'text-white',
  timeText: 'text-pink-200',
  senderName: 'text-[#E1306C]',
  inputFocus: 'focus:border-[#E1306C] focus:ring-[#E1306C]',
  sendBtn: 'bg-[#E1306C] text-white',
  sendBtnHover: 'hover:bg-[#c4256d]',
  activeTab: 'bg-[#E1306C]/10 text-[#E1306C] ring-[#E1306C]/30',
  scrollBtn: 'bg-[#E1306C] hover:bg-[#c4256d]',
  scrollBtnHover: 'hover:bg-[#c4256d]',
  badgeText: 'text-[#E1306C]',
  unreadTime: 'text-[#E1306C]',
  activeRoom: 'bg-[#E1306C]/5 hover:bg-[#E1306C]/5',
};

const SHOPEE_THEME: PlatformTheme = {
  bubble: 'bg-[#EE4D2D] text-white',
  bubbleHover: 'hover:bg-[#d94426]',
  text: 'text-white',
  timeText: 'text-orange-200',
  senderName: 'text-[#EE4D2D]',
  inputFocus: 'focus:border-[#EE4D2D] focus:ring-[#EE4D2D]',
  sendBtn: 'bg-[#EE4D2D] text-white',
  sendBtnHover: 'hover:bg-[#d94426]',
  activeTab: 'bg-[#EE4D2D]/10 text-[#EE4D2D] ring-[#EE4D2D]/30',
  scrollBtn: 'bg-[#EE4D2D] hover:bg-[#d94426]',
  scrollBtnHover: 'hover:bg-[#d94426]',
  badgeText: 'text-[#EE4D2D]',
  unreadTime: 'text-[#EE4D2D]',
  activeRoom: 'bg-[#EE4D2D]/5 hover:bg-[#EE4D2D]/5',
};

const LAZADA_THEME: PlatformTheme = {
  bubble: 'bg-[#0F1689] text-white',
  bubbleHover: 'hover:bg-[#0c1170]',
  text: 'text-white',
  timeText: 'text-indigo-200',
  senderName: 'text-[#0F1689]',
  inputFocus: 'focus:border-[#0F1689] focus:ring-[#0F1689]',
  sendBtn: 'bg-[#0F1689] text-white',
  sendBtnHover: 'hover:bg-[#0c1170]',
  activeTab: 'bg-[#0F1689]/10 text-[#0F1689] ring-[#0F1689]/30',
  scrollBtn: 'bg-[#0F1689] hover:bg-[#0c1170]',
  scrollBtnHover: 'hover:bg-[#0c1170]',
  badgeText: 'text-[#0F1689]',
  unreadTime: 'text-[#0F1689]',
  activeRoom: 'bg-[#0F1689]/5 hover:bg-[#0F1689]/5',
};

const THEME_MAP: Record<PlatformType, PlatformTheme> = {
  [PlatformType.LINE]: LINE_THEME,
  [PlatformType.FACEBOOK]: FACEBOOK_THEME,
  [PlatformType.INSTAGRAM]: INSTAGRAM_THEME,
  [PlatformType.SHOPEE]: SHOPEE_THEME,
  [PlatformType.LAZADA]: LAZADA_THEME,
};

export function getPlatformTheme(type?: PlatformType | null): PlatformTheme {
  return THEME_MAP[type ?? PlatformType.LINE] ?? LINE_THEME;
}
