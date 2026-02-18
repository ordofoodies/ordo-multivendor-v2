'use client';
import SUPER_ADMIN_GUARD from '@/lib/hoc/SUPER_ADMIN_GUARD';
import { GoogleMapsProvider } from '@/lib/context/global/google-maps.context';
import { useConfiguration } from '@/lib/hooks/useConfiguration';
import SuperAdminLayout from '@/lib/ui/layouts/protected/super-admin';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { GOOGLE_MAPS_KEY, LIBRARIES } = useConfiguration();

  const ProtectedLayout = SUPER_ADMIN_GUARD(
    ({ children }: { children: React.ReactNode }) => {
      return <SuperAdminLayout>{children}</SuperAdminLayout>;
    }
  );

  // Only render GoogleMapsProvider when API key is loaded
  if (!GOOGLE_MAPS_KEY) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
  }

  return (
    <GoogleMapsProvider apiKey={GOOGLE_MAPS_KEY} libraries={LIBRARIES}>
      <ProtectedLayout>{children}</ProtectedLayout>
    </GoogleMapsProvider>
  );
}
