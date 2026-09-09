import React, { useState } from 'react';
import { CashEntry, CashDenomination, CashCategory, Language } from '../types';
import {
  formatCurrency,
  formatDate,
  exportCashEntriesCSV,
} from '../utils/formatters';
import {
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  PlusCircle,
  FileSpreadsheet,
  Calendar,
  X,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface CashManageViewProps {
  cashEntries: CashEntry[];
  denominations: CashDenomination;
  lang: Language;
  onAddCashEntry: (entry: CashEntry) => void;
  onUpdateDenominations: (denoms: CashDenomination) => void;
  onDeleteCashEntry?: (id: string) => void;
  isAdminLoggedIn?: boolean;
  onOpenAdminLogin?: () => void;
}

export const CashManageView: React.FC<CashManageViewProps> = ({
  cashEntries,
  denominations,
  lang,
  onAddCashEntry,
  onUpdateDenominations,
  onDeleteCashEntry,
  isAdminLoggedIn,
  onOpenAdminLogin,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filterMode, setFilterMode] = useState<'all' | 'cash_in' | 'cash_out' | 'upi'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDenomModal, setShowDenomModal] = useState(false);

  // New Cash Entry Form
  const [entryType, setEntryType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryCategory, setEntryCategory] = useState<CashCategory>('service_fee');
  const [entryParty, setEntryParty] = useState('');
  const [entryMode, setEntryMode] = useState<'cash' | 'upi'>('cash');
  const [entryNotes, setEntryNotes] = useState('');
  const [entryDate, setEntryDate] = useState(today);

  // Filter entries for selected date
  const dateEntries = cashEntries.filter((e) => e.date === selectedDate);

  // Totals for selected date
  const totalCashIn = dateEntries
    .filter((e) => e.type === 'cash_in' && e.paymentMode === 'cash')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalCashOut = dateEntries
    .filter((e) => e.type === 'cash_out' && e.paymentMode === 'cash')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalUPIIn = dateEntries
    .filter((e) => e.type === 'cash_in' && e.paymentMode === 'upi')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netDrawerCash = totalCashIn - totalCashOut;

  // Physical Denominations Total
  const denomTotal =
    denominations.c500 * 500 +
    denominations.c200 * 200 +
    denominations.c100 * 100 +
    denominations.c50 * 50 +
    denominations.c20 * 20 +
    denominations.c10 * 10 +
    denominations.coins * 1;

  // Cash discrepancy (only if denominations were entered)
  const isDenomEntered = denomTotal > 0;
  const cashDifference = denomTotal - netDrawerCash;

  // Filtered entries by mode / type
  const displayedEntries = dateEntries.filter((e) => {
    if (filterMode === 'cash_in') return e.type === 'cash_in';
    if (filterMode === 'cash_out') return e.type === 'cash_out';
    if (filterMode === 'upi') return e.paymentMode === 'upi';
    return true;
  });

  const getCategoryLabel = (cat: CashCategory, type: 'cash_in' | 'cash_out'): string => {
    switch (cat) {
      case 'service_fee':
        return lang === 'hi' ? 'सीएससी सर्विस फीस (Service Fee)' : 'Service Fee';
      case 'aeps_withdrawal':
        return lang === 'hi' ? 'AEPS नकद दिया (Aadhaar ATM)' : 'AEPS Cash Given';
      case 'money_transfer':
        return lang === 'hi' ? 'मनी ट्रांसफर (DMT)' : 'Money Transfer (DMT)';
      case 'bill_payment':
        return lang === 'hi' ? 'बिजली/बिल भुगतान' : 'Bill Payment';
      case 'ledger_payment':
        return lang === 'hi' ? 'खाता बकाया जमा' : 'Customer Khata Payment';
      case 'paper_ink_supplies':
        return lang === 'hi' ? 'दुकान खर्च (कागज/स्याही)' : 'Paper / Ink Supplies';
      case 'shop_rent_electricity':
        return lang === 'hi' ? 'दुकान किराया / बिजली' : 'Rent / Electricity';
      case 'bank_deposit':
        return type === 'cash_in'
          ? (lang === 'hi' ? 'बैंक से काउंटर नकद निकाला' : 'Cash from Bank')
          : (lang === 'hi' ? 'बैंक खाते में जमा कराया' : 'Cash to Bank');
      case 'personal_withdrawal':
        return lang === 'hi' ? 'निजी घरेलू खर्च' : 'Personal / Owner Withdrawal';
      default:
        return lang === 'hi' ? 'अन्य लेन-देन' : 'Other Entry';
    }
  };

  const handleCreateCashEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(entryAmount);
    if (!amountNum || amountNum <= 0) return;

    const newEntry: CashEntry = {
      id: `cash-${Date.now()}`,
      date: entryDate,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      type: entryType,
      category: entryCategory,
      categoryLabel: getCategoryLabel(entryCategory, entryType),
      amount: amountNum,
      paymentMode: entryMode,
      partyName: entryParty.trim(),
      notes: entryNotes.trim(),
    };

    onAddCashEntry(newEntry);
    setEntryAmount('');
    setEntryParty('');
    setEntryNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <span>
                {lang === 'hi'
                  ? 'रोकड़ बही एवं गल्ला प्रबंधन (Daily Cashbook)'
                  : 'Daily Cashbook & Drawer Register'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'दुकान का नकद आया-गया, AEPS विथड्रॉल, UPI और नोट गिनने का कैलकुलेटर'
                : 'Track daily cash inflow, outflow, AEPS disbursement, and denomination counter'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Denomination Counter Trigger */}
            <button
              id="btn-open-denominations"
              type="button"
              onClick={() => setShowDenomModal(true)}
              className="px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'hi' ? 'गल्ला नोट कैलकुलेटर' : 'Count Notes'}</span>
              {isDenomEntered && (
                <span className="text-[10px] font-bold bg-amber-200 px-1 rounded">
                  ₹{denomTotal}
                </span>
              )}
            </button>

            {/* Export CSV */}
            <button
              id="btn-export-cash-csv"
              type="button"
              onClick={() => exportCashEntriesCSV(cashEntries)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'hi' ? 'CSV' : 'Export'}</span>
            </button>

            {/* Add Cash Entry Button */}
            <button
              id="btn-add-cash-entry"
              type="button"
              onClick={() => {
                setEntryType('cash_in');
                setEntryCategory('service_fee');
                setEntryAmount('');
                setEntryDate(selectedDate);
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'hi' ? '+ रोकड़ एंट्री' : '+ Cash Entry'}</span>
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedDate === today
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lang === 'hi' ? 'आज (Today)' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterday)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedDate === yesterday
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lang === 'hi' ? 'कल (Yesterday)' : 'Yesterday'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              {lang === 'hi' ? 'तारीख:' : 'Date:'}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-medium text-slate-800"
            />
          </div>
        </div>

        {/* 4 Financial Figures Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-3">
          {/* Total Cash In */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-800 uppercase">
                {lang === 'hi' ? 'कुल नकद आया (Cash In)' : 'Total Cash In'}
              </span>
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-base sm:text-2xl font-extrabold text-emerald-700 mt-1">
              +{formatCurrency(totalCashIn)}
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5">
              {lang === 'hi' ? 'काउन्टर पर आया नकद' : 'Physical cash received'}
            </p>
          </div>

          {/* Total Cash Out */}
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-rose-800 uppercase">
                {lang === 'hi' ? 'कुल नकद दिया (Cash Out)' : 'Total Cash Out'}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="text-base sm:text-2xl font-extrabold text-rose-700 mt-1">
              -{formatCurrency(totalCashOut)}
            </p>
            <p className="text-[10px] text-rose-700 mt-0.5">
              {lang === 'hi' ? 'AEPS, खर्च, नकद दिया' : 'AEPS & expenses'}
            </p>
          </div>

          {/* Current Drawer Cash */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-blue-800 uppercase">
                {lang === 'hi' ? 'वर्तमान गल्ला नकद' : 'Drawer Cash Balance'}
              </span>
              <Wallet className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <p
              className={`text-base sm:text-2xl font-extrabold mt-1 ${
                netDrawerCash >= 0 ? 'text-blue-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(netDrawerCash)}
            </p>
            <p className="text-[10px] text-blue-700 mt-0.5">
              {lang === 'hi' ? 'काउंटर गल्ले में होना चाहिए' : 'Expected in counter'}
            </p>
          </div>

          {/* Online / UPI Collection */}
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-indigo-800 uppercase">
                {lang === 'hi' ? 'ऑनलाइन / UPI आया' : 'UPI Inflow'}
              </span>
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-base sm:text-2xl font-extrabold text-indigo-900 mt-1">
              {formatCurrency(totalUPIIn)}
            </p>
            <p className="text-[10px] text-indigo-700 mt-0.5">
              {lang === 'hi' ? 'सीधे बैंक में जमा' : 'Direct bank credit'}
            </p>
          </div>
        </div>

        {/* Denomination Reconcile Banner (if entered) */}
        {isDenomEntered && (
          <div
            className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              cashDifference === 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {cashDifference === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <p className="font-bold">
                  {cashDifference === 0
                    ? (lang === 'hi' ? 'गल्ला एकदम सटीक मिला!' : 'Drawer Cash Matches Perfectly!')
                    : (lang === 'hi' ? `गल्ले में ₹${Math.abs(cashDifference)} का अंतर है` : `Discrepancy of ₹${Math.abs(cashDifference)}`)}
                </p>
                <p className="text-[11px] text-slate-600">
                  {lang === 'hi'
                    ? `नोट गिनने पर कुल: ₹${denomTotal} | रोकड़ बही अनुसार: ₹${netDrawerCash}`
                    : `Physical Count: ₹${denomTotal} | Book Balance: ₹${netDrawerCash}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDenomModal(true)}
              className="text-xs font-semibold underline shrink-0 cursor-pointer"
            >
              {lang === 'hi' ? 'संशोधन करें' : 'Edit'}
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs for Entries */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {lang === 'hi' ? `सभी एंट्री (${dateEntries.length})` : `All (${dateEntries.length})`}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('cash_in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              filterMode === 'cash_in'
                ? 'bg-emerald-700 text-white font-bold'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            {lang === 'hi' ? '🟢 नकद आया (In)' : '🟢 Cash In'}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('cash_out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              filterMode === 'cash_out'
                ? 'bg-rose-700 text-white font-bold'
                : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            {lang === 'hi' ? '🔴 नकद दिया (Out)' : '🔴 Cash Out'}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('upi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              filterMode === 'upi'
                ? 'bg-indigo-700 text-white font-bold'
                : 'bg-white text-indigo-800 hover:bg-indigo-50 border border-indigo-200'
            }`}
          >
            {lang === 'hi' ? '📱 UPI / ऑनलाइन' : '📱 UPI'}
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {formatDate(selectedDate)}
        </span>
      </div>

      {/* Cash Entries Table / List */}
      {displayedEntries.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
          <p className="text-slate-400 text-sm">
            {lang === 'hi'
              ? 'इस तारीख के लिए कोई रोकड़ एंट्री नहीं है। "+ रोकड़ एंट्री" से नई प्रविष्टि करें।'
              : 'No cash entries for this date. Click "+ Cash Entry" to record one.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {displayedEntries.map((entry) => {
              const isIn = entry.type === 'cash_in';
              return (
                <div
                  key={entry.id}
                  className="p-3 sm:p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isIn
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isIn ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">
                          {entry.categoryLabel || entry.category}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                          {entry.paymentMode}
                        </span>
                      </div>

                      {entry.partyName && (
                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                          {lang === 'hi' ? 'ग्राहक / पार्टी:' : 'Party:'} {entry.partyName}
                        </p>
                      )}

                      {entry.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                          "{entry.notes}"
                        </p>
                      )}

                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        {entry.time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-sm sm:text-base font-extrabold block ${
                          isIn ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isIn ? '+' : '-'}₹{entry.amount}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isIn
                          ? (entry.paymentMode === 'upi' ? (lang === 'hi' ? 'बैंक जमा' : 'Bank UPI') : (lang === 'hi' ? 'गल्ले में' : 'Drawer Cash'))
                          : (lang === 'hi' ? 'गल्ले से दिया' : 'Drawer Out')}
                      </span>
                    </div>

                    {onDeleteCashEntry && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAdminLoggedIn) {
                            if (onOpenAdminLogin) onOpenAdminLogin();
                            return;
                          }
                          if (confirm('Admin: Delete this cash entry permanently?')) {
                            onDeleteCashEntry(entry.id);
                          }
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title={isAdminLoggedIn ? 'Admin: Delete Cash Entry' : 'Admin Login Required to Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal 1: Add Cash Entry */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'hi' ? 'नई रोकड़ प्रविष्टि' : 'New Cash Entry'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCashEntry} className="space-y-3 mt-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('cash_in');
                    setEntryCategory('service_fee');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    entryType === 'cash_in'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  {lang === 'hi' ? '🟢 नकद आया (Cash In)' : '🟢 Cash In'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('cash_out');
                    setEntryCategory('aeps_withdrawal');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    entryType === 'cash_out'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  {lang === 'hi' ? '🔴 नकद गया (Cash Out)' : '🔴 Cash Out'}
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'राशि (Amount) *' : 'Amount (₹) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 font-extrabold text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2.5 text-base font-bold text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'श्रेणी (Category) *' : 'Category *'}
                </label>
                <select
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value as CashCategory)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                >
                  {entryType === 'cash_in' ? (
                    <>
                      <option value="service_fee">सीएससी सेवा शुल्क / ग्राहक फीस</option>
                      <option value="ledger_payment">ग्राहक पुराना खाता जमा</option>
                      <option value="bank_deposit">बैंक से गल्ले हेतु नकद निकाला</option>
                      <option value="bill_payment">बिजली बिल आदि भुगतान प्राप्त</option>
                      <option value="other">अन्य आमदनी</option>
                    </>
                  ) : (
                    <>
                      <option value="aeps_withdrawal">AEPS ग्राहक को नकद दिया (Aadhaar ATM)</option>
                      <option value="money_transfer">मनी ट्रांसफर (DMT) नकद दिया</option>
                      <option value="paper_ink_supplies">कागज, लेमिनेशन, स्टेशनरी व स्याही</option>
                      <option value="shop_rent_electricity">दुकान किराया / बिजली बिल खर्च</option>
                      <option value="personal_withdrawal">निजी घरेलू खर्च निकाला</option>
                      <option value="bank_deposit">बैंक खाते में जमा कराया</option>
                      <option value="other">अन्य दुकान खर्च</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'माध्यम' : 'Payment Mode'}
                  </label>
                  <select
                    value={entryMode}
                    onChange={(e) => setEntryMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  >
                    <option value="cash">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</option>
                    <option value="upi">{lang === 'hi' ? 'ऑनलाइन (UPI/QR)' : 'UPI / Online'}</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'तारीख' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Party / Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'ग्राहक / पार्टी का नाम' : 'Party / Customer Name'}
                </label>
                <input
                  type="text"
                  value={entryParty}
                  onChange={(e) => setEntryParty(e.target.value)}
                  placeholder="उदा. अमित कुमार"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'विवरण / टिप्पणी' : 'Remarks / Notes'}
                </label>
                <input
                  type="text"
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="उदा. 500 फोटोकॉपी पेपर रिम खरीदा"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg cursor-pointer ${
                    entryType === 'cash_in'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {entryType === 'cash_in'
                    ? (lang === 'hi' ? 'नकद आवक दर्ज करें' : 'Save Cash In')
                    : (lang === 'hi' ? 'नकद जावक दर्ज करें' : 'Save Cash Out')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Cash Denominations Calculator (गल्ला नोट कैलकुलेटर) */}
      {showDenomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                <span>
                  {lang === 'hi'
                    ? 'दुकान गल्ला नोट कैलकुलेटर (Cash Tally)'
                    : 'Physical Cash Denomination Counter'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDenomModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              {lang === 'hi'
                ? 'शाम को काउंटर बंद करते समय गल्ले के नोटों की संख्या भरें और रोकड़ बही से मिलान करें:'
                : 'Enter physical note count in the drawer to reconcile with book balance:'}
            </p>

            <div className="space-y-2 mt-3 text-xs">
              {[
                { label: '₹500 का नोट', key: 'c500', value: 500, count: denominations.c500 },
                { label: '₹200 का नोट', key: 'c200', value: 200, count: denominations.c200 },
                { label: '₹100 का नोट', key: 'c100', value: 100, count: denominations.c100 },
                { label: '₹50 का नोट', key: 'c50', value: 50, count: denominations.c50 },
                { label: '₹20 का नोट', key: 'c20', value: 20, count: denominations.c20 },
                { label: '₹10 का नोट', key: 'c10', value: 10, count: denominations.c10 },
                { label: 'सिक्के / चिल्लर', key: 'coins', value: 1, count: denominations.coins },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 p-1.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <span className="font-bold text-slate-800 w-28">{item.label}</span>
                  <span className="text-slate-400 font-mono">×</span>
                  <input
                    type="number"
                    min="0"
                    value={item.count || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      onUpdateDenominations({
                        ...denominations,
                        [item.key]: val,
                      });
                    }}
                    placeholder="0"
                    className="w-20 px-2 py-1 text-center font-bold bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-800"
                  />
                  <span className="text-right font-extrabold text-slate-700 w-24">
                    = ₹{(item.count || 0) * item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Comparison Box */}
            <div className="mt-4 p-3 rounded-xl bg-slate-100 border border-slate-300 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">
                  {lang === 'hi' ? 'गिनती अनुसार कुल नकद (Physical):' : 'Physical Cash Counted:'}
                </span>
                <span className="font-extrabold text-base text-slate-900">
                  ₹{denomTotal}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">
                  {lang === 'hi' ? 'रोकड़ बही अनुसार नकद (Book):' : 'Cash Book Ledger Balance:'}
                </span>
                <span className="font-bold text-slate-800">
                  ₹{netDrawerCash}
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-bold">
                <span>{lang === 'hi' ? 'अंतर (Difference):' : 'Difference:'}</span>
                <span
                  className={
                    cashDifference === 0
                      ? 'text-emerald-700'
                      : cashDifference > 0
                      ? 'text-blue-700'
                      : 'text-rose-700'
                  }
                >
                  {cashDifference === 0
                    ? (lang === 'hi' ? '0 (सटीक मिला ✅)' : '₹0 (Exact Match ✅)')
                    : cashDifference > 0
                    ? `+₹${cashDifference} ${lang === 'hi' ? 'ज्यादा है' : 'Excess'}`
                    : `-₹${Math.abs(cashDifference)} ${lang === 'hi' ? 'कम है' : 'Short'}`}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
              <button
                type="button"
                onClick={() =>
                  onUpdateDenominations({
                    c500: 0,
                    c200: 0,
                    c100: 0,
                    c50: 0,
                    c20: 0,
                    c10: 0,
                    coins: 0,
                  })
                }
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'hi' ? 'रीसेट करें' : 'Reset'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDenomModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                {lang === 'hi' ? 'सुरक्षित करें व बंद करें' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
