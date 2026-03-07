# Frontend - AI Documentation

## Architecture
Next.js 16 App Router with React Server Components and Client Components.

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with fonts
│   ├── page.tsx           # Home → redirect to /chat
│   ├── globals.css        # Tailwind CSS v4 + theme
│   ├── login/
│   │   └── page.tsx       # Login page
│   └── chat/
│       ├── layout.tsx     # Chat layout with Sidebar
│       ├── page.tsx       # Empty state
│       └── [roomId]/
│           └── page.tsx   # Chat room
├── components/
│   ├── ui/                # Reusable UI primitives
│   ├── chat/              # Chat-specific components
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & API clients
├── providers/             # React context providers
├── schemas/               # Zod validation schemas
├── stores/                # Zustand state stores
├── types/                 # TypeScript definitions
└── public/                # Static assets
```

## Tech Stack
| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| React | React 19.2.3 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + PostCSS |
| State | Zustand 5.0.11 |
| Data Fetching | TanStack Query 5.90.21 |
| Forms | React Hook Form 7.71.2 + Zod 4.3.6 |
| HTTP | Axios |
| Real-time | Socket.io-client 4.8.3 |
| Icons | Lucide React |

## State Management (Zustand)

### Auth Store (`stores/auth.store.ts`)
```typescript
interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  role: 'ADMIN' | 'USER' | null;
  activeShopId: string | null;
  setAuth: (data: LoginResponse) => void;
  setActiveShopId: (shopId: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Persisted to localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'auth-storage' }
  )
);
```

### Chat Store (`stores/chat.store.ts`)
```typescript
interface ChatState {
  activeRoomId: string | null;
  typingUsers: Map<string, string[]>;  // roomId -> userIds[]
  platformFilter: PlatformType | null;
  setActiveRoomId: (roomId: string | null) => void;
  setPlatformFilter: (platform: PlatformType | null) => void;
  addTypingUser: (roomId: string, userId: string) => void;
  removeTypingUser: (roomId: string, userId: string) => void;
  clearTypingUsers: (roomId: string) => void;
}
```

## Custom Hooks

### useAuth (`hooks/useAuth.ts`)
```typescript
function useAuth() {
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data);
      router.push('/chat');
    },
  });

  const { mutate: logout } = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logoutStore();
      router.push('/login');
    },
  });

  return { login, logout, isLoggingIn };
}
```

### useSocket (`hooks/useSocket.ts`)
```typescript
function useSocket() {
  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    socket.on('new_message', handleNewMessage);
    socket.on('room_updated', handleRoomUpdated);
    socket.on('messages_read', handleMessagesRead);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('new_message');
      socket.off('room_updated');
      socket.off('messages_read');
      socket.off('typing');
      socket.disconnect();
    };
  }, [token]);

  return socket;
}
```

### useRooms (`hooks/useRooms.ts`)
```typescript
function useRooms() {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', activeShopId, platformFilter],
    queryFn: () => roomApi.getRooms({ shopId: activeShopId, platform: platformFilter }),
    enabled: !!activeShopId,
  });

  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: shopApi.getShops,
  });

  return { rooms, shops, isLoading };
}
```

### useMessages (`hooks/useMessages.ts`)
```typescript
function useMessages(roomId: string) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['messages', roomId],
    queryFn: ({ pageParam }) => chatApi.getMessages(roomId, { cursor: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!roomId,
  });

  return {
    messages: data?.pages.flatMap(page => page.messages) ?? [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
```

## API Integration (Axios)

### Axios Config (`lib/axios.ts`)
```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000',
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Retry logic with exponential backoff
```

### Socket.io Config (`lib/socket.ts`)
```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000', {
  autoConnect: false,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  auth: { token: '' },
});

export function getSocket(): Socket {
  const token = useAuthStore.getState().token;
  if (token) {
    socket.auth = { token };
  }
  return socket;
}
```

## Component Patterns

### UI Components

#### Button (`components/ui/Button.tsx`)
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// Usage:
<Button variant="primary" size="md" isLoading={isSubmitting}>
  Send
</Button>
```

#### Input (`components/ui/Input.tsx`)
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

#### Avatar (`components/ui/Avatar.tsx`)
```typescript
interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
// Generates fallback initials from name
// Hash-based color generation for consistent avatars
```

### Chat Components

#### Sidebar (`components/chat/Sidebar.tsx`)
- Platform filter tabs (LINE, Facebook, Instagram, etc.)
- Shop selector dropdown
- Search by customer name
- Room list with infinite scroll
- Unread badges
- Online status indicators

#### ChatWindow (`components/chat/ChatWindow.tsx`)
- Message list with infinite scroll (reverse)
- Auto-mark-read on view
- Typing indicators
- Date separators

#### ChatBubble (`components/chat/ChatBubble.tsx`)
```typescript
interface ChatBubbleProps {
  message: Chat;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
}
// Supports TEXT, IMAGE types
// Different styles for IN/OUT direction
```

#### ChatInput (`components/chat/ChatInput.tsx`)
```typescript
function ChatInput({ roomId }: { roomId: string }) {
  const { register, handleSubmit, reset } = useForm<SendMessageInput>({
    resolver: zodResolver(sendMessageSchema),
  });

  const onSubmit = (data: SendMessageInput) => {
    socket.emit('send_message', {
      room_id: roomId,
      content: data.message,
      message_type: 'TEXT',
    });
    reset();
  };

  // Emit typing indicator on input
}
```

#### RoomItem (`components/chat/RoomItem.tsx`)
```typescript
interface RoomItemProps {
  room: Room;
  isActive: boolean;
  onClick: () => void;
}
// Shows avatar, customer name, last message preview
// Unread count badge
// Platform icon
// Timestamp (relative: 2m, 1h, yesterday, date)
```

## Type Definitions

### Platform Types (`types/index.ts`)
```typescript
export enum PlatformType {
  LINE = 'LINE',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  SHOPEE = 'SHOPEE',
  LAZADA = 'LAZADA',
}

export enum ChatDirection {
  IN = 'IN',      // From customer
  OUT = 'OUT',    // To customer
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
  FILE = 'FILE',
}

export enum RoomStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}
```

### Core Interfaces
```typescript
export interface Room {
  room_id: string;
  customer_identity: CustomerIdentity;
  platform: Platform;
  status: RoomStatus;
  unread_count: number;
  assigned_user?: User;
  last_chat?: Chat;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  chat_id: string;
  room_id: string;
  direction: ChatDirection;
  sender_type: ChatSenderType;
  sender_id?: string;
  sender?: User | CustomerIdentity;
  message_type: ChatMessageType;
  content: string;
  media_url?: string;
  external_message_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface CustomerIdentity {
  customer_identity_id: string;
  external_user_id: string;
  display_name: string;
  avatar_url?: string;
  platform: Platform;
}

export interface Platform {
  platforms_id: string;
  platform_type: PlatformType;
  platform_name: string;
  external_account_id: string;
}

export interface User {
  user_id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  avatar_url?: string;
}

export interface Shop {
  shop_id: string;
  shop_name: string;
  is_active: boolean;
}
```

## Validation Schemas (Zod)

### Auth Schema (`schemas/auth.schema.ts`)
```typescript
export const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

### Chat Schema (`schemas/chat.schema.ts`)
```typescript
export const sendMessageSchema = z.object({
  message: z.string().min(1, 'กรุณากรอกข้อความ').max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
```

## Routing

### Route Structure
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | page.tsx | Redirect to /chat |
| `/login` | login/page.tsx | Login form |
| `/chat` | chat/page.tsx | Empty state (select room) |
| `/chat/[roomId]` | chat/[roomId]/page.tsx | Chat room |

### Auth Protection
```typescript
// providers/AuthProvider.tsx
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated() && pathname !== '/login') {
      redirect('/login');
    }
    if (isAuthenticated() && pathname === '/login') {
      redirect('/chat');
    }
  }, [isAuthenticated, pathname]);

  return <>{children}</>;
}
```

## Styling (Tailwind CSS v4)

### Custom Theme (`globals.css`)
```css
@theme {
  --color-primary: #2E8B57;      /* Green */
  --color-primary-dark: #1F5F3C;
  --color-secondary: #6A4FA0;     /* Purple */
  --color-secondary-dark: #4A3575;
  --color-danger: #DC3545;
  --color-success: #28A745;
  --color-warning: #FFC107;

  /* Platform Colors */
  --color-line: #06C755;
  --color-facebook: #1877F2;
  --color-instagram: #E4405F;
  --color-shopee: #EE4D2D;
  --color-lazada: #0F156D;
}
```

### Utility Functions (`lib/cn.ts`)
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Error Handling

### Error Codes (`lib/error-codes.ts`)
```typescript
export const errorMessages: Record<string, string> = {
  'AUTH_001': 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
  'AUTH_002': 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  'ENTITY_001': 'ไม่พบข้อมูลที่ต้องการ',
  'PLATFORM_001': 'ไม่พบการตั้งค่าแพลตฟอร์ม',
  // ...
};

export function getErrorMessage(code: string): string {
  return errorMessages[code] || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}
```

## Providers

### QueryProvider (`providers/QueryProvider.tsx`)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

## Development Guidelines

1. **Server vs Client Components:**
   - Use Server Components for static data
   - Mark interactive components with `'use client'`
   - Keep WebSocket logic in hooks, not Server Components

2. **State Management:**
   - Zustand for global state (auth, chat)
   - TanStack Query for server state
   - useState/useReducer for local state

3. **Forms:**
   - Always use react-hook-form + Zod
   - Provide Thai error messages
   - Handle loading states

4. **API Calls:**
   - Use TanStack Query for server data
   - Use Socket.io for real-time
   - Handle errors consistently

5. **Styling:**
   - Use Tailwind CSS classes
   - Use `cn()` for conditional classes
   - Follow existing color palette

6. **Types:**
   - Define types in `types/`
   - Use strict TypeScript
   - Export enums from types

## Performance Optimizations

- React.memo for RoomItem (prevent re-render on list scroll)
- useCallback for event handlers
- Virtualization for long message lists (use react-window if needed)
- Debounced search input
- Optimistic updates for sent messages (TODO)

## Missing Features

- Image upload/file attachments
- Emoji picker
- Rich text input
- Voice messages
- Message search
- Customer details panel
- Mobile responsive layout
- Push notifications
- PWA support
