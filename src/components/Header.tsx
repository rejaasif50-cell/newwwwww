import React from 'react';
import { CSCProfile, Language } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  Building2,
  ShieldCheck,
  Wallet,
  Phone,
  Settings,
  Languages,
  BookOpen,
  ArrowDownToLine,
} from 'lucide-react';

interface HeaderProps {
  profile: CSCProfile;
  lang: Language;
  onToggleLang: () => void;
  onOpenSettings: () => void;
  todayCashInHand: number;
  totalMarketDue: number;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onOpenAdminManage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  lang,
  onToggleLang,
  onOpenSettings,
  todayCashInHand,
  totalMarketDue,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onOpenAdminManage,
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white shadow-md border-b border-blue-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Centre Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-blue-950 font-black flex items-center justify-center shadow-md shrink-0 text-base sm:text-lg tracking-tight border border-amber-200">
              CSC
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold truncate leading-tight tracking-tight text-white">
                  {lang === 'hi' && profile.centreNameHindi ? profile.centreNameHindi : profile.centreName}
                </h1>
                <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  ID: {profile.cscId}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-200/80 truncate flex items-center gap-2 mt-0.5">
                <span>VLE: <strong className="text-white font-medium">{profile.vleName}</strong></span>
                <span className="hidden sm:inline text-blue-300">•</span>
                <span className="hidden sm:inline flex items-center gap-1">
                  <Phone className="w-3 h-3 text-amber-400" /> {profile.mobile}
                </span>
              </p>
            </div>
          </div>

          {/* Right Action Badges & Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Cash in Hand Badge */}
            <div className="hidden md:flex flex-col items-end px-3 py-1 bg-blue-900/60 border border-blue-700/50 rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-blue-200 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-amber-400" />
                {lang === 'hi' ? 'गल्ले में नकद' : 'Cash in Hand'}
              </span>
              <span className={`text-sm font-bold ${todayCashInHand >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatCurrency(todayCashInHand)}
              </span>
            </div>

            {/* Quick Market Due Badge */}
            <div className="hidden lg:flex flex-col items-end px-3 py-1 bg-rose-950/40 border border-rose-800/40 rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-rose-300 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-rose-400" />
                {lang === 'hi' ? 'मार्केट उधार' : 'Market Due'}
              </span>
              <span className="text-sm font-bold text-rose-300">
                {formatCurrency(totalMarketDue)}
              </span>
            </div>

            {/* Admin Status & Login/Manage Button */}
            {isAdminLoggedIn ? (
              <button
                id="btn-admin-manage"
                type="button"
                onClick={onOpenAdminManage}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-blue-950 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-amber-300"
                title="Open Admin Management (Rates, Profile, Data)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-950" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </button>
            ) : (
              <button
                id="btn-admin-login"
                type="button"
                onClick={onOpenAdminLogin}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-800/80 hover:bg-blue-700 border border-amber-400/40 text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Login as Admin (PIN: admin123)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              id="btn-lang-toggle"
              type="button"
              onClick={onToggleLang}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-blue-800/80 hover:bg-blue-700 border border-blue-600/50 text-white flex items-center gap-1 transition-colors cursor-pointer"
              title="Switch Language / भाषा बदलें"
            >
              <Languages className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'hi' ? 'EN' : 'HI'}</span>
            </button>

            {/* Settings & Profile Button */}
            <button
              id="btn-profile-settings"
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-white bg-blue-800/80 hover:bg-blue-700 border border-blue-600/50 rounded-lg transition-colors cursor-pointer"
              title="Centre Settings & Info"
            >
              <Settings className="w-4 h-4 text-blue-200" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
