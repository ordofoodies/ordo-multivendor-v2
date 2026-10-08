// lib/utils/constants/profileDefaultTabs.ts
"use client";
import { useTranslations } from "next-intl";
import { ITabItem } from "@/lib/utils/interfaces";
import useMembership from "@/lib/hooks/useMembership";

export const useProfileDefaultTabs = (): ITabItem[] => {
  const t = useTranslations();
  const { program } = useMembership();
  return [
    { label: t("profileDefaultTabs.tab1"), path: "/profile" },
    { label: t("profileDefaultTabs.tab2"), path: "/profile/addresses" },
    { label: t("profileDefaultTabs.tab3"), path: "/profile/order-history" },
    // labelled with the configurable program name; hidden until the program is enabled
    ...(program?.enabled ? [{ label: program.name, path: "/profile/membership" }] : []),
    { label: t("profileDefaultTabs.tab4"), path: "/profile/settings" },
    { label: t("profileDefaultTabs.tab5"), path: "/profile/getHelp" },
    { label: t("profileDefaultTabs.tab6"), path: "/profile/customerTicket" },
  ];
};
