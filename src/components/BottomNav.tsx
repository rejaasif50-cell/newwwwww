import React from 'react';
import { Language } from '../types';
import {
  LayoutDashboard,
  BookOpenText,
  Banknote,
  FileCheck2,
  ReceiptText,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'ledger' | 'cash' | 'services' | 'receipt';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  lang: Language;
  dueCount: number;
  pendingServicesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  lang,
  dueCount,
  pendingServicesCount,
}) => {
  const tabs = [
    {
      id: 'dashboard' as NavTab,
      label: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'ledger' as NavTab,
      label: lang === 'hi' ? 'ग्राहक खाता (Ledger)' : 'Ledger Khata',
      icon: BookOpenText,
      badge: dueCount > 0 ? `${dueCount}` : null,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'cash' as NavTab,
      label: lang === 'hi' ? 'रोकड़ बही (Cash)' : 'Cash Register',
      icon: Banknote,
      badge: null,
    },
    {
      id: 'services' as NavTab,
      label: lang === 'hi' ? 'सेवाएं (Services)' : 'Services',
      icon: FileCheck2,
      badge: pendingServicesCount > 0 ? `${pendingServicesCount}` : null,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'receipt' as NavTab,
      label: lang === 'hi' ? 'रसीद (Bill)' : 'Quick Bill',
      icon: ReceiptText,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop Top Secondary Tab Bar */}
      <div className="hidden md:block bg-white border-b border-slate-200 shadow-xs sticky top-[57px] sm:top-[65px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center space-x-1 sm:space-x-2 py-1.5 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`desktop-nav-${tab.id}`}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white ${
                        tab.badgeColor || 'bg-blue-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-1 py-1">
        <div className="grid grid-cols-5 items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`mobile-nav-${tab.id}`}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'text-blue-950 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 text-blue-900' : 'text-slate-500'
                    }`}
                  />
                  {tab.badge && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[9px] font-bold px-1 py-0.2 min-w-[14px] text-center rounded-full text-white ${
                        tab.badgeColor || 'bg-blue-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] truncate max-w-full mt-0.5 tracking-tight">
                  {tab.id === 'dashboard'
                    ? (lang === 'hi' ? 'होम' : 'Home')
                    : tab.id === 'ledger'
                    ? (lang === 'hi' ? 'खाता' : 'Ledger')
                    : tab.id === 'cash'
                    ? (lang === 'hi' ? 'रोकड़' : 'Cash')
                    : tab.id === 'services'
                    ? (lang === 'hi' ? 'सेवाएं' : 'Services')
                    : (lang === 'hi' ? 'रसीद' : 'Bill')}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-900 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
