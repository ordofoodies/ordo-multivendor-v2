"use client";

// import libraries
import React from "react";
import { useTranslations } from "next-intl";

// import components
import Heading from "@/lib/ui/useable-components/RiderandRestaurantsInfos/Heading/Heading";
import ResubmitDocuments from "@/lib/ui/useable-components/RiderandRestaurantsInfos/RiderRegistrationForm/ResubmitDocuments";

const RiderResubmit = () => {
  const t = useTranslations();

  return (
    <div className="w-screen h-auto px-4">
      <Heading heading={t("rider_resubmit_heading")} />
      <div className="mx-auto mb-10 max-w-xl rounded-md bg-white p-6 shadow-lg dark:bg-gray-800">
        <ResubmitDocuments />
      </div>
    </div>
  );
};

export default RiderResubmit;
