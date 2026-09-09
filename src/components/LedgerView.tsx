import React, { useState } from 'react';
import { Customer, LedgerTransaction, CSCProfile, Language } from '../types';
import {
  formatCurrency,
  formatDate,
  getWhatsAppReminderUrl,
  exportCustomersCSV,
} from '../utils/formatters';
import {
  Search,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  MapPin,
  FileSpreadsheet,
  History as HistoryIcon,
  Send,
  X,
  CheckCircle2,
  Calendar,
  CreditCard,
  Trash2,
  Plus,
  BookOpen,
} from 'lucide-react';

interface LedgerViewProps {
  customers: Customer[];
  ledgerTxns: LedgerTransaction[];
  profile: CSCProfile;
  lang: Language;
  onAddCustomer: (customer: Customer) => void;
  onAddTransaction: (txn: LedgerTransaction) => void;
  onDeleteTransaction?: (txnId: string) => void;
  onDeleteCustomer?: (customerId: string) => void;
  isAdminLoggedIn?: boolean;
  onOpenAdminLogin?: () => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  customers,
  ledgerTxns,
  profile,
  lang,
  onAddCustomer,
  onAddTransaction,
  onDeleteTransaction,
  onDeleteCustomer,
  isAdminLoggedIn,
  onOpenAdminLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'settled' | 'advance'>('all');

  // Modal states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [selectedCustomerIdForTxn, setSelectedCustomerIdForTxn] = useState<string>('');
  const [selectedTxnType, setSelectedTxnType] = useState<'credit' | 'payment'>('credit');
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // New Customer Form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustVillage, setNewCustVillage] = useState('');
  const [newCustAadhaar, setNewCustAadhaar] = useState('');
  const [newCustOpeningBal, setNewCustOpeningBal] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  // New Transaction Form state
  const [txnAmount, setTxnAmount] = useState('');
  const [txnMode, setTxnMode] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');
  const [txnServiceName, setTxnServiceName] = useState('');
  const [txnNotes, setTxnNotes] = useState('');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculations
  const totalMarketDue = customers
    .filter((c) => c.balance > 0)
    .reduce((acc, curr) => acc + curr.balance, 0);

  const dueCount = customers.filter((c) => c.balance > 0).length;
  const settledCount = customers.filter((c) => c.balance === 0).length;
  const advanceCount = customers.filter((c) => c.balance < 0).length;

  // Filtered customers
  const filteredCustomers = customers.filter((cust) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      cust.name.toLowerCase().includes(q) ||
      cust.phone.includes(q) ||
      (cust.villageOrWard && cust.villageOrWard.toLowerCase().includes(q)) ||
      (cust.aadhaarLast4 && cust.aadhaarLast4.includes(q));

    if (!matchSearch) return false;

    if (filterType === 'due') return cust.balance > 0;
    if (filterType === 'settled') return cust.balance === 0;
    if (filterType === 'advance') return cust.balance < 0;
    return true;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const opening = parseFloat(newCustOpeningBal) || 0;
    const today = new Date().toISOString().split('T')[0];

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      villageOrWard: newCustVillage.trim(),
      aadhaarLast4: newCustAadhaar.trim(),
      notes: newCustNotes.trim(),
      balance: opening,
      createdAt: today,
      updatedAt: today,
    };

    onAddCustomer(newCust);

    // If opening balance > 0, create an initial transaction entry
    if (opening !== 0) {
      const initialTxn: LedgerTransaction = {
        id: `txn-${Date.now()}`,
        customerId: newCust.id,
        customerName: newCust.name,
        type: opening > 0 ? 'credit' : 'payment',
        amount: Math.abs(opening),
        date: today,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        paymentMode: 'cash',
        serviceName: 'आरंभिक पुराना हिसाब (Opening Balance)',
        notes: newCustNotes.trim() || 'Old balance brought forward',
      };
      onAddTransaction(initialTxn);
    }

    // Reset form
    setNewCustName('');
    setNewCustPhone('');
    setNewCustVillage('');
    setNewCustAadhaar('');
    setNewCustOpeningBal('');
    setNewCustNotes('');
    setShowAddCustomerModal(false);
  };

  const handleOpenAddTxn = (customerId: string, type: 'credit' | 'payment') => {
    setSelectedCustomerIdForTxn(customerId);
    setSelectedTxnType(type);
    setTxnAmount('');
    setTxnServiceName(type === 'payment' ? 'नकद / UPI भुगतान प्राप्त' : '');
    setTxnNotes('');
    setTxnDate(new Date().toISOString().split('T')[0]);
    setShowAddTxnModal(true);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txnAmount);
    if (!amountNum || amountNum <= 0 || !selectedCustomerIdForTxn) return;

    const customer = customers.find((c) => c.id === selectedCustomerIdForTxn);
    if (!customer) return;

    const newTxn: LedgerTransaction = {
      id: `txn-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      type: selectedTxnType,
      amount: amountNum,
      date: txnDate,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      paymentMode: txnMode,
      serviceName: txnServiceName.trim() || (selectedTxnType === 'credit' ? 'CSC सेवा उधार' : 'जमा भुगतान'),
      notes: txnNotes.trim(),
    };

    onAddTransaction(newTxn);
    setShowAddTxnModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Summary */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-900" />
              <span>{lang === 'hi' ? 'ग्राहक खाता बही (Customer Khata)' : 'Customer Ledger Khata'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'उधार दिया, जमा लिया और 1-क्लिक में WhatsApp तगादा भेजें'
                : 'Track customer credit, payments, and 1-click WhatsApp payment reminders'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-export-customers-csv"
              type="button"
              onClick={() => exportCustomersCSV(customers)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'hi' ? 'CSV एक्सपोर्ट' : 'Export CSV'}</span>
            </button>

            <button
              id="btn-add-customer"
              type="button"
              onClick={() => setShowAddCustomerModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'hi' ? '+ नया ग्राहक' : '+ New Customer'}</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Pills */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3">
          <div className="p-2.5 sm:p-3 rounded-lg bg-rose-50 border border-rose-200">
            <p className="text-[10px] sm:text-xs font-semibold text-rose-700 uppercase">
              {lang === 'hi' ? 'कुल बकाया (मार्केट से लेना)' : 'Total Due to Collect'}
            </p>
            <p className="text-sm sm:text-xl font-extrabold text-rose-800 mt-0.5">
              {formatCurrency(totalMarketDue)}
            </p>
            <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
              {dueCount} {lang === 'hi' ? 'ग्राहकों पर बाकी' : 'debtor customers'}
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-700 uppercase">
              {lang === 'hi' ? 'हिसाब चुकता ग्राहक' : 'Settled Customers'}
            </p>
            <p className="text-sm sm:text-xl font-extrabold text-emerald-800 mt-0.5">
              {settledCount}
            </p>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">
              {lang === 'hi' ? 'कोई बकाया नहीं' : 'Zero balance'}
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-[10px] sm:text-xs font-semibold text-blue-700 uppercase">
              {lang === 'hi' ? 'कुल दर्ज ग्राहक' : 'Total Customers'}
            </p>
            <p className="text-sm sm:text-xl font-extrabold text-blue-900 mt-0.5">
              {customers.length}
            </p>
            <p className="text-[10px] text-blue-600 mt-0.5 font-medium">
              {advanceCount > 0 ? `${advanceCount} जमा अग्रिम` : 'All customers recorded'}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-customers"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'hi'
                ? 'नाम, मोबाइल, गाँव या आधार के अंतिम 4 अंक से खोजें...'
                : 'Search by name, phone, village or Aadhaar last 4 digits...'
            }
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              filterType === 'all'
                ? 'bg-blue-900 text-white font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {lang === 'hi' ? `सभी (${customers.length})` : `All (${customers.length})`}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('due')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              filterType === 'due'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            {lang === 'hi' ? `🔴 पैसे लेने हैं (${dueCount})` : `🔴 Due (${dueCount})`}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('settled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              filterType === 'settled'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            {lang === 'hi' ? `🟢 चुकता (${settledCount})` : `🟢 Settled (${settledCount})`}
          </button>
        </div>
      </div>

      {/* Customers List Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
          <p className="text-slate-400 text-sm">
            {lang === 'hi'
              ? 'कोई ग्राहक नहीं मिला। नया ग्राहक जोड़ने के लिए "+ नया ग्राहक" पर क्लिक करें।'
              : 'No customers found. Click "+ New Customer" to add one.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCustomers.map((customer) => {
            const isDue = customer.balance > 0;
            const isSettled = customer.balance === 0;
            const isAdvance = customer.balance < 0;

            return (
              <div
                key={customer.id}
                className={`bg-white rounded-xl p-3.5 sm:p-4 border transition-all ${
                  isDue
                    ? 'border-rose-200 hover:border-rose-400 shadow-2xs'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate flex items-center gap-1.5">
                      <span>{customer.name}</span>
                      {customer.aadhaarLast4 && (
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          UID: {customer.aadhaarLast4}
                        </span>
                      )}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {customer.phone}
                      </span>
                      {customer.villageOrWard && (
                        <span className="flex items-center gap-1 truncate max-w-[160px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {customer.villageOrWard}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Balance Badge */}
                  <div className="text-right shrink-0">
                    {isDue && (
                      <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-right">
                        <span className="text-[10px] font-semibold text-rose-700 block">
                          {lang === 'hi' ? 'बाकी लेना है' : 'Due Amount'}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-rose-700">
                          ₹{customer.balance}
                        </span>
                      </div>
                    )}
                    {isSettled && (
                      <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-right">
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          {lang === 'hi' ? 'हिसाब चुकता' : 'Settled'}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-slate-700">₹0</span>
                      </div>
                    )}
                    {isAdvance && (
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-right">
                        <span className="text-[10px] font-semibold text-emerald-700 block">
                          {lang === 'hi' ? 'ग्राहक का जमा' : 'Advance'}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                          ₹{Math.abs(customer.balance)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {customer.notes && (
                  <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-1 bg-slate-50 px-2 py-0.5 rounded">
                    "{customer.notes}"
                  </p>
                )}

                {/* Action Buttons Row */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  {/* WhatsApp Reminder (Enabled if balance > 0) */}
                  {isDue ? (
                    <a
                      href={getWhatsAppReminderUrl(customer, profile, customer.balance)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1 transition-colors"
                      title="Send WhatsApp payment reminder"
                    >
                      <Send className="w-3 h-3 text-emerald-600" />
                      <span>{lang === 'hi' ? 'तगादा' : 'WhatsApp'}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setViewingCustomer(customer)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <HistoryIcon className="w-3 h-3 text-slate-500" />
                      <span>{lang === 'hi' ? 'पासबुक' : 'Passbook'}</span>
                    </button>
                  )}

                  {/* Passbook / History trigger */}
                  {isDue && (
                    <button
                      type="button"
                      onClick={() => setViewingCustomer(customer)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <HistoryIcon className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'इतिहास' : 'History'}</span>
                    </button>
                  )}

                  {/* 2 Quick Transaction buttons */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Add Udhar (Credit) */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddTxn(customer.id, 'credit')}
                      className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowUpRight className="w-3 h-3 text-rose-600" />
                      <span>{lang === 'hi' ? '+ उधार दिया' : '+ Give Credit'}</span>
                    </button>

                    {/* Add Payment (Jama) */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddTxn(customer.id, 'payment')}
                      className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                      <span>{lang === 'hi' ? '+ जमा लिया' : '+ Receive'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add New Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-900" />
                <span>{lang === 'hi' ? 'नया ग्राहक जोड़ें' : 'Add New Customer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'ग्राहक का नाम *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="उदा. राजेश कुमार"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'आधार के अंतिम 4 अंक' : 'Aadhaar Last 4'}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newCustAadhaar}
                    onChange={(e) => setNewCustAadhaar(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="उदा. 4821"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'गाँव / वार्ड / पता' : 'Village / Ward / Address'}
                </label>
                <input
                  type="text"
                  value={newCustVillage}
                  onChange={(e) => setNewCustVillage(e.target.value)}
                  placeholder="उदा. रामपुर, वार्ड 3"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'आरंभिक पुराना बकाया (यदि कोई हो)' : 'Opening Due Balance (if any)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    value={newCustOpeningBal}
                    onChange={(e) => setNewCustOpeningBal(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  {lang === 'hi'
                    ? 'यदि ग्राहक से पहले से पैसे लेने हैं तो राशि लिखें'
                    : 'Enter amount if customer owes previous pending money'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'नोट / विवरण' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder="उदा. किसान क्रेडिट कार्ड काम"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  {lang === 'hi' ? 'ग्राहक सुरक्षित करें' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Transaction (Credit / Payment) */}
      {showAddTxnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {selectedTxnType === 'credit' ? (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-rose-600" />
                    <span className="text-rose-700">
                      {lang === 'hi' ? 'उधार दिया (Customer Owes)' : 'Add Credit Entry'}
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-700">
                      {lang === 'hi' ? 'जमा भुगतान लिया (Payment Received)' : 'Record Payment Received'}
                    </span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTxnModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3 mt-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedTxnType('credit')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTxnType === 'credit'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  {lang === 'hi' ? '🔴 उधार दिया (Due)' : '🔴 Credit (Due)'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTxnType('payment')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTxnType === 'payment'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  {lang === 'hi' ? '🟢 जमा लिया (Paid)' : '🟢 Payment (Received)'}
                </button>
              </div>

              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'ग्राहक चुनें *' : 'Select Customer *'}
                </label>
                <select
                  required
                  value={selectedCustomerIdForTxn}
                  onChange={(e) => setSelectedCustomerIdForTxn(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                >
                  <option value="">-- ग्राहक चुनें --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.balance > 0 ? `बाकी: ₹${c.balance}` : `चुकता`}
                    </option>
                  ))}
                </select>
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
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2.5 text-base font-bold text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'तारीख' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'माध्यम (Mode)' : 'Payment Mode'}
                  </label>
                  <select
                    value={txnMode}
                    onChange={(e) => setTxnMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  >
                    <option value="cash">{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</option>
                    <option value="upi">{lang === 'hi' ? 'ऑनलाइन (UPI/GPay)' : 'UPI / PhonePe'}</option>
                    <option value="bank_transfer">{lang === 'hi' ? 'बैंक ट्रांसफर' : 'Bank Transfer'}</option>
                  </select>
                </div>
              </div>

              {/* Service or Item Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'सेवा / कारण' : 'Service / Purpose'}
                </label>
                <input
                  type="text"
                  value={txnServiceName}
                  onChange={(e) => setTxnServiceName(e.target.value)}
                  placeholder={
                    selectedTxnType === 'credit'
                      ? 'उदा. जाति प्रमाण पत्र आवेदन'
                      : 'उदा. पुराना बकाया चुकता'
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'अतिरिक्त टिप्पणी' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={txnNotes}
                  onChange={(e) => setTxnNotes(e.target.value)}
                  placeholder="उदा. कल बाकी ₹100 देंगे"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTxnModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg cursor-pointer ${
                    selectedTxnType === 'credit'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {selectedTxnType === 'credit'
                    ? (lang === 'hi' ? 'उधार दर्ज करें' : 'Record Credit')
                    : (lang === 'hi' ? 'जमा दर्ज करें' : 'Record Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Customer Passbook / Statement */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {viewingCustomer.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                    {viewingCustomer.phone}
                  </span>
                </div>
                {viewingCustomer.villageOrWard && (
                  <p className="text-xs text-slate-500 mt-0.5">{viewingCustomer.villageOrWard}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onDeleteCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAdminLoggedIn) {
                        if (onOpenAdminLogin) onOpenAdminLogin();
                        return;
                      }
                      if (
                        confirm(
                          `Admin: Are you sure you want to delete customer "${viewingCustomer.name}" and their passbook?`
                        )
                      ) {
                        onDeleteCustomer(viewingCustomer.id);
                        setViewingCustomer(null);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={isAdminLoggedIn ? 'Admin: Delete Customer' : 'Admin Login Required to Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingCustomer(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Current Balance Card */}
            <div className="p-3 my-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs text-slate-500">{lang === 'hi' ? 'वर्तमान खाता स्थिति' : 'Current Ledger Balance'}</p>
                <p
                  className={`text-lg font-extrabold ${
                    viewingCustomer.balance > 0
                      ? 'text-rose-600'
                      : viewingCustomer.balance === 0
                      ? 'text-slate-700'
                      : 'text-emerald-600'
                  }`}
                >
                  {viewingCustomer.balance > 0
                    ? `₹${viewingCustomer.balance} (${lang === 'hi' ? 'लेना है' : 'Due/Pending'})`
                    : viewingCustomer.balance === 0
                    ? (lang === 'hi' ? 'हिसाब चुकता (₹0)' : 'Account Settled (₹0)')
                    : `₹${Math.abs(viewingCustomer.balance)} (${lang === 'hi' ? 'जमा है' : 'Advance'})`}
                </p>
              </div>

              {viewingCustomer.balance > 0 && (
                <a
                  href={getWhatsAppReminderUrl(viewingCustomer, profile, viewingCustomer.balance)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'hi' ? 'WhatsApp तगादा' : 'WhatsApp Reminder'}</span>
                </a>
              )}
            </div>

            {/* Statement Entries List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[150px]">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                {lang === 'hi' ? 'लेन-देन विवरण (Passbook History)' : 'Transaction Statement'}
              </h4>

              {ledgerTxns.filter((t) => t.customerId === viewingCustomer.id).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  {lang === 'hi' ? 'कोई लेन-देन दर्ज नहीं है।' : 'No transactions recorded yet.'}
                </div>
              ) : (
                ledgerTxns
                  .filter((t) => t.customerId === viewingCustomer.id)
                  .map((txn) => {
                    const isCredit = txn.type === 'credit';
                    return (
                      <div
                        key={txn.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          isCredit ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/50 border-emerald-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="flex items-center gap-1.5 font-bold">
                            {isCredit ? (
                              <span className="text-rose-700 flex items-center gap-0.5">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                {lang === 'hi' ? 'उधार दिया' : 'Credit Given'}
                              </span>
                            ) : (
                              <span className="text-emerald-700 flex items-center gap-0.5">
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                {lang === 'hi' ? 'जमा प्राप्त' : 'Payment Received'}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-slate-600 font-medium">
                              {formatDate(txn.date)} {txn.time}
                            </span>
                          </div>

                          <p className="text-slate-800 font-medium mt-0.5 truncate">
                            {txn.serviceName || (isCredit ? 'Service Fee' : 'Payment')}
                          </p>

                          {txn.notes && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">"{txn.notes}"</p>
                          )}
                          <span className="text-[10px] uppercase font-mono text-slate-400">
                            Mode: {txn.paymentMode}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm font-extrabold ${
                              isCredit ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            {isCredit ? '+' : '-'}₹{txn.amount}
                          </span>

                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!isAdminLoggedIn) {
                                  if (onOpenAdminLogin) onOpenAdminLogin();
                                  return;
                                }
                                if (confirm('Admin: Delete this transaction record?')) {
                                  onDeleteTransaction(txn.id);
                                }
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title={isAdminLoggedIn ? 'Admin: Delete Transaction' : 'Admin Login Required to Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer Quick Actions */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const custId = viewingCustomer.id;
                  setViewingCustomer(null);
                  handleOpenAddTxn(custId, 'credit');
                }}
                className="flex-1 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer text-center"
              >
                + {lang === 'hi' ? 'उधार लिखें' : 'Give Credit'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const custId = viewingCustomer.id;
                  setViewingCustomer(null);
                  handleOpenAddTxn(custId, 'payment');
                }}
                className="flex-1 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer text-center"
              >
                + {lang === 'hi' ? 'जमा लिखें' : 'Receive Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
