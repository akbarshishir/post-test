import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, MoreHorizontal } from 'lucide-react';
import { translations } from '../i18n/translations';

export type NavTab = 'dashboard' | 'pos' | 'products' | 'customers' | 'more';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: 'bn' | 'en';
  cartCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
  cartCount,
}) => {
  const t = translations[language];

  const items = [
    { id: 'dashboard' as NavTab, label: t.dashboard, icon: LayoutDashboard },
    { id: 'pos' as NavTab, label: t.sales, icon: ShoppingCart, badge: cartCount > 0 ? cartCount : undefined },
    { id: 'products' as NavTab, label: t.products, icon: Package },
    { id: 'customers' as NavTab, label: t.customers, icon: Users },
    { id: 'more' as NavTab, label: t.more, icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg select-none">
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around h-16 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all relative ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`w-11 h-7 rounded-full flex items-center justify-center transition-all relative ${
                  isActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight truncate max-w-[68px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
