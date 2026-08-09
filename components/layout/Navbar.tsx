"use client";

import { useState } from "react";
import { Menu, Bell, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface NavbarProps {
  title: string;
  userName: string;
  userPhotoUrl?: string | null;
  notificationCount?: number;
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Navbar({
  title,
  userName,
  userPhotoUrl,
  notificationCount = 0,
  onMenuClick,
  onLogout,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/5 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-md p-2 text-ink/60 transition-colors duration-200 hover:bg-background-muted lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-[15px] font-semibold text-ink sm:text-[17px]">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          aria-label="Notifications"
          className="relative rounded-md p-2 text-ink/60 transition-colors duration-200 hover:bg-background-muted"
        >
          <Bell size={19} />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-crimson-600" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors duration-200 hover:bg-background-muted"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-crimson-100 text-crimson-700">
              {userPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userPhotoUrl} alt={userName} className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={16} />
              )}
            </div>
            <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-ink sm:inline">
              {userName}
            </span>
            <ChevronDown size={15} className="hidden text-ink/40 sm:inline" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-lg border border-black/5 bg-white shadow-card-hover"
                >
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium text-crimson-700 transition-colors duration-200 hover:bg-crimson-50"
                  >
                    <LogOut size={15} />
                    Log out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
