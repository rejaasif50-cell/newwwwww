export type Language = 'en' | 'hi';

export interface AdminUser {
  username: string;
  pin: string; // PIN or password
  name: string;
}

export interface AdminSession {
  isLoggedIn: boolean;
  username: string;
  loginTime?: string;
}

export interface CSCProfile {
  centreName: string;
  centreNameHindi: string;
  vleName: string;
  cscId: string;
  mobile: string;
  email: string;
  address: string;
  district: string;
  state: string;
  pinCode: string;
  upiId: string;
  qrNote: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  villageOrWard: string;
  aadhaarLast4?: string;
  notes?: string;
  balance: number; // positive: customer owes shop (Udhar/Baqi), negative: customer gave advance (Jama)
  createdAt: string;
  updatedAt: string;
}

export interface LedgerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'credit' | 'payment'; // 'credit' = customer owes (उधार/सेवा शुल्क), 'payment' = customer paid (जमा/भुगतान)
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  paymentMode: 'cash' | 'upi' | 'bank_transfer';
  serviceName?: string;
  notes?: string;
}

export type CashCategory =
  | 'service_fee'
  | 'aeps_withdrawal'
  | 'money_transfer'
  | 'bill_payment'
  | 'ledger_payment'
  | 'paper_ink_supplies'
  | 'shop_rent_electricity'
  | 'bank_deposit'
  | 'personal_withdrawal'
  | 'other';

export interface CashEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'cash_in' | 'cash_out';
  category: CashCategory;
  categoryLabel?: string;
  amount: number;
  paymentMode: 'cash' | 'upi';
  partyName?: string;
  notes: string;
}

export interface CashDenomination {
  c500: number;
  c200: number;
  c100: number;
  c50: number;
  c20: number;
  c10: number;
  coins: number;
}

export type ServiceCategory =
  | 'identity'
  | 'certificate'
  | 'banking'
  | 'scheme'
  | 'utility'
  | 'education'
  | 'other';

export interface ServiceCatalogItem {
  id: string;
  category: ServiceCategory;
  nameEn: string;
  nameHi: string;
  defaultGovtFee: number;
  defaultCharge: number;
  requiredDocs: string[];
  approxDays: string;
  portalUrl?: string;
}

export type ServiceStatus =
  | 'received'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'rejected';

export interface ServiceOrder {
  id: string;
  tokenNo: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  ackNumber: string;
  status: ServiceStatus;
  govtFee: number;
  totalFee: number;
  paidAmount: number;
  paymentMode: 'cash' | 'upi' | 'due';
  docsCollected: string[];
  applicationDate: string;
  expectedDate?: string;
  completedDate?: string;
  remarks?: string;
}

export interface BillItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Receipt {
  receiptNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: 'cash' | 'upi' | 'due';
  notes?: string;
  referenceNo?: string;
}
