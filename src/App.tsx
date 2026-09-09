import React, { useState, useEffect } from 'react';
import {
  CSCProfile,
  Customer,
  LedgerTransaction,
  CashEntry,
  ServiceCatalogItem,
  ServiceOrder,
  CashDenomination,
  Language,
  Receipt,
  ServiceStatus,
} from './types';
import { storage } from './utils/storage';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { LedgerView } from './components/LedgerView';
import { CashManageView } from './components/CashManageView';
import { ServiceManageView } from './components/ServiceManageView';
import { QuickReceiptView } from './components/QuickReceiptView';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminManageModal } from './components/AdminManageModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Core Data States (Initialized from LocalStorage)
  const [profile, setProfile] = useState<CSCProfile>(() => storage.getProfile());
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const [ledgerTxns, setLedgerTxns] = useState<LedgerTransaction[]>(() => storage.getLedgerTxns());
  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => storage.getCashEntries());
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(() => storage.getServiceOrders());
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>(() => storage.getServiceCatalog());
  const [denominations, setDenominations] = useState<CashDenomination>(() => storage.getDenominations());
  const [lang, setLang] = useState<Language>(() => storage.getLanguage());

  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    const session = storage.getAdminSession();
    return !!(session && session.isLoggedIn);
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdminManageModal, setShowAdminManageModal] = useState(false);

  // Modal States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<Receipt | null>(null);

  // Sync to LocalStorage on changes
  useEffect(() => {
    storage.setProfile(profile);
  }, [profile]);

  useEffect(() => {
    storage.setCustomers(customers);
  }, [customers]);

  useEffect(() => {
    storage.setLedgerTxns(ledgerTxns);
  }, [ledgerTxns]);

  useEffect(() => {
    storage.setCashEntries(cashEntries);
  }, [cashEntries]);

  useEffect(() => {
    storage.setServiceOrders(serviceOrders);
  }, [serviceOrders]);

  useEffect(() => {
    storage.setServiceCatalog(catalog);
  }, [catalog]);

  useEffect(() => {
    storage.setDenominations(denominations);
  }, [denominations]);

  useEffect(() => {
    storage.setLanguage(lang);
  }, [lang]);

  // Language Toggle
  const handleToggleLang = () => {
    const nextLang: Language = lang === 'hi' ? 'en' : 'hi';
    setLang(nextLang);
  };

  // Reload all data after JSON import or reset
  const handleReloadAll = () => {
    setProfile(storage.getProfile());
    setCustomers(storage.getCustomers());
    setLedgerTxns(storage.getLedgerTxns());
    setCashEntries(storage.getCashEntries());
    setServiceOrders(storage.getServiceOrders());
    setCatalog(storage.getServiceCatalog());
    setDenominations(storage.getDenominations());
    setLang(storage.getLanguage());
  };

  // 1. Customer Handlers
  const handleAddCustomer = (newCust: Customer) => {
    setCustomers((prev) => [newCust, ...prev]);
  };

  // 2. Ledger Transaction Handlers (Updates customer balance & auto-adds cashbook entry for payments)
  const handleAddLedgerTransaction = (txn: LedgerTransaction) => {
    setLedgerTxns((prev) => [txn, ...prev]);

    // Update customer balance:
    // 'credit' (Udhar दिया) -> adds to customer balance (customer owes more)
    // 'payment' (Jama लिया) -> subtracts from customer balance (customer cleared debt)
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === txn.customerId) {
          const delta = txn.type === 'credit' ? txn.amount : -txn.amount;
          return {
            ...cust,
            balance: cust.balance + delta,
            updatedAt: txn.date,
          };
        }
        return cust;
      })
    );

    // If customer paid via cash or upi, automatically record in Cash Register as Cash In!
    if (txn.type === 'payment' && (txn.paymentMode === 'cash' || txn.paymentMode === 'upi')) {
      const newCashEntry: CashEntry = {
        id: `cash-${Date.now()}`,
        date: txn.date,
        time: txn.time,
        type: 'cash_in',
        category: 'ledger_payment',
        categoryLabel: `खाता जमा (${txn.customerName})`,
        amount: txn.amount,
        paymentMode: txn.paymentMode === 'cash' ? 'cash' : 'upi',
        partyName: txn.customerName,
        notes: txn.notes || txn.serviceName || 'Customer ledger payment received',
      };
      setCashEntries((prev) => [newCashEntry, ...prev]);
    }
  };

  // 3. Cashbook Handlers
  const handleAddCashEntry = (entry: CashEntry) => {
    setCashEntries((prev) => [entry, ...prev]);
  };

  // 4. Service Order Handlers
  const handleAddServiceOrder = (order: ServiceOrder) => {
    setServiceOrders((prev) => [order, ...prev]);

    // If paid amount > 0, record in Cashbook as Cash In
    if (order.paidAmount > 0 && (order.paymentMode === 'cash' || order.paymentMode === 'upi')) {
      const newCashEntry: CashEntry = {
        id: `cash-${Date.now()}`,
        date: order.applicationDate,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        type: 'cash_in',
        category: 'service_fee',
        categoryLabel: `${order.serviceName} फीस`,
        amount: order.paidAmount,
        paymentMode: order.paymentMode === 'cash' ? 'cash' : 'upi',
        partyName: order.customerName,
        notes: `टोकन: ${order.tokenNo} - ${order.serviceName}`,
      };
      setCashEntries((prev) => [newCashEntry, ...prev]);
    }

    // If there is a pending balance and customer exists in Ledger, update balance
    const dueAmount = order.totalFee - order.paidAmount;
    if (dueAmount > 0) {
      const existingCust = customers.find(
        (c) =>
          c.name.toLowerCase() === order.customerName.toLowerCase() ||
          c.phone === order.customerPhone
      );

      if (existingCust) {
        handleAddLedgerTransaction({
          id: `txn-${Date.now()}`,
          customerId: existingCust.id,
          customerName: existingCust.name,
          type: 'credit',
          amount: dueAmount,
          date: order.applicationDate,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          paymentMode: 'cash',
          serviceName: order.serviceName,
          notes: `टोकन ${order.tokenNo} का बकाया शुल्क`,
        });
      }
    }
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: ServiceStatus,
    remarks?: string
  ) => {
    setServiceOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status,
            remarks: remarks !== undefined ? remarks : ord.remarks,
            completedDate:
              status === 'delivered' ? new Date().toISOString().split('T')[0] : ord.completedDate,
          };
        }
        return ord;
      })
    );
  };

  const handleCollectOrderDue = (orderId: string, paidAmount: number) => {
    setServiceOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            paidAmount: ord.paidAmount + paidAmount,
          };
        }
        return ord;
      })
    );

    // Record cash in
    const targetOrder = serviceOrders.find((o) => o.id === orderId);
    if (targetOrder) {
      const cashEntry: CashEntry = {
        id: `cash-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        type: 'cash_in',
        category: 'service_fee',
        categoryLabel: `${targetOrder.serviceName} बाकी फीस जमा`,
        amount: paidAmount,
        paymentMode: 'cash',
        partyName: targetOrder.customerName,
        notes: `टोकन: ${targetOrder.tokenNo} डिलीवरी समय बकाया भुगतान प्राप्त`,
      };
      setCashEntries((prev) => [cashEntry, ...prev]);
    }
  };

  const handleOpenReceiptForOrder = (order: ServiceOrder) => {
    const receipt: Receipt = {
      receiptNo: `REC-${order.tokenNo}`,
      date: order.applicationDate,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: [
        {
          id: '1',
          description: order.serviceName,
          qty: 1,
          rate: order.totalFee,
          amount: order.totalFee,
        },
      ],
      totalAmount: order.totalFee,
      paidAmount: order.paidAmount,
      balanceAmount: Math.max(0, order.totalFee - order.paidAmount),
      paymentMode: order.paymentMode,
      notes: `टोकन: ${order.tokenNo} | Ack No: ${order.ackNumber}`,
    };
    setActiveReceiptModal(receipt);
  };

  // Admin Handlers
  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setShowAdminLoginModal(false);
  };

  const handleAdminLogout = () => {
    storage.clearAdminSession();
    setIsAdminLoggedIn(false);
    setShowAdminManageModal(false);
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setLedgerTxns((prev) => prev.filter((t) => t.customerId !== customerId));
  };

  const handleDeleteLedgerTransaction = (txnId: string) => {
    const txn = ledgerTxns.find((t) => t.id === txnId);
    if (txn) {
      // Revert customer balance
      const delta = txn.type === 'credit' ? -txn.amount : txn.amount;
      setCustomers((prev) =>
        prev.map((c) => (c.id === txn.customerId ? { ...c, balance: c.balance + delta } : c))
      );
    }
    setLedgerTxns((prev) => prev.filter((t) => t.id !== txnId));
  };

  const handleDeleteCashEntry = (entryId: string) => {
    setCashEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleDeleteServiceOrder = (orderId: string) => {
    setServiceOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleUpdateCatalog = (newCatalog: ServiceCatalogItem[]) => {
    setCatalog(newCatalog);
    storage.setServiceCatalog(newCatalog);
  };

  // Metric aggregates for header
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = cashEntries.filter((e) => e.date === todayStr);
  const todayCashIn = todayEntries
    .filter((e) => e.type === 'cash_in' && e.paymentMode === 'cash')
    .reduce((a, b) => a + b.amount, 0);
  const todayCashOut = todayEntries
    .filter((e) => e.type === 'cash_out' && e.paymentMode === 'cash')
    .reduce((a, b) => a + b.amount, 0);
  const todayCashInHand = todayCashIn - todayCashOut;

  const totalMarketDue = customers
    .filter((c) => c.balance > 0)
    .reduce((a, b) => a + b.balance, 0);

  const dueCustomersCount = customers.filter((c) => c.balance > 0).length;
  const pendingOrdersCount = serviceOrders.filter(
    (o) => o.status === 'received' || o.status === 'in_progress' || o.status === 'ready'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Main Navigation Header */}
      <Header
        profile={profile}
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenSettings={() => setShowSettingsModal(true)}
        todayCashInHand={todayCashInHand}
        totalMarketDue={totalMarketDue}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => setShowAdminLoginModal(true)}
        onOpenAdminManage={() => setShowAdminManageModal(true)}
      />

      {/* Secondary Desktop Tabs & Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        lang={lang}
        dueCount={dueCustomersCount}
        pendingServicesCount={pendingOrdersCount}
      />

      {/* Main Content Area (padding-bottom for mobile bottom bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            customers={customers}
            cashEntries={cashEntries}
            serviceOrders={serviceOrders}
            ledgerTxns={ledgerTxns}
            lang={lang}
            onNavigateTab={setActiveTab}
            onOpenAddLedgerModal={() => setActiveTab('ledger')}
            onOpenAddCashModal={() => setActiveTab('cash')}
            onOpenAddServiceModal={() => setActiveTab('services')}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerView
            customers={customers}
            ledgerTxns={ledgerTxns}
            profile={profile}
            lang={lang}
            onAddCustomer={handleAddCustomer}
            onAddTransaction={handleAddLedgerTransaction}
            onDeleteCustomer={handleDeleteCustomer}
            onDeleteTransaction={handleDeleteLedgerTransaction}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenAdminLogin={() => setShowAdminLoginModal(true)}
          />
        )}

        {activeTab === 'cash' && (
          <CashManageView
            cashEntries={cashEntries}
            denominations={denominations}
            lang={lang}
            onAddCashEntry={handleAddCashEntry}
            onUpdateDenominations={setDenominations}
            onDeleteCashEntry={handleDeleteCashEntry}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenAdminLogin={() => setShowAdminLoginModal(true)}
          />
        )}

        {activeTab === 'services' && (
          <ServiceManageView
            orders={serviceOrders}
            catalog={catalog}
            customers={customers}
            profile={profile}
            lang={lang}
            onAddOrder={handleAddServiceOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onCollectOrderDue={handleCollectOrderDue}
            onOpenReceiptForOrder={handleOpenReceiptForOrder}
            onDeleteOrder={handleDeleteServiceOrder}
            isAdminLoggedIn={isAdminLoggedIn}
            onOpenAdminManage={() => setShowAdminManageModal(true)}
            onOpenAdminLogin={() => setShowAdminLoginModal(true)}
          />
        )}

        {activeTab === 'receipt' && (
          <QuickReceiptView
            customers={customers}
            profile={profile}
            lang={lang}
            onSaveToLedger={handleAddLedgerTransaction}
          />
        )}
      </main>

      {/* Admin Authentication Modal */}
      {showAdminLoginModal && (
        <AdminLoginModal
          lang={lang}
          onClose={() => setShowAdminLoginModal(false)}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      )}

      {/* Admin Management Dashboard Modal */}
      {showAdminManageModal && (
        <AdminManageModal
          profile={profile}
          catalog={catalog}
          lang={lang}
          onClose={() => setShowAdminManageModal(false)}
          onSaveProfile={setProfile}
          onSaveCatalog={handleUpdateCatalog}
          onLogout={handleAdminLogout}
          onReloadAfterImport={handleReloadAll}
        />
      )}

      {/* Profile, Settings & GitHub Live Guide Modal */}
      {showSettingsModal && (
        <ProfileSettingsModal
          profile={profile}
          lang={lang}
          onClose={() => setShowSettingsModal(false)}
          onSaveProfile={setProfile}
          onResetAllData={() => {
            storage.resetAll();
            handleReloadAll();
          }}
          onReloadAfterImport={handleReloadAll}
        />
      )}

      {/* Printable Receipt Modal */}
      {activeReceiptModal && (
        <ReceiptModal
          receipt={activeReceiptModal}
          profile={profile}
          lang={lang}
          onClose={() => setActiveReceiptModal(null)}
        />
      )}
    </div>
  );
}
