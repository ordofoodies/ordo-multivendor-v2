"use client";

import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface MemberBadgeProps {
  label: string;
  className?: string;
}

// small pill marking a membership benefit (checkout fee row, restaurant cards)
const MemberBadge = ({ label, className = "" }: MemberBadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-primary-color dark:bg-gray-700 ${className}`}
  >
    <FontAwesomeIcon icon={faCrown} className="text-[10px]" />
    {label}
  </span>
);

export default MemberBadge;
