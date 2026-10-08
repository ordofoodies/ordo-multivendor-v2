// library
import React, { Suspense } from "react";

// Membership screen
import Membership from "@/lib/ui/screens/unprotected/Membership";

const MembershipPage: React.FC = () => {
  return (
    // useSearchParams (Stripe return) needs a Suspense boundary
    <Suspense>
      <Membership />
    </Suspense>
  );
};

export default MembershipPage;
