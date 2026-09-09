import React, { useState } from 'react';
import {
  ServiceOrder,
  ServiceCatalogItem,
  Customer,
  CSCProfile,
  ServiceStatus,
  ServiceCategory,
  Language,
} from '../types';
import {
  formatCurrency,
  formatDate,
} from '../utils/formatters';
import {
  FileCheck2,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Phone,
  Send,
  X,
  Copy,
  Receipt,
  ListOrdered,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Trash2,
} from 'lucide-react';

interface ServiceManageViewProps {
  orders: ServiceOrder[];
  catalog: ServiceCatalogItem[];
  customers: Customer[];
  profile: CSCProfile;
  lang: Language;
  onAddOrder: (order: ServiceOrder) => void;
  onUpdateOrderStatus: (orderId: string, status: ServiceStatus, remarks?: string) => void;
  onCollectOrderDue: (orderId: string, paidAmount: number) => void;
  onOpenReceiptForOrder: (order: ServiceOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
  isAdminLoggedIn?: boolean;
  onOpenAdminManage?: () => void;
  onOpenAdminLogin?: () => void;
}

export const ServiceManageView: React.FC<ServiceManageViewProps> = ({
  orders,
  catalog,
  customers,
  profile,
  lang,
  onAddOrder,
  onUpdateOrderStatus,
  onCollectOrderDue,
  onOpenReceiptForOrder,
  onDeleteOrder,
  isAdminLoggedIn,
  onOpenAdminManage,
  onOpenAdminLogin,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Form State for New Service Order
  const [custType, setCustType] = useState<'existing' | 'new'>('existing');
  const [selectedCustId, setSelectedCustId] = useState('');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [ackNo, setAckNo] = useState('');
  const [govtFee, setGovtFee] = useState<number>(0);
  const [totalFee, setTotalFee] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'due'>('cash');
  const [collectedDocs, setCollectedDocs] = useState<string[]>([]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState('');

  // Status counts
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const inProgressCount = orders.filter((o) => o.status === 'in_progress').length;
  const receivedCount = orders.filter((o) => o.status === 'received').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.includes(q) ||
      order.serviceName.toLowerCase().includes(q) ||
      order.tokenNo.toLowerCase().includes(q) ||
      (order.ackNumber && order.ackNumber.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;
    return true;
  });

  const handleSelectCatalogItem = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const item = catalog.find((c) => c.id === serviceId);
    if (item) {
      setGovtFee(item.defaultGovtFee);
      setTotalFee(item.defaultCharge);
      setPaidAmount(item.defaultCharge);
      setCollectedDocs([...item.requiredDocs]);
    }
  };

  const handleSelectExistingCustomer = (cId: string) => {
    setSelectedCustId(cId);
    const cust = customers.find((c) => c.id === cId);
    if (cust) {
      setCustName(cust.name);
      setCustPhone(cust.phone);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim() || !selectedServiceId) return;

    const serviceItem = catalog.find((c) => c.id === selectedServiceId);
    const tokenNumber = `CSC-${orders.length + 101}`;

    const newOrder: ServiceOrder = {
      id: `order-${Date.now()}`,
      tokenNo: tokenNumber,
      customerName: custName.trim(),
      customerPhone: custPhone.trim(),
      serviceId: selectedServiceId,
      serviceName: serviceItem ? (lang === 'hi' ? serviceItem.nameHi : serviceItem.nameEn) : 'CSC Service',
      category: serviceItem ? serviceItem.category : 'other',
      ackNumber: ackNo.trim() || `ACK-${Date.now().toString().slice(-6)}`,
      status: 'received',
      govtFee: govtFee,
      totalFee: totalFee,
      paidAmount: paidAmount,
      paymentMode: paymentMode,
      docsCollected: collectedDocs,
      applicationDate: today,
      expectedDate: expectedDate,
      remarks: remarks.trim(),
    };

    onAddOrder(newOrder);

    // Reset Form
    setSelectedCustId('');
    setCustName('');
    setCustPhone('');
    setSelectedServiceId('');
    setAckNo('');
    setGovtFee(0);
    setTotalFee(0);
    setPaidAmount(0);
    setCollectedDocs([]);
    setRemarks('');
    setShowAddModal(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const getWhatsAppUpdateUrl = (order: ServiceOrder): string => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    let statusText = '';
    if (order.status === 'ready') {
      statusText =
        lang === 'hi'
          ? `🎉 आपका *${order.serviceName}* तैयार हो गया है!\nकृपया अपने सीएससी केंद्र (*${profile.centreName}*) पर आकर इसे प्राप्त कर लें।`
          : `🎉 Your *${order.serviceName}* document is ready for collection!\nPlease visit our CSC Centre (*${profile.centreName}*) to collect it.`;
    } else if (order.status === 'in_progress') {
      statusText =
        lang === 'hi'
          ? `ℹ️ आपके *${order.serviceName}* का आवेदन सफलतापूर्वक ऑनलाइन सबमिट हो चुका है।\n*Ack / Ref No:* ${order.ackNumber}\nकाम प्रगति पर है।`
          : `ℹ️ Your *${order.serviceName}* application has been submitted online.\n*Ack / Ref No:* ${order.ackNumber}\nWork is currently in progress.`;
    } else {
      statusText =
        lang === 'hi'
          ? `ℹ️ आपके *${order.serviceName}* के दस्तावेज प्राप्त हो चुके हैं। टोकन संख्या: *${order.tokenNo}*`
          : `ℹ️ Documents received for *${order.serviceName}*. Token No: *${order.tokenNo}*`;
    }

    const dueText =
      order.totalFee - order.paidAmount > 0
        ? `\n*${lang === 'hi' ? 'बकाया शुल्क' : 'Due Balance'}:* ₹${order.totalFee - order.paidAmount}`
        : '';

    const msg =
      lang === 'hi'
        ? `नमस्ते ${order.customerName} जी,\n\n${statusText}${dueText}\n\nधन्यवाद! 🙏\n*${profile.centreName}*\nसंपर्क: ${profile.mobile}`
        : `Dear ${order.customerName},\n\n${statusText}${dueText}\n\nThank you! 🙏\n*${profile.centreName}*\nContact: ${profile.mobile}`;

    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-900" />
              <span>
                {lang === 'hi'
                  ? 'सेवाएं एवं आवेदन प्रबंधन (Service Tracker)'
                  : 'CSC Service Orders Tracker'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'पैन कार्ड, जाति/आय/निवास, पीएम किसान, आयुष्मान व अन्य ऑनलाइन फॉर्म ट्रैकर'
                : 'Track customer applications from document collection to delivery'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-catalog"
              type="button"
              onClick={() => setShowCatalogModal(true)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5 text-blue-700" />
              <span>{lang === 'hi' ? 'सेवा रेट लिस्ट (30+)' : 'Rate List'}</span>
            </button>

            {isAdminLoggedIn && onOpenAdminManage && (
              <button
                id="btn-admin-manage-rates"
                type="button"
                onClick={onOpenAdminManage}
                className="px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Admin: Edit Service Catalog and Rates"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'hi' ? 'रेट बदलें' : 'Manage Rates'}</span>
              </button>
            )}

            <button
              id="btn-add-service-order"
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'hi' ? '+ नया आवेदन' : '+ New Application'}</span>
            </button>
          </div>
        </div>

        {/* 4 Status Metric Pills */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-3">
          <div
            onClick={() => setSelectedStatus('ready')}
            className={`p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStatus === 'ready'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20'
                : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase">
              {lang === 'hi' ? 'तैयार (वितरण करें)' : 'Ready'}
            </p>
            <p className="text-base sm:text-2xl font-extrabold text-emerald-700 mt-0.5">
              {readyCount}
            </p>
          </div>

          <div
            onClick={() => setSelectedStatus('in_progress')}
            className={`p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStatus === 'in_progress'
                ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-500/20'
                : 'bg-blue-50 border-blue-200 hover:border-blue-300'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-bold text-blue-800 uppercase">
              {lang === 'hi' ? 'प्रक्रिया में (In Progress)' : 'In Process'}
            </p>
            <p className="text-base sm:text-2xl font-extrabold text-blue-800 mt-0.5">
              {inProgressCount}
            </p>
          </div>

          <div
            onClick={() => setSelectedStatus('received')}
            className={`p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStatus === 'received'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500/20'
                : 'bg-amber-50 border-amber-200 hover:border-amber-300'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-bold text-amber-800 uppercase">
              {lang === 'hi' ? 'नया प्राप्त (New)' : 'Received'}
            </p>
            <p className="text-base sm:text-2xl font-extrabold text-amber-800 mt-0.5">
              {receivedCount}
            </p>
          </div>

          <div
            onClick={() => setSelectedStatus('delivered')}
            className={`p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStatus === 'delivered'
                ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-500/20'
                : 'bg-purple-50 border-purple-200 hover:border-purple-300'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-bold text-purple-800 uppercase">
              {lang === 'hi' ? 'दे दिया (Delivered)' : 'Delivered'}
            </p>
            <p className="text-base sm:text-2xl font-extrabold text-purple-800 mt-0.5">
              {deliveredCount}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-orders"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'hi'
                ? 'ग्राहक नाम, मोबाइल, सेवा या Ack/Token नंबर से खोजें...'
                : 'Search by customer, phone, service or Ack/Token...'
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
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-900 text-white font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {lang === 'hi' ? `सभी (${orders.length})` : `All (${orders.length})`}
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('ready')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              selectedStatus === 'ready'
                ? 'bg-emerald-700 text-white font-bold'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            {lang === 'hi' ? `तैयार (${readyCount})` : `Ready (${readyCount})`}
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              selectedStatus === 'in_progress'
                ? 'bg-blue-700 text-white font-bold'
                : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            {lang === 'hi' ? `प्रगति पर (${inProgressCount})` : `In-Progress (${inProgressCount})`}
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
          <p className="text-slate-400 text-sm">
            {lang === 'hi'
              ? 'कोई आवेदन नहीं मिला। नया आवेदन दर्ज करने के लिए "+ नया आवेदन" पर क्लिक करें।'
              : 'No orders found. Click "+ New Application" to add one.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isReady = order.status === 'ready';
            const isInProgress = order.status === 'in_progress';
            const isDelivered = order.status === 'delivered';
            const isReceived = order.status === 'received';
            const dueBal = order.totalFee - order.paidAmount;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl p-3.5 sm:p-4 border transition-all ${
                  isReady
                    ? 'border-emerald-300 shadow-xs'
                    : isInProgress
                    ? 'border-blue-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Token, Service, Customer */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900 text-white shadow-2xs">
                        {order.tokenNo}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isReady
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isInProgress
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : isDelivered
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {isReady ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{lang === 'hi' ? 'तैयार (Ready for Delivery)' : 'Ready'}</span>
                          </>
                        ) : isInProgress ? (
                          <>
                            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
                            <span>{lang === 'hi' ? 'प्रक्रिया में (In Progress)' : 'In Progress'}</span>
                          </>
                        ) : isDelivered ? (
                          <>
                            <Truck className="w-3 h-3 text-purple-600" />
                            <span>{lang === 'hi' ? 'ग्राहक को दे दिया (Delivered)' : 'Delivered'}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>{lang === 'hi' ? 'दस्तावेज प्राप्त (New)' : 'Received'}</span>
                          </>
                        )}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        तारीख: {formatDate(order.applicationDate)}
                      </span>
                    </div>

                    {/* Service Name */}
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {order.serviceName}
                    </h3>

                    {/* Customer & Ack Info */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-800">
                        {order.customerName}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {order.customerPhone}
                      </span>
                      {order.ackNumber && (
                        <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                          Ack: <strong>{order.ackNumber}</strong>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.ackNumber, order.id)}
                            className="text-slate-400 hover:text-blue-700 ml-0.5 cursor-pointer"
                            title="Copy Ack No"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copySuccess === order.id && (
                            <span className="text-[9px] text-emerald-600 font-bold">कॉपी!</span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Collected Documents Checklist Pill */}
                    {order.docsCollected && order.docsCollected.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-500">
                          जमा दस्तावेज:
                        </span>
                        {order.docsCollected.map((doc, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            {doc}
                          </span>
                        ))}
                      </div>
                    )}

                    {order.remarks && (
                      <p className="text-[11px] text-slate-500 italic mt-1.5 bg-slate-50 p-1.5 rounded">
                        टिप्पणी: {order.remarks}
                      </p>
                    )}
                  </div>

                  {/* Right: Fees & Financial Status */}
                  <div className="sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-lg flex sm:flex-col justify-between items-center sm:items-end">
                    <div>
                      <span className="text-xs text-slate-500 block">कुल फीस (Total):</span>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{order.totalFee}
                      </span>
                    </div>

                    <div className="mt-1">
                      {dueBal > 0 ? (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 block">
                          ₹{dueBal} बाकी (Due)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block">
                          पूर्ण भुगतान (Paid)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  {/* Left Action Buttons: WhatsApp & Receipt */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={getWhatsAppUpdateUrl(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1 transition-colors"
                      title="WhatsApp status update"
                    >
                      <Send className="w-3 h-3 text-emerald-600" />
                      <span>{lang === 'hi' ? 'WhatsApp सूचना' : 'WhatsApp'}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onOpenReceiptForOrder(order)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Generate Receipt"
                    >
                      <Receipt className="w-3 h-3 text-slate-600" />
                      <span>{lang === 'hi' ? 'रसीद प्रिंट' : 'Receipt'}</span>
                    </button>
                  </div>

                  {/* Right Action Buttons: Advance Status */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {isReceived && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'in_progress')}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-800 hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <span>{lang === 'hi' ? 'काम शुरू करें →' : 'Start Process →'}</span>
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'तैयार हो गया!' : 'Mark Ready!'}</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        type="button"
                        onClick={() => {
                          if (dueBal > 0) {
                            if (
                              window.confirm(
                                lang === 'hi'
                                  ? `क्या ग्राहक ने बाकी ₹${dueBal} का भुगतान कर दिया है?`
                                  : `Has the customer paid the remaining ₹${dueBal}?`
                              )
                            ) {
                              onCollectOrderDue(order.id, dueBal);
                              onUpdateOrderStatus(order.id, 'delivered');
                            }
                          } else {
                            onUpdateOrderStatus(order.id, 'delivered');
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-600 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>
                          {dueBal > 0
                            ? (lang === 'hi' ? 'फीस लें व डिलीवर करें' : `Collect ₹${dueBal} & Deliver`)
                            : (lang === 'hi' ? 'डिलीवर करें' : 'Deliver')}
                        </span>
                      </button>
                    )}

                    {isDelivered && (
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {lang === 'hi' ? 'काम संपन्न' : 'Completed'}
                      </span>
                    )}

                    {onDeleteOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAdminLoggedIn) {
                            if (onOpenAdminLogin) onOpenAdminLogin();
                            return;
                          }
                          if (
                            confirm(
                              `Admin: Delete service order #${order.tokenNo} (${order.serviceName})?`
                            )
                          ) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer ml-1"
                        title={isAdminLoggedIn ? 'Admin: Delete Order' : 'Admin Login Required to Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add New Service Order */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-900" />
                <span>{lang === 'hi' ? 'नया सेवा आवेदन दर्ज करें' : 'New Service Application'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 mt-4 text-xs sm:text-sm">
              {/* Customer Selector Type */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="custType"
                    checked={custType === 'existing'}
                    onChange={() => setCustType('existing')}
                  />
                  खातेदार ग्राहक (Existing)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="custType"
                    checked={custType === 'new'}
                    onChange={() => {
                      setCustType('new');
                      setSelectedCustId('');
                      setCustName('');
                      setCustPhone('');
                    }}
                  />
                  नया ग्राहक (New)
                </label>
              </div>

              {custType === 'existing' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ग्राहक चुनें *
                  </label>
                  <select
                    required
                    value={selectedCustId}
                    onChange={(e) => handleSelectExistingCustomer(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800"
                  >
                    <option value="">-- ग्राहक चुनें --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.phone} ({c.villageOrWard || 'गाँव'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ग्राहक का नाम *
                    </label>
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="उदा. अमित कुमार"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      मोबाइल नंबर *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* Service Selection from Catalog */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  सीएससी सेवा चुनें (Service) *
                </label>
                <select
                  required
                  value={selectedServiceId}
                  onChange={(e) => handleSelectCatalogItem(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800"
                >
                  <option value="">-- सेवा का चयन करें --</option>
                  {catalog.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameHi} ({item.nameEn}) - दर: ₹{item.defaultCharge}
                    </option>
                  ))}
                </select>
              </div>

              {/* Acknowledgement / Application Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ऑनलाइन रसीद / Ack / Reference Number (यदि उपलब्ध हो)
                </label>
                <input
                  type="text"
                  value={ackNo}
                  onChange={(e) => setAckNo(e.target.value)}
                  placeholder="उदा. NSDL-2026-98124 / फॉर्म आईडी"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                />
              </div>

              {/* Fee Breakdown */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  फीस एवं भुगतान विवरण:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                      सरकारी फीस (Govt)
                    </label>
                    <input
                      type="number"
                      value={govtFee}
                      onChange={(e) => setGovtFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                      ग्राहक कुल चार्ज *
                    </label>
                    <input
                      type="number"
                      required
                      value={totalFee}
                      onChange={(e) => setTotalFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                      जमा प्राप्त राशि *
                    </label>
                    <input
                      type="number"
                      required
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 font-bold">
                  <span className="text-slate-600">
                    दुकान मुनाफा / कमीशन:{' '}
                    <strong className="text-emerald-700">₹{totalFee - govtFee}</strong>
                  </span>
                  <span className="text-rose-600">
                    बकाया:{' '}
                    <strong>₹{Math.max(0, totalFee - paidAmount)}</strong>
                  </span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    भुगतान माध्यम
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  >
                    <option value="cash">नकद (Cash)</option>
                    <option value="upi">ऑनलाइन (UPI/GPay)</option>
                    <option value="due">उधार / बाद में देंगे</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    संभावित डिलीवरी तारीख
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  अतिरिक्त नोट / आवश्यक विवरण
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="उदा. फोटो व साइन स्कैन कर लिया है"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  आवेदन सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: 30+ CSC Services Rate List Drawer */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-blue-900" />
                  <span>सीएससी सेवाएं एवं सरकारी फीस सूची</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  सरकारी फीस, ग्राहक मानक चार्ज एवं आवश्यक दस्तावेज सूची
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-3 pr-1">
              {catalog.map((item) => (
                <div key={item.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{item.nameHi}</p>
                      <p className="text-[11px] text-slate-500">{item.nameEn}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block">
                        चार्ज: ₹{item.defaultCharge}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Govt Fee: ₹{item.defaultGovtFee} | लाभ: ₹{item.defaultCharge - item.defaultGovtFee}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-semibold text-slate-600">
                      आवश्यक दस्तावेज:
                    </span>
                    {item.requiredDocs.map((doc, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200"
                      >
                        {doc}
                      </span>
                    ))}
                    <span className="text-[10px] text-amber-700 font-medium ml-auto">
                      समय: {item.approxDays}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
