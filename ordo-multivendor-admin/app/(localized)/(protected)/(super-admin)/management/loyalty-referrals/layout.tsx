'use client';

import { LoyaltyProvider } from '@/lib/context/super-admin/loyalty-referral.context';
import GlobalLayout from '@/lib/ui/layouts/protected/global';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LoyaltyProvider>
      <GlobalLayout>{children}</GlobalLayout>
    </LoyaltyProvider>
  );
}
