"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileQuestion,
  ClipboardList,
  BarChart3,
  CalendarClock,
  Settings,
  FileText,
  X,
  Waves,
} from "lucide-react";

export type Role = "super_admin" | "teacher" | "student";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  super_admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Students & Teachers", href: "/admin/people", icon: Users },
    { label: "Classes & Subjects", href: "/admin/academics", icon: GraduationCap },
    { label: "Lab Batches", href: "/admin/batches", icon: CalendarClock },
    { label: "Results & Analytics", href: "/admin/results", icon: BarChart3 },
    { label: "Report Cards", href: "/admin/report-cards", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  teacher: [
    { label: "Overview", href: "/teacher", icon: LayoutDashboard },
    { label: "Question Bank", href: "/teacher/questions", icon: FileQuestion },
    { label: "Exam Builder", href: "/teacher/exams", icon: BookOpen },
    { label: "Grading Queue", href: "/teacher/grading", icon: ClipboardList },
    { label: "Class Analytics", href: "/teacher/analytics", icon: BarChart3 },
  ],
  student: [
    { label: "Exam Launchpad", href: "/student", icon: LayoutDashboard },
    { label: "Upcoming Batches", href: "/student/batches", icon: CalendarClock },
    { label: "Past Results", href: "/student/results", icon: BarChart3 },
  ],
};

interface SidebarProps {
  role: Role;
  userName: string;
  /** Mobile drawer open state — controlled by DashboardLayout */
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ role, userName, onNavigate }: { role: Role; userName: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson-600 text-cream-50">
          <Waves size={18} strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[13.5px] font-semibold text-ink">Soaring Fountain</p>
          <p className="text-[11px] text-ink/50">Group of Schools</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200 ${
                active
                  ? "bg-crimson-50 text-crimson-700"
                  : "text-ink/65 hover:bg-background-muted hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute left-0 h-5 w-[3px] rounded-full bg-crimson-600"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Icon size={18} strokeWidth={2} className={active ? "text-crimson-600" : "text-ink/40 group-hover:text-ink/70"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-black/5 px-5 py-4">
        <p className="text-[11px] uppercase tracking-wide text-ink/40">Signed in as</p>
        <p className="mt-0.5 truncate text-[13px] font-medium text-ink">{userName}</p>
      </div>
    </div>
  );
}

export default function Sidebar({ role, userName, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: static sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-black/5 lg:block">
        <SidebarContent role={role} userName={userName} />
      </aside>

      {/* Mobile: slide-over drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 w-72 shadow-card-hover lg:hidden"
            >
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="absolute right-3 top-4 rounded-md p-1.5 text-ink/50 hover:bg-background-muted"
              >
                <X size={18} />
              </button>
              <SidebarContent role={role} userName={userName} onNavigate={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
