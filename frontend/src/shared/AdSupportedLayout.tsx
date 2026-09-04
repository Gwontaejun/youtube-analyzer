"use client";

import { ReactNode, useEffect, useState } from "react";

import { AdSenseSlot } from "./AdSenseSlot";
import { MobileAnchorAd } from "./MobileAnchorAd";

const leftRailSlotId =
  process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_LEFT_RAIL_SLOT_ID?.trim() ?? "";
type AdMode = "desktop" | "mobile" | "none";

function getAdMode(): AdMode {
  if (window.matchMedia("(min-width: 1200px)").matches) return "desktop";
  if (window.matchMedia("(max-width: 760px)").matches) return "mobile";
  return "none";
}

export function AdSupportedLayout({ children }: { children: ReactNode }) {
  const [adMode, setAdMode] = useState<AdMode | null>(null);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1200px)");
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const updateAdMode = () => setAdMode(getAdMode());

    updateAdMode();
    desktopQuery.addEventListener("change", updateAdMode);
    mobileQuery.addEventListener("change", updateAdMode);
    return () => {
      desktopQuery.removeEventListener("change", updateAdMode);
      mobileQuery.removeEventListener("change", updateAdMode);
    };
  }, []);

  return (
    <div className="ad-supported-layout">
      {adMode === "desktop" ? (
        <AdSenseSlot
          placement="left-rail"
          slotId={leftRailSlotId}
          variant="rail"
        />
      ) : null}
      <div className="ad-supported-content">{children}</div>
      <div className="ad-rail-balance" aria-hidden="true" />
      {adMode === "mobile" ? <MobileAnchorAd /> : null}
    </div>
  );
}
