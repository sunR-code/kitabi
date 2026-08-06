'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineTag,
  HiOutlineFolder,
  HiOutlinePlus,
  HiOutlineArrowRightOnRectangle
} from 'react-icons/hi2';
import { HiX } from 'react-icons/hi';

const navItems = [
  { href: '/', label: 'Dashboard', icon: HiOutlineHome, exact: true },
  { href: '/books', label: 'Daftar Buku', icon: HiOutlineBookOpen, exact: false },
  { href: '/books/new', label: 'Buku Baru', icon: HiOutlinePlus, exact: true },
  { href: '/categories', label: 'Kategori', icon: HiOutlineFolder, exact: false },
  { href: '/tags', label: 'Tag', icon: HiOutlineTag, exact: false },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.href;
    // For non-exact routes, match prefix but exclude sub-routes that have their own entry
    // e.g. /books should not match /books/new
    if (pathname === item.href) return true;
    if (pathname.startsWith(item.href + '/')) {
      // Check if there's a more specific nav item that matches
      const moreSpecific = navItems.find(
        n => n.href !== item.href && n.href.startsWith(item.href) && pathname.startsWith(n.href)
      );
      return !moreSpecific;
    }
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar flex flex-col fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo & Close Button */}
        <div className="px-6 py-6 border-b border-slate-800 flex justify-between items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Kitabi Logo"
            className="object-contain h-8 brightness-0 invert opacity-90"
          />
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={onClose}
          >
            <HiX size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col overflow-y-auto">
          <p className="px-6 text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Navigasi</p>
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-5 py-2.5 mx-3 my-0.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-2.5 w-full rounded-lg text-sm font-medium transition-all text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <HiOutlineArrowRightOnRectangle size={20} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
