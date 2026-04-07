'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    label: 'Service',
    href: '/',
    icon: '/menu-img/Service.svg',
  },
  {
    label: 'Penjualan',
    href: '/penjualan',
    icon: '/menu-img/Penjualan.svg',
  },
  {
    label: 'Riwayat',
    href: '/history',
    icon: '/menu-img/Riwayat.svg',
  },
  {
    label: 'Laporan',
    href: '/laporan',
    icon: '/menu-img/Laporan.svg',
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 pb-safe z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1 p-2"
            >
              <img
                src={item.icon}
                alt={item.label}
                className={`w-10 h-10 object-contain transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'
                  }`}
              />
              <span className={`text-xs font-medium ${isActive ? 'text-[#E10600]' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
