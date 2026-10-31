import React from 'react';
import { Code, Globe, WifiOff, Store, Sun, Moon, UserCheck, Shield } from 'lucide-react';
import { AppUser, BusinessSettings, UserRole } from '../types/pos';
import { translations } from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  settings: BusinessSettings;
  activeUser: AppUser;
  onLanguageToggle: () => void;
  onToggleTheme: () => void;
  onOpenSwitchUser: () => void;
  onOpenAndroidCode: () => void;
  deviceMode: 'mobile' | 'tablet' | 'full';
  onDeviceModeChange: (mode: 'mobile' | 'tablet' | 'full') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  activeUser,
  onLanguageToggle,
  onToggleTheme,
  onOpenSwitchUser,
  onOpenAndroidCode,
  deviceMode,
  onDeviceModeChange,
}) => {
  const t = translations[settings.language];
  const isDark = settings.themeMode === 'dark';

  const roleBadgeColors: Record<UserRole, string> = {
    ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    MANAGER: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    SALESMAN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ACCOUNTANT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shadow-xs border border-slate-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner font-bold text-lg text-white">
              <Store className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight flex items-center gap-1.5">
              <span>{settings.language === 'bn' ? settings.businessNameBn : settings.businessName}</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 font-mono font-bold" title="বর্তমান অ্যাপ ভার্শন">
                {settings.appVersion || `v1.2.${settings.revisionCount || 1}`}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-emerald-400" />
              <span>{t.offlineStatus} (SQLite/Room)</span>
            </p>
          </div>
        </div>

        {/* Center: Device frame simulator switcher */}
        <div className="hidden lg:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => onDeviceModeChange('mobile')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              deviceMode === 'mobile' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Android Phone Preview"
          >
            মোবাইল (Phone)
          </button>
          <button
            onClick={() => onDeviceModeChange('tablet')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              deviceMode === 'tablet' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Android Tablet POS Preview"
          >
            ট্যাবলেট (Tablet)
          </button>
          <button
            onClick={() => onDeviceModeChange('full')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              deviceMode === 'full' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop Full Screen"
          >
            ফুলস্ক্রিন
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Active User Chip & Switch Button */}
          <button
            onClick={onOpenSwitchUser}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
            title={t.switchUser}
          >
            {activeUser.avatar ? (
              <img
                src={activeUser.avatar}
                alt={activeUser.name}
                className="w-5 h-5 rounded-full object-cover border border-blue-400"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                {activeUser.name.charAt(0)}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <span className="text-[11px] font-semibold block leading-tight truncate max-w-[85px]">
                {activeUser.name.split(' ')[0]}
              </span>
            </div>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${roleBadgeColors[activeUser.role]}`}>
              {activeUser.role}
            </span>
          </button>

          {/* Day & Night Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1"
            title={isDark ? t.lightMode : t.darkMode}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-once" />
            ) : (
              <Moon className="w-4 h-4 text-blue-300" />
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton language={settings.language} />

          {/* Android Code Project Explorer Button */}
          <button
            onClick={onOpenAndroidCode}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition border border-blue-400/30"
            title="Android Studio Kotlin Project Files"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Android কোড</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={onLanguageToggle}
            className="flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">{settings.language === 'bn' ? 'EN' : 'বাং'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
