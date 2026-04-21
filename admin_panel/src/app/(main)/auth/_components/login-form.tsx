'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useAuthTokenMutation } from '@/integrations/hooks';
import { useAdminTranslations } from '@/i18n';
import { useLocaleShort } from '@/i18n/use-locale-short';
import { getErrorMessage } from '@/integrations/shared';
import type { UserRoleName } from '@/integrations/shared';

type FormValues = {
  email: string;
  password: string;
  remember?: boolean;
};

function safeNext(next: string | null | undefined, fallback: string): string {
  const v = String(next ?? '').trim();
  if (!v || !v.startsWith('/')) return fallback;
  if (v.startsWith('//')) return fallback;
  return v;
}

type LoginFormProps = {
  mode?: 'admin' | 'seller';
  fallbackNext?: string;
};

export function LoginForm({ mode = 'admin', fallbackNext }: LoginFormProps = {}) {
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocaleShort();
  const t = useAdminTranslations(locale);

  const [login, loginState] = useAuthTokenMutation();

  const FormSchema = z.object({
    email: z.string().email({ message: t('admin.auth.login.emailRequired') }),
    password: z.string().min(6, { message: t('admin.auth.login.passwordMinLength') }),
    remember: z.boolean().optional(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await login({
        grant_type: 'password',
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }).unwrap();

      const role = (res?.user?.role ?? 'user') as UserRoleName;
      const isAdmin = role === 'admin';
      const isSeller = role === 'seller';
      const allowed = mode === 'seller' ? isSeller || isAdmin : isAdmin;
      if (!allowed) {
        toast.error(
          mode === 'seller'
            ? 'Bu hesap satıcı girişi için uygun değil.'
            : t('admin.auth.login.loginFailed'),
        );
        return;
      }

      toast.success(t('admin.auth.login.loginSuccess'));

      const defaultNext = fallbackNext ?? (mode === 'seller' ? '/seller' : '/admin');
      const next = safeNext(sp?.get('next'), defaultNext);
      router.replace(next);
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, t('admin.auth.login.loginFailed')));
    }
  };

  const isBusy = loginState.isLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.auth.login.emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('admin.auth.login.emailPlaceholder')}
                  autoComplete="email"
                  disabled={isBusy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.auth.login.passwordLabel')}</FormLabel>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('admin.auth.login.passwordPlaceholder')}
                  autoComplete="current-password"
                  disabled={isBusy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* UI-only remember */}
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(!!v)}
                  disabled={isBusy}
                  className="size-4"
                />
              </FormControl>
              <FormLabel
                htmlFor="login-remember"
                className="ml-1 font-medium text-muted-foreground text-sm"
              >
                {t('admin.auth.login.rememberMe')}
              </FormLabel>
            </FormItem>
          )}
        />

        <Button className="w-full" type="submit" disabled={isBusy}>
          {isBusy ? t('admin.auth.login.loggingIn') : t('admin.auth.login.loginButton')}
        </Button>
      </form>
    </Form>
  );
}
