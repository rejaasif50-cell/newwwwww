import React, { useState, useRef } from 'react';
import { CSCProfile, Language } from '../types';
import { storage } from '../utils/storage';
import {
  Settings,
  X,
  Building2,
  Phone,
  QrCode,
  Download,
  Upload,
  RotateCcw,
  Globe,
  Github,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ProfileSettingsModalProps {
  profile: CSCProfile;
  lang: Language;
  onClose: () => void;
  onSaveProfile: (profile: CSCProfile) => void;
  onResetAllData: () => void;
  onReloadAfterImport: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  profile,
  lang,
  onClose,
  onSaveProfile,
  onResetAllData,
  onReloadAfterImport,
}) => {
  const [formData, setFormData] = useState<CSCProfile>({ ...profile });
  const [activeTab, setActiveTab] = useState<'profile' | 'backup' | 'github'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportBackup = () => {
    storage.exportAllBackup();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importBackup(content);
      if (success) {
        alert('डेटा सफलतापूर्वक रिस्टोर हो गया है! (Data Restored Successfully)');
        onReloadAfterImport();
        onClose();
      } else {
        alert('अमान्य बैकअप फाइल। (Invalid JSON file)');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-900" />
            <span>
              {lang === 'hi'
                ? 'सीएससी केंद्र सेटिंग्स व बैकअप'
                : 'Centre Settings & Backup'}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl my-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-blue-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'दुकान व VLE प्रोफाइल' : 'Profile'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'github'
                ? 'bg-white text-blue-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? '🚀 GitHub Live गाइड' : 'GitHub Live'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white text-blue-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'डेटा बैकअप व रीसेट' : 'Backup & Reset'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  सीएससी केंद्र का नाम (English) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.centreName}
                  onChange={(e) => setFormData({ ...formData, centreName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  सीएससी केंद्र का नाम (हिन्दी)
                </label>
                <input
                  type="text"
                  value={formData.centreNameHindi || ''}
                  onChange={(e) => setFormData({ ...formData, centreNameHindi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    VLE / ऑपरेटर का नाम *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vleName}
                    onChange={(e) => setFormData({ ...formData, vleName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    सीएससी आईडी (CSC ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cscId}
                    onChange={(e) => setFormData({ ...formData, cscId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मोबाइल नंबर (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ईमेल आईडी
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  दुकान का पता (Street / Landmark)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">जिला (District)</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">राज्य (State)</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पिन कोड (PIN)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* UPI & Payment Info */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-700" />
                  दुकान का UPI ID (रसीद पर QR कोड हेतु):
                </span>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  placeholder="उदा. 9876543210@paytm / name@okaxis"
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white font-mono font-bold text-slate-900 text-xs"
                />
                <p className="text-[10px] text-amber-800">
                  यह UPI ID ग्राहक की रसीद और WhatsApp तगादा मैसेज में स्वतः जुड़ जाती है।
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    सुरक्षित हो गया!
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  प्रोफाइल सुरक्षित करें
                </button>
              </div>
            </form>
          )}

          {activeTab === 'github' && (
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-1">
                  <Github className="w-4 h-4" />
                  <span>GitHub Pages पर Live करने की गाइड (100% Free)</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  यह वेबसाइट पूरी तरह से <strong>क्लाइंट-साइड (Static SPA)</strong> है। किसी सर्वर या डेटाबेस की आवश्यकता नहीं है। इसे GitHub Pages पर बिना किसी शुल्क के हमेशा के लिए लाइव चलाया जा सकता है!
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">
                  कदम 1: GitHub पर कोड अपलोड करें
                </h4>
                <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1">
                  <p>git init</p>
                  <p>git add .</p>
                  <p>git commit -m "CSC Digital Seva Portal"</p>
                  <p>git remote add origin https://github.com/YOUR_USERNAME/csc-portal.git</p>
                  <p>git push -u origin main</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">
                  कदम 2: GitHub Pages चालू करें
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <li>अपने GitHub रिपॉजिटरी में <strong>Settings</strong> टैब पर जाएं।</li>
                  <li>बाईं ओर मेनू में <strong>Pages</strong> पर क्लिक करें।</li>
                  <li>Build and deployment में <strong>GitHub Actions</strong> चुनें (या `npm run build` करके `dist` फोल्डर को डिप्लॉय करें)।</li>
                  <li>बस! 1 मिनट में आपकी वेबसाइट <code className="bg-slate-200 px-1 py-0.5 rounded text-blue-900 font-mono">https://YOUR_USERNAME.github.io/csc-portal</code> पर मोबाइल और कंप्यूटर दोनों पर लाइव हो जाएगी!</li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px]">
                <p className="font-bold">🔒 डेटा सुरक्षा (Data Privacy):</p>
                <p className="mt-0.5">
                  आपका सभी खाता बही, रोकड़ और ग्राहकों का डेटा आपके मोबाइल/ब्राउज़र की <strong>लोकल मेमोरी (LocalStorage)</strong> में सुरक्षित रहता है। नीचे दिए गए बैकअप बटन से जब चाहें संपूर्ण डेटा अपने फोन या कंप्यूटर में डाउनलोड कर सकते हैं।
                </p>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs">
              {/* Export Backup Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">
                    1. संपूर्ण डेटा बैकअप डाउनलोड करें
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ग्राहकों का खाता, रोकड़ बही, आवेदन सूची और सेटिंग्स की JSON फाइल डाउनलोड करें।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-2 font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>डाउनलोड</span>
                </button>
              </div>

              {/* Import Backup Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">
                    2. बैकअप फाइल से रिस्टोर करें
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    पूर्व में डाउनलोड की गई JSON बैकअप फाइल को अपलोड करके डेटा वापस लाएं।
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-700" />
                    <span>अपलोड</span>
                  </button>
                </div>
              </div>

              {/* Reset to Demo Data Card */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-rose-800">
                    3. डिफ़ॉल्ट डेमो डेटा पर रीसेट करें
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    सभी मौजूदा डेटा हटाकर मूल डेमो डेटा वापस लोड करें।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('क्या आप वाकई सारा डेटा रीसेट करके डेमो डेटा लोड करना चाहते हैं?')) {
                      onResetAllData();
                      onClose();
                    }
                  }}
                  className="px-3 py-2 font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>रीसेट</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
