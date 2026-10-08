"use client";
import dynamic from 'next/dynamic';

// Dynamically import the component with SSR disabled
const MembershipProfileScreen = dynamic(
  () => import('@/lib/ui/screens/protected/profile').then(mod => mod.MembershipProfileScreen),
  { ssr: false }
);

export default function MembershipProfilePage() {
  return <MembershipProfileScreen/>
}
