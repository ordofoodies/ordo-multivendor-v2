"use client";

// import libraries
import React from "react";
import { useTranslations } from "next-intl";

// import components
import Heading from "@/lib/ui/useable-components/RiderandRestaurantsInfos/Heading/Heading";
import ApplicationStatus from "@/lib/ui/useable-components/RiderandRestaurantsInfos/MerchantApplicationForm/ApplicationStatus";

const MerchantStatus = () => {
  const t = useTranslations();

  return (
    <div className="w-screen h-auto px-4 pb-10">
      <Heading heading={t("merchant_status_heading")} />
      <ApplicationStatus />
    </div>
  );
};

export default MerchantStatus;
