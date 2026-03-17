import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const LG_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/** true quando viewport < 1024px (sidebar vira drawer) */
export function useIsSidebarDrawer() {
  const [isDrawer, setIsDrawer] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`);
    const onChange = () => setIsDrawer(window.innerWidth < LG_BREAKPOINT);
    mql.addEventListener("change", onChange);
    setIsDrawer(window.innerWidth < LG_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDrawer;
}
