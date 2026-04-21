'use client';

import Link from 'next/link';
import { Suspense } from 'react';

import { RegisterForm } from '../../_components/register-form';
import { AuthBrandLogo } from '@/components/auth/auth-brand-logo';

function RegisterFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function SellerRegisterPage() {
  return (
    <div className="flex min-h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <div className="mx-auto h-24 flex items-center justify-center">
              <AuthBrandLogo size={96} />
            </div>
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">Satıcı Kaydı</h1>
              <p className="text-xl text-primary-foreground/80">Satıcı hesabınızı oluşturup panele girin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Satıcı Hesabı Oluştur</div>
            <div className="mx-auto max-w-xl text-muted-foreground">Kayıt sonrası hesabınıza seller rolü atanır.</div>
          </div>

          <div className="space-y-4">
            <Suspense fallback={<RegisterFormFallback />}>
              <RegisterForm mode="seller" fallbackNext="/admin/dashboard" />
            </Suspense>

            <p className="text-center text-muted-foreground text-xs">
              Zaten hesabın var mı?{' '}
              <Link prefetch={false} href="/auth/seller/login" className="text-primary underline-offset-4 hover:underline">
                Satıcı girişine dön
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
