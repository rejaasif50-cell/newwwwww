import { Customer, LedgerTransaction, CashEntry, CSCProfile, Receipt } from '../types';

export const formatCurrency = (num: number): string => {
  const isNegative = num < 0;
  const abs = Math.abs(num);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(abs);

  return isNegative ? `-${formatted}` : formatted;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
};

export const formatTime = (timeStr?: string): string => {
  if (!timeStr) return '';
  return timeStr;
};

export const getWhatsAppReminderUrl = (
  customer: Customer,
  profile: CSCProfile,
  dueAmount: number
): string => {
  const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
  const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const msg = `Dear ${customer.name},\n\nThis is a polite payment reminder from *${profile.centreName}* (VLE: ${profile.vleName}).\nYour outstanding balance with our centre is *₹${dueAmount}*.\n\nYou may clear your due by visiting our CSC Centre or paying directly via UPI.\n*UPI ID:* ${profile.upiId}\n\nThank you! 🙏\nContact: ${profile.mobile}`;

  return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;
};

export const getWhatsAppReceiptUrl = (
  receipt: Receipt,
  profile: CSCProfile
): string => {
  const cleanPhone = receipt.customerPhone.replace(/[^0-9]/g, '');
  const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let itemsList = '';
  receipt.items.forEach((item, idx) => {
    itemsList += `${idx + 1}. ${item.description} (Qty: ${item.qty}) - ₹${item.amount}\n`;
  });

  const msg = `🧾 *OFFICIAL CASH RECEIPT / INVOICE*\n*${profile.centreName}*\nCSC ID: ${profile.cscId}\nVLE: ${profile.vleName} (${profile.mobile})\n---------------------------\n*Receipt No:* ${receipt.receiptNo}\n*Date:* ${formatDate(receipt.date)}\n*Customer:* ${receipt.customerName} (${receipt.customerPhone})\n---------------------------\n*Services / Items:*\n${itemsList}---------------------------\n*Total Amount:* ₹${receipt.totalAmount}\n*Paid Amount:* ₹${receipt.paidAmount}\n*Balance Due:* ₹${receipt.balanceAmount}\n*Payment Mode:* ${receipt.paymentMode.toUpperCase()}\n---------------------------\nThank you for choosing Digital Seva Kendra! 🙏`;

  return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;
};

export const exportCustomersCSV = (customers: Customer[]) => {
  const headers = ['Name', 'Phone', 'Village/Address', 'Aadhaar Last 4', 'Balance (Due)', 'Notes', 'Created Date'];
  const rows = customers.map((c) => [
    `"${c.name}"`,
    `"${c.phone}"`,
    `"${c.villageOrWard || ''}"`,
    `"${c.aadhaarLast4 || ''}"`,
    c.balance,
    `"${c.notes || ''}"`,
    c.createdAt,
  ]);
  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CSC_Customer_Khata_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportCashEntriesCSV = (entries: CashEntry[]) => {
  const headers = ['Date', 'Time', 'Type (In/Out)', 'Category', 'Party/Customer', 'Payment Mode', 'Amount', 'Notes'];
  const rows = entries.map((e) => [
    e.date,
    e.time || '',
    e.type === 'cash_in' ? 'CASH IN (नकद आया)' : 'CASH OUT (नकद गया)',
    `"${e.categoryLabel || e.category}"`,
    `"${e.partyName || ''}"`,
    e.paymentMode.toUpperCase(),
    e.amount,
    `"${e.notes || ''}"`,
  ]);
  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CSC_Cashbook_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
