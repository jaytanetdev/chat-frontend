'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (token) router.replace('/chat');
  }, [token, router]);

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500">
            <MessageSquare className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h1>
          <p className="mt-1 text-sm text-gray-500">
            ระบบจัดการแชทหลายแพลตฟอร์ม
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
        >
          <div className="flex flex-col gap-4">
            <Input
              label="ชื่อผู้ใช้"
              placeholder="กรอกชื่อผู้ใช้"
              error={errors.username?.message}
              {...register('username')}
            />
            <Input
              label="รหัสผ่าน"
              type="password"
              placeholder="กรอกรหัสผ่าน"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          {loginMutation.error && (
            <p className="mt-3 text-center text-sm text-red-500">
              {loginMutation.error.message}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loginMutation.isPending}
            className="mt-6 w-full"
          >
            เข้าสู่ระบบ
          </Button>

          <p className="mt-4 text-center text-xs text-gray-400">
            <button type="button" className="text-primary-500 hover:underline">
              ลืมรหัสผ่าน?
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
