import {
  CSCProfile,
  Customer,
  LedgerTransaction,
  CashEntry,
  ServiceCatalogItem,
  ServiceOrder,
  CashDenomination,
  Language,
  AdminUser,
  AdminSession,
} from '../types';
import {
  DEFAULT_PROFILE,
  DEFAULT_CUSTOMERS,
  DEFAULT_LEDGER_TRANSACTIONS,
  DEFAULT_CASH_ENTRIES,
  DEFAULT_SERVICES_CATALOG,
  DEFAULT_SERVICE_ORDERS,
} from '../data/defaultData';

const STORAGE_KEYS = {
  PROFILE: 'csc_profile_v1',
  CUSTOMERS: 'csc_customers_v1',
  LEDGER: 'csc_ledger_txns_v1',
  CASH: 'csc_cash_entries_v1',
  SERVICES: 'csc_service_orders_v1',
  CATALOG: 'csc_service_catalog_v1',
  DENOMINATIONS: 'csc_denominations_v1',
  LANG: 'csc_portal_lang_v1',
  ADMIN_CREDS: 'csc_admin_creds_v1',
  ADMIN_SESSION: 'csc_admin_session_v1',
};

export const DEFAULT_ADMIN_USER: AdminUser = {
  username: 'admin',
  pin: 'admin123',
  name: 'CSC Centre Admin',
};

export const DEFAULT_DENOMINATIONS: CashDenomination = {
  c500: 0,
  c200: 0,
  c100: 0,
  c50: 0,
  c20: 0,
  c10: 0,
  coins: 0,
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage`, err);
  }
}

export const storage = {
  getProfile: (): CSCProfile => safeGet<CSCProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
  setProfile: (data: CSCProfile) => safeSet(STORAGE_KEYS.PROFILE, data),

  getCustomers: (): Customer[] => safeGet<Customer[]>(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS),
  setCustomers: (data: Customer[]) => safeSet(STORAGE_KEYS.CUSTOMERS, data),

  getLedgerTxns: (): LedgerTransaction[] =>
    safeGet<LedgerTransaction[]>(STORAGE_KEYS.LEDGER, DEFAULT_LEDGER_TRANSACTIONS),
  setLedgerTxns: (data: LedgerTransaction[]) => safeSet(STORAGE_KEYS.LEDGER, data),

  getCashEntries: (): CashEntry[] => safeGet<CashEntry[]>(STORAGE_KEYS.CASH, DEFAULT_CASH_ENTRIES),
  setCashEntries: (data: CashEntry[]) => safeSet(STORAGE_KEYS.CASH, data),

  getServiceOrders: (): ServiceOrder[] =>
    safeGet<ServiceOrder[]>(STORAGE_KEYS.SERVICES, DEFAULT_SERVICE_ORDERS),
  setServiceOrders: (data: ServiceOrder[]) => safeSet(STORAGE_KEYS.SERVICES, data),

  getServiceCatalog: (): ServiceCatalogItem[] =>
    safeGet<ServiceCatalogItem[]>(STORAGE_KEYS.CATALOG, DEFAULT_SERVICES_CATALOG),
  setServiceCatalog: (data: ServiceCatalogItem[]) => safeSet(STORAGE_KEYS.CATALOG, data),

  getDenominations: (): CashDenomination =>
    safeGet<CashDenomination>(STORAGE_KEYS.DENOMINATIONS, DEFAULT_DENOMINATIONS),
  setDenominations: (data: CashDenomination) => safeSet(STORAGE_KEYS.DENOMINATIONS, data),

  getLanguage: (): Language => safeGet<Language>(STORAGE_KEYS.LANG, 'en'),
  setLanguage: (lang: Language) => safeSet(STORAGE_KEYS.LANG, lang),

  getAdminUser: (): AdminUser => safeGet<AdminUser>(STORAGE_KEYS.ADMIN_CREDS, DEFAULT_ADMIN_USER),
  setAdminUser: (admin: AdminUser) => safeSet(STORAGE_KEYS.ADMIN_CREDS, admin),

  getAdminSession: (): AdminSession =>
    safeGet<AdminSession>(STORAGE_KEYS.ADMIN_SESSION, { isLoggedIn: false, username: '' }),
  setAdminSession: (session: AdminSession) => safeSet(STORAGE_KEYS.ADMIN_SESSION, session),
  clearAdminSession: () => {
    safeSet(STORAGE_KEYS.ADMIN_SESSION, { isLoggedIn: false, username: '' });
  },

  exportAllBackup: () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: storage.getProfile(),
      customers: storage.getCustomers(),
      ledgerTxns: storage.getLedgerTxns(),
      cashEntries: storage.getCashEntries(),
      serviceOrders: storage.getServiceOrders(),
      serviceCatalog: storage.getServiceCatalog(),
      denominations: storage.getDenominations(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CSC_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) storage.setProfile(data.profile);
      if (Array.isArray(data.customers)) storage.setCustomers(data.customers);
      if (Array.isArray(data.ledgerTxns)) storage.setLedgerTxns(data.ledgerTxns);
      if (Array.isArray(data.cashEntries)) storage.setCashEntries(data.cashEntries);
      if (Array.isArray(data.serviceOrders)) storage.setServiceOrders(data.serviceOrders);
      if (Array.isArray(data.serviceCatalog)) storage.setServiceCatalog(data.serviceCatalog);
      if (data.denominations) storage.setDenominations(data.denominations);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  resetAll: () => {
    storage.setProfile(DEFAULT_PROFILE);
    storage.setCustomers(DEFAULT_CUSTOMERS);
    storage.setLedgerTxns(DEFAULT_LEDGER_TRANSACTIONS);
    storage.setCashEntries(DEFAULT_CASH_ENTRIES);
    storage.setServiceOrders(DEFAULT_SERVICE_ORDERS);
    storage.setServiceCatalog(DEFAULT_SERVICES_CATALOG);
    storage.setDenominations(DEFAULT_DENOMINATIONS);
  },
};
