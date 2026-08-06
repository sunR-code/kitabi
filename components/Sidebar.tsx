'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
  { href: '/', label: 'Dashboard', icon: HiOutlineHome },
  { href: '/books', label: 'Buku', icon: HiOutlineBookOpen },
  { href: '/books/new', label: 'Tambah Buku', icon: HiOutlinePlus },
  { href: '/categories', label: 'Kategori', icon: HiOutlineFolder },
  { href: '/tags', label: 'Tag', icon: HiOutlineTag },
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
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error', err);
    }
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
          <Image 
            src="/logo.png" 
            alt="Kitab-i Logo" 
            width={100} 
            height={32} 
            className="object-contain filter invert opacity-90"
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
          <p className="px-6 text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-5 py-2.5 mx-3 my-1 rounded-lg text-sm font-medium transition-all ${
                  isActive 
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
