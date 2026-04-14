export enum PlatformType {
  LINE = 'LINE',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  SHOPEE = 'SHOPEE',
  LAZADA = 'LAZADA',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum RoomStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum RoomMemberRole {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  OBSERVER = 'OBSERVER',
}

export enum ChatDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export enum ChatSenderType {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

export enum ChatMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  STICKER = 'STICKER',
}

export interface Shop {
  shop_id: string;
  shop_name: string;
  is_active: boolean;
  create_at: string;
}

export interface Platform {
  platforms_id: string;
  platform_type: PlatformType;
  external_account_id: string | null;
  platform_name: string | null;
  shop_id: string;
  is_active: boolean;
  shop?: Shop;
}

export interface CustomerIdentity {
  customer_identity_id: string;
  platform_id: string;
  external_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  platform?: Platform;
}

export interface User {
  user_id: string;
  role: UserRole;
  username: string | null;
  create_at: string;
}

export interface RoomMember {
  room_members_id: string;
  room_id: string;
  user_id: string;
  role: RoomMemberRole;
  joined_at: string;
  user?: User;
}

export interface Room {
  room_id: string;
  platforms_id: string;
  customer_identity_id: string | null;
  assigned_user_id: string | null;
  unread_count: number;
  last_message_at: string | null;
  last_message_text: string | null;
  status: RoomStatus;
  create_at: string;
  update_at: string;
  platform?: Platform;
  customer_identity?: CustomerIdentity | null;
  assigned_user?: User | null;
  room_members?: RoomMember[];
}

export interface Chat {
  chat_id: string;
  room_id: string;
  sender_type: ChatSenderType;
  sender_id: string | null;
  direction: ChatDirection;
  external_message_id: string | null;
  message: string;
  message_type: ChatMessageType;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  create_at: string;
  sender_name?: string;
}

export interface ChatListResponse {
  items: Chat[];
  next_cursor: string | null;
  hasMore: boolean;
}

export interface LoginResponse {
  access_token: string;
  user_id: string;
  role: UserRole;
  username: string;
}

export interface QuickReply {
  quick_reply_id: string;
  user_id: string;
  label: string;
  text: string;
  sort_order: number;
  create_at: string;
  update_at: string;
}

export interface PaginatedRooms {
  items: Room[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  error_code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}
