import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

interface VerifiableProfile {
  verification?: {
    verifiedStatus?: string;
    trustedVerifierStatus?: string;
  };
}

export function isVerifiedAccount(profile: VerifiableProfile): boolean {
  return profile.verification?.verifiedStatus === "valid";
}

export function isTrustedVerifier(profile: VerifiableProfile): boolean {
  return profile.verification?.trustedVerifierStatus === "valid";
}

interface VerificationBadgeProps {
  profile: VerifiableProfile;
  size?: number;
}

export function VerificationBadge({ profile, size = 14 }: VerificationBadgeProps) {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  const trusted = isTrustedVerifier(profile);
  const verified = !trusted && isVerifiedAccount(profile);

  if (!trusted && !verified) return null;

  const iconName = trusted ? "workspace_premium" : "verified";
  const tooltipKey = trusted ? "verification.trustedVerifier" : "verification.verified";

  return (
    <span
      className="relative inline-flex items-center flex-shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        setShowTooltip((v) => !v);
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon name={iconName} size={size} className="text-sky-500" filled />
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[11px] text-white bg-gray-800 dark:bg-gray-600 rounded whitespace-nowrap z-50">
          {t(tooltipKey)}
        </span>
      )}
    </span>
  );
}
