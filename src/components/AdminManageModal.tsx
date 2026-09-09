import React, { useState } from 'react';
import { CSCProfile, ServiceCatalogItem, Customer, ServiceOrder, CashEntry, LedgerTransaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { storage } from '../utils/storage';
import {
  ShieldCheck,
  Building2,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  KeyRound,
  X,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  QrCode,
  Layers,
  Lock,
} from 'lucide-react';

interface AdminManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CSCProfile;
  onUpdateProfile: (profile: CSCProfile) => void;
  serviceCatalog: ServiceCatalogItem[];
  onUpdateServiceCatalog: (catalog: ServiceCatalogItem[]) => void;
  customers: Customer[];
  ledgerTxns: LedgerTransaction[];
  cashEntries: CashEntry[];
  serviceOrders: ServiceOrder[];
  onResetAllData: () => void;
  onLogoutAdmin: () => void;
}

export const AdminManageModal: React.FC<AdminManageModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  serviceCatalog,
  onUpdateServiceCatalog,
  customers,
  ledgerTxns,
  cashEntries,
  serviceOrders,
  onResetAllData,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'profile' | 'security' | 'data'>('catalog');

  // Service Catalog state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editGovtFee, setEditGovtFee] = useState<number>(0);
  const [isAddingService, setIsAddingService] = useState(false);

  // New Service Form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<ServiceCatalogItem['category']>('identity');
  const [newServiceGovtFee, setNewServiceGovtFee] = useState<number>(0);
  const [newServiceCharge, setNewServiceCharge] = useState<number>(100);
  const [newServiceDocs, setNewServiceDocs] = useState<string>('Aadhaar Card, Mobile Number');
  const [newServiceDays, setNewServiceDays] = useState('3-5 Days');

  // Profile Form state
  const [profileForm, setProfileForm] = useState<CSCProfile>({ ...profile });
  const [profileSaved, setProfileSaved] = useState(false);

  // Security Credentials state
  const currentAdmin = storage.getAdminUser();
  const [adminUsername, setAdminUsername] = useState(currentAdmin.username);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Reset confirmation state
  const [resetConfirm, setResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter catalog items
  const filteredCatalog = serviceCatalog.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.nameEn.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (item.nameHi && item.nameHi.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Handle Save Edited Price
  const handleSavePrice = (serviceId: string) => {
    const updated = serviceCatalog.map((s) => {
      if (s.id === serviceId) {
        return {
          ...s,
          defaultCharge: Number(editPrice),
          defaultGovtFee: Number(editGovtFee),
        };
      }
      return s;
    });
    onUpdateServiceCatalog(updated);
    setEditingServiceId(null);
  };

  // Handle Add New Service
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newService: ServiceCatalogItem = {
      id: `custom-${Date.now()}`,
      nameEn: newServiceName.trim(),
      nameHi: newServiceName.trim(),
      category: newServiceCategory,
      defaultGovtFee: Number(newServiceGovtFee) || 0,
      defaultCharge: Number(newServiceCharge) || 0,
      requiredDocs: newServiceDocs.split(',').map((d) => d.trim()).filter(Boolean),
      approxDays: newServiceDays.trim() || '2-5 Days',
    };

    const updated = [newService, ...serviceCatalog];
    onUpdateServiceCatalog(updated);

    // Reset form
    setNewServiceName('');
    setNewServiceGovtFee(0);
    setNewServiceCharge(100);
    setIsAddingService(false);
  };

  // Handle Delete Service
  const handleDeleteService = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service from the catalog?')) {
      const updated = serviceCatalog.filter((s) => s.id !== serviceId);
      onUpdateServiceCatalog(updated);
    }
  };

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Handle Security Password Update
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    const saved = storage.getAdminUser();
    if (currentPin !== saved.pin) {
      setSecurityMessage({ text: 'Current password does not match.', type: 'error' });
      return;
    }
    if (newPin.length < 4) {
      setSecurityMessage({ text: 'New password must be at least 4 characters.', type: 'error' });
      return;
    }
    if (newPin !== confirmPin) {
      setSecurityMessage({ text: 'New password and confirmation do not match.', type: 'error' });
      return;
    }

    storage.setAdminUser({
      username: adminUsername.trim() || saved.username,
      pin: newPin.trim(),
      name: saved.name,
    });

    setSecurityMessage({ text: 'Admin credentials updated successfully!', type: 'success' });
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  // Handle JSON Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const ok = storage.importBackup(content);
        if (ok) {
          setImportStatus('Backup restored successfully! Refreshing view...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setImportStatus('Invalid backup file structure.');
        }
      } catch (err) {
        setImportStatus('Failed to read file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Banner Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Admin Management Control</h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-semibold">
                  Administrator Active
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Manage Service Rates, Centre Profile, System Data & Security
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onLogoutAdmin();
                onClose();
              }}
              className="text-xs font-semibold px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg transition-colors cursor-pointer"
            >
              Logout Admin
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto shrink-0 gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-950 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Service Rates & Catalog ({serviceCatalog.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-950 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Centre Profile & VLE Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-950 hover:bg-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Admin Security & Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'data'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-950 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Backup & Data Maintenance
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* TAB 1: SERVICE RATES & CATALOG MANAGER */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search service name to edit rate..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Filter Categories */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-hidden"
                  >
                    <option value="all">All Categories</option>
                    <option value="identity">Identity & Cards (PAN, Aadhaar, Voter)</option>
                    <option value="certificates">Certificates (Caste, Income, Domicile)</option>
                    <option value="schemes">Government Schemes (PM Kisan, Shramik)</option>
                    <option value="bills">Utility Bills & Fastag</option>
                    <option value="banking">AEPS & Financial Services</option>
                    <option value="printing">Photo & Printing Services</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsAddingService(!isAddingService)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Service
                  </button>
                </div>
              </div>

              {/* Add New Service Collapsible Form */}
              {isAddingService && (
                <form
                  onSubmit={handleCreateService}
                  className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-3 animate-in fade-in"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-700" />
                    Add New Service to Catalog
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Service Name (English) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Police Character Certificate"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newServiceCategory}
                        onChange={(e) => setNewServiceCategory(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                      >
                        <option value="identity">Identity & Cards</option>
                        <option value="certificates">Certificates</option>
                        <option value="schemes">Government Schemes</option>
                        <option value="bills">Utility Bills</option>
                        <option value="banking">Banking & Finance</option>
                        <option value="printing">Photo & Printing</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Govt Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newServiceGovtFee}
                        onChange={(e) => setNewServiceGovtFee(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Customer Charge / Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={newServiceCharge}
                        onChange={(e) => setNewServiceCharge(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden font-bold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Delivery Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 3-5 Days"
                        value={newServiceDays}
                        onChange={(e) => setNewServiceDays(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Required Documents
                      </label>
                      <input
                        type="text"
                        placeholder="Aadhaar, Photo, etc."
                        value={newServiceDocs}
                        onChange={(e) => setNewServiceDocs(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingService(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Save Service
                    </button>
                  </div>
                </form>
              )}

              {/* Service Catalog List Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Service Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Govt Fee</th>
                        <th className="py-2.5 px-3 text-right">Customer Price</th>
                        <th className="py-2.5 px-3">Required Documents</th>
                        <th className="py-2.5 px-3 text-center">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCatalog.map((service) => {
                        const isEditing = editingServiceId === service.id;
                        return (
                          <tr key={service.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-900 block">{service.nameEn}</span>
                              {service.nameHi && (
                                <span className="text-[11px] text-slate-500 block">{service.nameHi}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium uppercase">
                                {service.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={editGovtFee}
                                  onChange={(e) => setEditGovtFee(Number(e.target.value))}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-xs"
                                />
                              ) : (
                                <span className="text-slate-600">{formatCurrency(service.defaultGovtFee)}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(Number(e.target.value))}
                                  className="w-20 px-2 py-1 border border-blue-400 bg-blue-50 rounded text-xs text-right font-bold text-blue-900"
                                />
                              ) : (
                                <span className="text-blue-950 font-bold">
                                  {formatCurrency(service.defaultCharge)}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate text-[11px]">
                              {service.requiredDocs.join(', ')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSavePrice(service.id)}
                                    className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                    title="Save Price"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingServiceId(null)}
                                    className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingServiceId(service.id);
                                      setEditPrice(service.defaultCharge);
                                      setEditGovtFee(service.defaultGovtFee);
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                    title="Edit Price"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteService(service.id)}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                                    title="Delete Service"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CENTRE PROFILE & VLE SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">CSC Centre Profile Information</h3>
                    <p className="text-xs text-slate-500">
                      These details appear on printed cash receipts, WhatsApp bills, and portal headers.
                    </p>
                  </div>
                  {profileSaved && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> Changes Saved!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Centre Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.centreName}
                      onChange={(e) => setProfileForm({ ...profileForm, centreName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      VLE Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.vleName}
                      onChange={(e) => setProfileForm({ ...profileForm, vleName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CSC ID / Center Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.cscId}
                      onChange={(e) => setProfileForm({ ...profileForm, cscId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number (WhatsApp) *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.mobile}
                      onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI ID for QR Code & Payments *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.upiId}
                      onChange={(e) => setProfileForm({ ...profileForm, upiId: e.target.value })}
                      placeholder="e.g. cscdigitalseva@upi"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono text-blue-900 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-800 mb-2">Centre Location & Address</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Street Address / Landmark
                      </label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">District</label>
                      <input
                        type="text"
                        value={profileForm.district}
                        onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">State</label>
                      <input
                        type="text"
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Pin Code</label>
                      <input
                        type="text"
                        value={profileForm.pinCode}
                        onChange={(e) => setProfileForm({ ...profileForm, pinCode: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Centre Profile
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: ADMIN SECURITY & PASSWORDS */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <form onSubmit={handleUpdatePassword} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Change Admin Login Credentials</h3>
                    <p className="text-xs text-slate-500">
                      Configure username and security PIN used to log in as administrator.
                    </p>
                  </div>
                </div>

                {securityMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      securityMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {securityMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{securityMessage.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password / PIN *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password (default: admin123)"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password / PIN *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 4 characters"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-type new password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Update Admin Password
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: BACKUP, RESTORE & DATA MAINTENANCE */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Total Customers</span>
                  <span className="text-lg font-bold text-slate-900">{customers.length}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Ledger Records</span>
                  <span className="text-lg font-bold text-slate-900">{ledgerTxns.length}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Cashbook Entries</span>
                  <span className="text-lg font-bold text-slate-900">{cashEntries.length}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Service Applications</span>
                  <span className="text-lg font-bold text-slate-900">{serviceOrders.length}</span>
                </div>
              </div>

              {/* Backup & Export Box */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Backup & Restore Centre Data</h3>
                <p className="text-xs text-slate-500">
                  All data is stored locally in your browser. Download a backup file regularly to ensure your records are never lost.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={storage.exportAllBackup}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Full JSON Backup
                  </button>

                  <label className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-blue-700" />
                    <span>Upload & Restore Backup</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus && (
                  <p className="text-xs font-semibold text-blue-700 mt-2">{importStatus}</p>
                )}
              </div>

              {/* Danger Zone: Factory Reset */}
              <div className="bg-rose-50/70 border border-rose-200 p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h4 className="text-sm font-bold">Danger Zone: Factory Reset</h4>
                </div>
                <p className="text-xs text-rose-800">
                  Resetting will wipe all custom ledger transactions, orders, and cash records, and reload the initial demo data.
                </p>

                {resetConfirm ? (
                  <div className="p-3 bg-white rounded-lg border border-rose-300 space-y-2">
                    <p className="text-xs font-bold text-rose-700">
                      Are you sure? This cannot be undone unless you have a JSON backup!
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetAllData();
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Yes, Wipe & Reset Everything
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetConfirm(false)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResetConfirm(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Portal Data
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
