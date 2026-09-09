import React from 'react';
import {
  CSCProfile,
  Customer,
  CashEntry,
  ServiceOrder,
  LedgerTransaction,
  Language,
} from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  BookOpen,
  PlusCircle,
  FileCheck2,
  ReceiptText,
  Clock,
  Sparkles,
  QrCode,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Send,
} from 'lucide-react';
import { NavTab } from './BottomNav';

interface DashboardViewProps {
  profile: CSCProfile;
  customers: Customer[];
  cashEntries: CashEntry[];
  serviceOrders: ServiceOrder[];
  ledgerTxns: LedgerTransaction[];
  lang: Language;
  onNavigateTab: (tab: NavTab) => void;
  onOpenAddLedgerModal: () => void;
  onOpenAddCashModal: () => void;
  onOpenAddServiceModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  customers,
  cashEntries,
  serviceOrders,
  ledgerTxns,
  lang,
  onNavigateTab,
  onOpenAddLedgerModal,
  onOpenAddCashModal,
  onOpenAddServiceModal,
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Today's cash entries
  const todayCashEntries = cashEntries.filter((e) => e.date === today);

  const todayCashIn = todayCashEntries
    .filter((e) => e.type === 'cash_in' && e.paymentMode === 'cash')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const todayCashOut = todayCashEntries
    .filter((e) => e.type === 'cash_out' && e.paymentMode === 'cash')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const todayUPI = todayCashEntries
    .filter((e) => e.paymentMode === 'upi' && e.type === 'cash_in')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Cash in hand = Net cash of today
  const netCashInHand = todayCashIn - todayCashOut;

  // Total Market Due (Customers with positive balance)
  const totalDueAmount = customers
    .filter((c) => c.balance > 0)
    .reduce((acc, curr) => acc + curr.balance, 0);

  const customersOwingCount = customers.filter((c) => c.balance > 0).length;

  // Active pending orders
  const readyOrders = serviceOrders.filter((o) => o.status === 'ready');
  const inProgressOrders = serviceOrders.filter((o) => o.status === 'in_progress');
  const receivedOrders = serviceOrders.filter((o) => o.status === 'received');

  // AEPS Cash given out today
  const aepsCashOut = todayCashEntries
    .filter((e) => e.type === 'cash_out' && e.category === 'aeps_withdrawal')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner / Today Date & Welcome */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'डिजिटल सेवा केंद्र - दैनिक व्यापार संक्षेप'
                : 'CSC Digital Seva - Daily Business Overview'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight">
            {lang === 'hi' ? `शुभ दिन, ${profile.vleName}` : `Good Day, ${profile.vleName}`}
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
            {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Quick UPI QR scan hint */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs border border-white/15 px-3 py-2 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-blue-950 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="text-blue-200 text-[11px]">{lang === 'hi' ? 'दुकान का UPI ID' : 'Shop UPI ID'}</p>
            <p className="font-mono font-bold text-amber-300 text-xs sm:text-sm">{profile.upiId}</p>
          </div>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Cash in Drawer */}
        <div
          id="stat-cash-drawer"
          onClick={() => onNavigateTab('cash')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'गल्ले में नकद (आज)' : 'Drawer Cash (Today)'}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(netCashInHand)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500 gap-1.5 flex-wrap">
            <span className="text-emerald-600 font-semibold flex items-center">
              <ArrowDownLeft className="w-3 h-3 inline" /> +{formatCurrency(todayCashIn)}
            </span>
            <span className="text-rose-500 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3 inline" /> -{formatCurrency(todayCashOut)}
            </span>
          </div>
        </div>

        {/* Metric 2: Today UPI Collection */}
        <div
          id="stat-upi-collection"
          onClick={() => onNavigateTab('cash')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'ऑनलाइन / UPI आया' : 'UPI Received'}
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-indigo-900 tracking-tight">
            {formatCurrency(todayUPI)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {lang === 'hi' ? 'सीधे बैंक खाते में प्राप्त' : 'Received directly in bank'}
          </div>
        </div>

        {/* Metric 3: Market Udhar / Due */}
        <div
          id="stat-market-due"
          onClick={() => onNavigateTab('ledger')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'मार्केट उधार (लेना है)' : 'Market Due (Collect)'}
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-rose-600 tracking-tight">
            {formatCurrency(totalDueAmount)}
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-medium truncate">
            {lang === 'hi'
              ? `${customersOwingCount} ग्राहकों से पैसे लेने हैं`
              : `Pending from ${customersOwingCount} customers`}
          </div>
        </div>

        {/* Metric 4: Active Services */}
        <div
          id="stat-pending-services"
          onClick={() => onNavigateTab('services')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'लंबित आवेदन' : 'Active Orders'}
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-amber-700 tracking-tight">
            {inProgressOrders.length + readyOrders.length + receivedOrders.length}
          </div>
          <div className="mt-1 text-[11px] text-amber-800 font-medium truncate">
            {readyOrders.length > 0 ? (
              <span className="text-emerald-600 font-semibold">
                ● {readyOrders.length} {lang === 'hi' ? 'वितरण हेतु तैयार!' : 'Ready for delivery!'}
              </span>
            ) : (
              <span>{lang === 'hi' ? 'काम चल रहा है' : 'Under processing'}</span>
            )}
          </div>
        </div>
      </div>

      {/* 4 Large Quick Action Buttons (Mobile-first) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          {lang === 'hi' ? 'त्वरित कार्य (Quick Actions)' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* Quick 1: Add Ledger entry */}
          <button
            id="btn-quick-ledger"
            type="button"
            onClick={onOpenAddLedgerModal}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 transition-all cursor-pointer text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {lang === 'hi' ? 'खाता एंट्री' : 'Add Udhar/Jama'}
              </p>
              <p className="text-[10px] text-amber-800/80 truncate">
                {lang === 'hi' ? 'उधार या जमा लिखें' : 'Credit / Debit'}
              </p>
            </div>
          </button>

          {/* Quick 2: Add Cash in/out */}
          <button
            id="btn-quick-cash"
            type="button"
            onClick={onOpenAddCashModal}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 transition-all cursor-pointer text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {lang === 'hi' ? 'रोकड़ एंट्री' : 'Cash In / Out'}
              </p>
              <p className="text-[10px] text-emerald-800/80 truncate">
                {lang === 'hi' ? 'गल्ला नकद हिसाब' : 'Daily Cashbook'}
              </p>
            </div>
          </button>

          {/* Quick 3: New Service order */}
          <button
            id="btn-quick-service"
            type="button"
            onClick={onOpenAddServiceModal}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-900 transition-all cursor-pointer text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {lang === 'hi' ? 'नया आवेदन' : 'New Service'}
              </p>
              <p className="text-[10px] text-blue-800/80 truncate">
                {lang === 'hi' ? 'पैन, जाति, आय, आदि' : 'PAN, Cert, Schemes'}
              </p>
            </div>
          </button>

          {/* Quick 4: Quick Bill */}
          <button
            id="btn-quick-bill"
            type="button"
            onClick={() => onNavigateTab('receipt')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-purple-900 transition-all cursor-pointer text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {lang === 'hi' ? 'तुरंत रसीद' : 'Quick Bill'}
              </p>
              <p className="text-[10px] text-purple-800/80 truncate">
                {lang === 'hi' ? 'प्रिंट व WhatsApp' : 'Print & WhatsApp'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* AEPS & Cash Drawer Status Banner (Crucial for CSC VLEs!) */}
      {aepsCashOut > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-amber-950 flex-1">
            <p className="font-bold">
              {lang === 'hi'
                ? `आज AEPS से ₹${aepsCashOut} नकद ग्राहकों को दिया गया`
                : `Today ₹${aepsCashOut} cash disbursed to AEPS customers`}
            </p>
            <p className="text-amber-800 text-[11px] sm:text-xs mt-0.5">
              {lang === 'hi'
                ? 'यह राशि आपके CSC डिजिपे / बैंक वॉलेट में जमा हो चुकी है। शाम को बैंक खाते से काउंटर के लिए नकद निकालते समय इसका मिलान करें।'
                : 'This amount was credited to your CSC DigiPay/Bank Wallet. Reconcile this when withdrawing replenishment cash for the counter.'}
            </p>
          </div>
        </div>
      )}

      {/* Two Columns: Ready Orders Attention + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Ready Orders to Deliver */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {lang === 'hi'
                    ? 'तैयार प्रमाण पत्र / कार्ड (वितरण करें)'
                    : 'Ready for Delivery / Collection'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('services')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                {lang === 'hi' ? 'सभी देखें →' : 'View All →'}
              </button>
            </div>

            {readyOrders.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                {lang === 'hi'
                  ? 'वर्तमान में कोई सेवा वितरण हेतु लंबित नहीं है।'
                  : 'No orders pending delivery right now.'}
              </div>
            ) : (
              <div className="space-y-2">
                {readyOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {order.tokenNo}
                        </span>
                        <p className="text-xs font-bold text-slate-800">{order.customerName}</p>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{order.serviceName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Ack: {order.ackNumber}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {order.totalFee - order.paidAmount > 0 ? (
                        <span className="text-[11px] font-bold text-rose-600 block">
                          ₹{order.totalFee - order.paidAmount} {lang === 'hi' ? 'लेना है' : 'Due'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-600 block">
                          {lang === 'hi' ? 'पूर्ण भुगतान' : 'Paid'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigateTab('services')}
                        className="mt-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                      >
                        {lang === 'hi' ? 'डिलीवर करें' : 'Deliver'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{lang === 'hi' ? 'कुल इन-प्रोसेस आवेदन:' : 'In-process orders:'}</span>
            <span className="font-bold text-slate-700">{inProgressOrders.length}</span>
          </div>
        </div>

        {/* Right Column: Recent Ledger & Cash Activity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              <span>{lang === 'hi' ? 'ताज़ा गतिविधियां' : 'Recent Transactions'}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('cash')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              {lang === 'hi' ? 'रोकड़ बही →' : 'Cashbook →'}
            </button>
          </div>

          <div className="space-y-2">
            {cashEntries.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {entry.categoryLabel || entry.category}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {entry.partyName ? `${entry.partyName} • ` : ''}
                    {entry.time} • Mode: {entry.paymentMode.toUpperCase()}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-bold ${
                      entry.type === 'cash_in' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {entry.type === 'cash_in' ? '+' : '-'}₹{entry.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
