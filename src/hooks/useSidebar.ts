import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  SIDEBAR_MENU,
  SIDEBAR_STORAGE_KEYS,
  type MenuGroup,
} from "@/components/Sidebar/menuConfig";

const COLLAPSED_KEY = SIDEBAR_STORAGE_KEYS.collapsed;
const EXPANDED_GROUP_KEY = SIDEBAR_STORAGE_KEYS.expandedGroup;

function getStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function setStoredCollapsed(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
  } catch {}
}

function getStoredExpandedGroup(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(EXPANDED_GROUP_KEY);
  } catch {
    return null;
  }
}

function setStoredExpandedGroup(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(EXPANDED_GROUP_KEY, id);
    else localStorage.removeItem(EXPANDED_GROUP_KEY);
  } catch {}
}

export function getGroupIdForPath(
  groups: MenuGroup[],
  pathname: string
): string | null {
  for (const g of groups) {
    const hasActive = g.items.some((item) => {
      if (item.path === pathname) return true;
      if (item.path === "/dashboard") return false;
      return pathname.startsWith(item.path + "/");
    });
    if (hasActive) return g.id;
  }
  return null;
}

export interface UseSidebarOptions {
  userRole: string | undefined;
}

export function useSidebar({ userRole }: UseSidebarOptions) {
  const location = useLocation();
  const [collapsed, setCollapsedState] = useState(getStoredCollapsed);
  const [expandedId, setExpandedIdState] = useState<string | null>(() => {
    const stored = getStoredExpandedGroup();
    if (stored) return stored;
    const visible = SIDEBAR_MENU.filter(
      (g) => !g.adminOnly || userRole === "super_admin"
    );
    return getGroupIdForPath(visible, location.pathname);
  });

  const isSuperAdmin = userRole === "super_admin";
  const visibleGroups = SIDEBAR_MENU.filter(
    (g) => !g.adminOnly || isSuperAdmin
  );

  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    const groups = SIDEBAR_MENU.filter(
      (g) => !g.adminOnly || userRole === "super_admin"
    );
    const groupId = getGroupIdForPath(groups, location.pathname);
    if (groupId) {
      setExpandedIdState(groupId);
      setStoredExpandedGroup(groupId);
    }
  }, [location.pathname, userRole]);

  const toggleGroup = useCallback((id: string) => {
    setExpandedIdState((prev) => {
      const next = prev === id ? null : id;
      setStoredExpandedGroup(next);
      return next;
    });
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      setStoredCollapsed(next);
      return next;
    });
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    setStoredCollapsed(value);
  }, []);

  return {
    collapsed,
    setCollapsed,
    toggleCollapsed,
    expandedId,
    setExpandedId: (id: string | null) => {
      setExpandedIdState(id);
      setStoredExpandedGroup(id);
    },
    toggleGroup,
    visibleGroups,
  };
}
