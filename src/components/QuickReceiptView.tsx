import React, { useState } from 'react';
import {
  BillItem,
  Receipt,
  Customer,
  CSCProfile,
  Language,
  LedgerTransaction,
} from '../types';
import {
  ReceiptText,
  Plus,
  Trash2,
  Printer,
  Send,
  User,
  Phone,
  Sparkles,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

interface QuickReceiptViewProps {
  customers: Customer[];
  profile: CSCProfile;
  lang: Language;
  onSaveToLedger?: (txn: LedgerTransaction) => void;
}

export const QuickReceiptView: React.FC<QuickReceiptViewProps> = ({
  customers,
  profile,
  lang,
  onSaveToLedger,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [items, setItems] = useState<BillItem[]>([
    { id: '1', description: 'ऑनलाइन फॉर्म आवेदन (Online Form Fill)', qty: 1, rate: 100, amount: 100 },
  ]);

  const [paidAmount, setPaidAmount] = useState<string>('100');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'due'>('cash');
  const [notes, setNotes] = useState('');

  // Generated receipt for modal
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);

  // Common Quick Service Presets for 1-click addition
  const quickPresets = [
    { name: 'आधार पीवीसी कार्ड (PVC Card)', rate: 100 },
    { name: 'पासपोर्ट साइज फोटो (8 पीस)', rate: 50 },
    { name: 'कलर प्रिंटआउट व लेमिनेशन (A4)', rate: 30 },
    { name: 'पैन कार्ड ऑनलाइन आवेदन', rate: 200 },
    { name: 'जाति / आय / निवास प्रमाण पत्र', rate: 150 },
    { name: 'बिजली बिल भुगतान सर्विस', rate: 20 },
    { name: 'पीएम किसान ई-केवाईसी', rate: 50 },
  ];

  const handleAddItem = (description = '', rate = 50) => {
    const newItem: BillItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      description: description || 'नई सेवा (Service)',
      qty: 1,
      rate: rate,
      amount: rate,
    };
    const updated = [...items, newItem];
    setItems(updated);
    const newTotal = updated.reduce((acc, curr) => acc + curr.amount, 0);
    setPaidAmount(newTotal.toString());
  };

  const handleUpdateItem = (
    id: string,
    field: 'description' | 'qty' | 'rate',
    value: any
  ) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const qty = field === 'qty' ? parseInt(value) || 1 : item.qty;
        const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
        const desc = field === 'description' ? value : item.description;
        return {
          ...item,
          description: desc,
          qty,
          rate,
          amount: qty * rate,
        };
      }
      return item;
    });
    setItems(updated);
    const newTotal = updated.reduce((acc, curr) => acc + curr.amount, 0);
    setPaidAmount(newTotal.toString());
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    const newTotal = updated.reduce((acc, curr) => acc + curr.amount, 0);
    setPaidAmount(newTotal.toString());
  };

  const totalAmount = items.reduce((acc, curr) => acc + curr.amount, 0);
  const paid = parseFloat(paidAmount) || 0;
  const balanceDue = Math.max(0, totalAmount - paid);

  const handleSelectExistingCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone);
    }
  };

  const handleGenerateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;

    const receiptNo = `CSC-REC-${Date.now().toString().slice(-6)}`;

    const newReceipt: Receipt = {
      receiptNo,
      date: today,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || profile.mobile,
      items: items,
      totalAmount,
      paidAmount: paid,
      balanceAmount: balanceDue,
      paymentMode,
      notes: notes.trim(),
    };

    // If balance due > 0 and customer is selected from ledger, record in ledger
    if (balanceDue > 0 && selectedCustomerId && onSaveToLedger) {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (cust) {
        onSaveToLedger({
          id: `txn-${Date.now()}`,
          customerId: cust.id,
          customerName: cust.name,
          type: 'credit',
          amount: balanceDue,
          date: today,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          paymentMode: 'cash',
          serviceName: items.map((i) => i.description).join(', ').slice(0, 50),
          notes: `रसीद #${receiptNo} का बकाया हिसाब`,
        });
      }
    }

    setActiveReceipt(newReceipt);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-purple-700" />
              <span>
                {lang === 'hi' ? 'तुरंत ग्राहक रसीद बनाएं (Quick Bill)' : 'Quick Bill & Cash Receipt'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'सीएससी की किसी भी सेवा के लिए रसीद बनाएं, प्रिंट करें या WhatsApp पर भेजें'
                : 'Generate itemized digital receipt for any CSC service, print or share on WhatsApp'}
            </p>
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="mt-3">
          <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
            {lang === 'hi' ? '⚡ त्वरित सेवा जोड़ें (Quick Presets):' : 'Quick Presets:'}
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {quickPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddItem(p.name, p.rate)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-900 border border-slate-200 whitespace-nowrap cursor-pointer transition-colors"
              >
                + {p.name} (₹{p.rate})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Billing Form Grid */}
      <form onSubmit={handleGenerateReceipt} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Customer Info & Items Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Selection Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              {lang === 'hi' ? 'ग्राहक विवरण (Customer Details)' : 'Customer Details'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'खाते से ग्राहक चुनें' : 'Pick from Khata'}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectExistingCustomer(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800"
                >
                  <option value="">-- नया ग्राहक टाइप करें --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'ग्राहक का नाम *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="उदा. राजेश कुमार"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'मोबाइल नंबर' : 'Phone'}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800"
                />
              </div>
            </div>
          </div>

          {/* Items Table Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'hi' ? 'सेवाएं एवं बिल आइटम (Services / Items)' : 'Items'}
              </h3>
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ आइटम जोड़ें</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs"
                >
                  <span className="font-bold text-slate-400 w-5 hidden sm:inline">
                    {index + 1}.
                  </span>

                  {/* Description */}
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                    placeholder="सेवा का नाम / विवरण"
                    className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white font-medium text-slate-900"
                  />

                  {/* Qty & Rate Row */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[11px]">मात्रा:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(item.id, 'qty', e.target.value)}
                        className="w-14 px-2 py-1.5 rounded border border-slate-300 bg-white text-center font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[11px]">दर ₹:</span>
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) => handleUpdateItem(item.id, 'rate', e.target.value)}
                        className="w-20 px-2 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold text-right"
                      />
                    </div>

                    {/* Line Total */}
                    <span className="w-20 font-bold font-mono text-slate-800 text-right">
                      = ₹{item.amount}
                    </span>

                    {/* Delete button */}
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Payment & Summary Calculation */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'बिल सारांश (Bill Summary)' : 'Summary'}
            </h3>

            {/* Total Calculation */}
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>कुल राशि (Gross Total):</span>
                <span className="font-extrabold text-base text-slate-900 font-mono">
                  ₹{totalAmount}
                </span>
              </div>

              <div className="pt-2 border-t border-purple-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  जमा प्राप्त राशि (Paid) ₹
                </label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base font-extrabold rounded-lg border border-slate-300 bg-white text-emerald-700 font-mono"
                />
              </div>

              {balanceDue > 0 ? (
                <div className="flex items-center justify-between text-rose-700 font-bold pt-1">
                  <span>बकाया राशि (Due):</span>
                  <span className="font-mono text-base font-extrabold">₹{balanceDue}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-emerald-700 font-bold pt-1">
                  <span>भुगतान स्थिति:</span>
                  <span className="text-xs">पूर्ण भुगतान (Paid ✅)</span>
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                भुगतान माध्यम (Mode)
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              >
                <option value="cash">नकद (Cash)</option>
                <option value="upi">ऑनलाइन (UPI/PhonePe/GPay)</option>
                <option value="due">उधार (Baqi / Due)</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                अतिरिक्त नोट (वैकल्पिक)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="उदा. फोटो कॉपी ओरिजिनल दिया"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            {/* Submit / Generate Button */}
            <button
              id="btn-generate-bill"
              type="submit"
              className="w-full py-3 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ReceiptText className="w-4 h-4 text-amber-300" />
              <span>{lang === 'hi' ? 'रसीद बनाएं व प्रिंट करें' : 'Generate & Print Receipt'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          profile={profile}
          lang={lang}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};
