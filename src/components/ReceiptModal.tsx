import React, { useRef } from 'react';
import { Receipt, CSCProfile, Language } from '../types';
import { formatDate, formatCurrency, getWhatsAppReceiptUrl } from '../utils/formatters';
import {
  Printer,
  Send,
  X,
  ShieldCheck,
  Building2,
  CheckCircle2,
  QrCode,
} from 'lucide-react';

interface ReceiptModalProps {
  receipt: Receipt | null;
  profile: CSCProfile;
  lang: Language;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  profile,
  lang,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full print:p-2">
        {/* Action Bar (Hidden in print) */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'सीएससी ग्राहक रसीद' : 'CSC Customer Receipt'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getWhatsAppReceiptUrl(receipt, profile)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            <button
              id="btn-print-receipt"
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट (Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div
          ref={receiptRef}
          id="csc-printable-receipt"
          className="border border-slate-300 rounded-xl p-4 sm:p-5 text-slate-900 bg-white"
        >
          {/* Top Header of Receipt */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
            <div className="inline-block bg-blue-900 text-white font-black text-xs px-2 py-0.5 rounded tracking-wider uppercase mb-1">
              COMMON SERVICES CENTRE (CSC) / डिजिटल सेवा केंद्र
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {profile.centreName}
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {profile.address}, {profile.district}, {profile.state} - {profile.pinCode}
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-700 font-semibold mt-1 flex-wrap">
              <span>CSC ID: <strong className="font-mono text-blue-900">{profile.cscId}</strong></span>
              <span>•</span>
              <span>VLE: {profile.vleName}</span>
              <span>•</span>
              <span>Mob: {profile.mobile}</span>
            </div>
          </div>

          {/* Receipt Meta & Customer Row */}
          <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-b border-slate-200">
            <div>
              <p className="text-slate-500 text-[10px]">रसीद संख्या (Receipt No):</p>
              <p className="font-mono font-bold text-slate-900">{receipt.receiptNo}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[10px]">तारीख (Date):</p>
              <p className="font-bold text-slate-900">{formatDate(receipt.date)}</p>
            </div>

            <div className="mt-1">
              <p className="text-slate-500 text-[10px]">ग्राहक का नाम (Customer):</p>
              <p className="font-bold text-slate-900">{receipt.customerName}</p>
            </div>
            <div className="text-right mt-1">
              <p className="text-slate-500 text-[10px]">मोबाइल नंबर (Phone):</p>
              <p className="font-mono font-medium text-slate-900">{receipt.customerPhone}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 text-[11px]">
                  <th className="py-1 text-left font-bold w-8">#</th>
                  <th className="py-1 text-left font-bold">सेवा विवरण (Service Description)</th>
                  <th className="py-1 text-center font-bold w-12">मात्रा</th>
                  <th className="py-1 text-right font-bold w-16">दर</th>
                  <th className="py-1 text-right font-bold w-20">राशि</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.items.map((item, index) => (
                  <tr key={item.id || index} className="text-slate-800">
                    <td className="py-1.5 text-slate-500">{index + 1}</td>
                    <td className="py-1.5 font-medium">{item.description}</td>
                    <td className="py-1.5 text-center">{item.qty}</td>
                    <td className="py-1.5 text-right font-mono">₹{item.rate}</td>
                    <td className="py-1.5 text-right font-mono font-bold">₹{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation Box */}
          <div className="border-t-2 border-dashed border-slate-300 pt-2.5 space-y-1 text-xs">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>कुल राशि (Gross Total):</span>
              <span className="font-mono font-bold text-slate-900">₹{receipt.totalAmount}</span>
            </div>

            <div className="flex justify-between font-bold text-emerald-800">
              <span>प्राप्त राशि (Paid Amount):</span>
              <span className="font-mono font-extrabold text-emerald-700">₹{receipt.paidAmount}</span>
            </div>

            {receipt.balanceAmount > 0 && (
              <div className="flex justify-between font-bold text-rose-700 pt-1 border-t border-slate-100">
                <span>बकाया राशि (Balance Due):</span>
                <span className="font-mono font-extrabold text-rose-700">₹{receipt.balanceAmount}</span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>भुगतान माध्यम (Mode):</span>
              <span className="font-mono uppercase font-bold text-slate-700">
                {receipt.paymentMode}
              </span>
            </div>
          </div>

          {/* QR Code & Digital Signature Stamp Block */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
            {/* UPI QR Hint */}
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded flex items-center justify-center">
                <QrCode className="w-8 h-8 text-blue-950" />
              </div>
              <div className="text-[10px] text-slate-600 leading-tight">
                <p className="font-bold text-slate-800">Scan & Pay via UPI</p>
                <p className="font-mono text-blue-900">{profile.upiId}</p>
                <p className="text-[9px] text-slate-400">GPay / PhonePe / Paytm</p>
              </div>
            </div>

            {/* VLE Stamp & Sign Block */}
            <div className="text-center w-36">
              <div className="border border-blue-900/40 rounded p-1 text-[9px] text-blue-950 font-bold bg-blue-50/50 mb-1">
                AUTHORIZED VLE SEAL
                <br />
                {profile.centreName.slice(0, 18)}
              </div>
              <p className="text-[10px] text-slate-600">हस्ताक्षर / प्राधिकृत सीएससी</p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-3 pt-2 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-500">
            <p>कंप्यूटर जनरेटेड रसीद • डिजिटल सेवा केंद्र का उपयोग करने के लिए धन्यवाद!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
