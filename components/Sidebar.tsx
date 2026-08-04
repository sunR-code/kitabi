'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HiOutlineHome, 
  HiOutlineBookOpen, 
  HiOutlineTag, 
  HiOutlineFolder, 
  HiOutlinePlus,
  HiOutlineArrowRightOnRectangle 
} from 'react-icons/hi2';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const navItems = [
  { href: '/', label: 'Dashboard', icon: HiOutlineHome },
  { href: '/books', label: 'Buku', icon: HiOutlineBookOpen },
  { href: '/books/new', label: 'Tambah Buku', icon: HiOutlinePlus },
  { href: '/categories', label: 'Kategori', icon: HiOutlineFolder },
  { href: '/tags', label: 'Tag', icon: HiOutlineTag },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-teal-400">Kitab-i</span>{' '}
          <span className="text-slate-400 text-sm font-normal">Admin</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 md:py-4 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
        <p className="hidden md:block px-6 text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link whitespace-nowrap ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} className="shrink-0" />
              <span className="md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-700 p-4">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <HiOutlineArrowRightOnRectangle size={20} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
