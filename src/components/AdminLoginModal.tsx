import React, { useState } from 'react';
import { AdminUser } from '../types';
import { storage } from '../utils/storage';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isAdminLoggedIn,
  onLogout,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'login' | 'change_password'>('login');

  // Change password states
  const [currentPin, setCurrentPin] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const savedCreds = storage.getAdminUser();

    if (
      username.trim().toLowerCase() === savedCreds.username.toLowerCase() &&
      password.trim() === savedCreds.pin
    ) {
      storage.setAdminSession({
        isLoggedIn: true,
        username: savedCreds.username,
        loginTime: new Date().toISOString(),
      });
      onLoginSuccess(savedCreds);
      onClose();
    } else {
      setError('Invalid username or password! Please check credentials.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setChangeSuccess('');

    const savedCreds = storage.getAdminUser();

    if (currentPin !== savedCreds.pin) {
      setError('Current password is incorrect.');
      return;
    }

    if (newPin.length < 4) {
      setError('New password / PIN must be at least 4 characters.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New password and confirm password do not match.');
      return;
    }

    const updatedUser: AdminUser = {
      username: newUsername.trim() || savedCreds.username,
      pin: newPin.trim(),
      name: savedCreds.name,
    };

    storage.setAdminUser(updatedUser);
    setChangeSuccess('Admin credentials updated successfully! You can now log in with the new password.');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAdminLoggedIn ? 'Admin Session Active' : 'Admin Security Login'}
              </h2>
              <p className="text-xs text-blue-200">
                {isAdminLoggedIn
                  ? 'Full centre management unlocked'
                  : 'Enter credentials to access Admin Controls'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isAdminLoggedIn ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    Administrator Status: Logged In
                  </h3>
                  <p className="text-xs text-emerald-700 mt-1">
                    You have administrator rights. You can edit service rates, modify centre profile, delete records, and manage settings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab(activeSubTab === 'change_password' ? 'login' : 'change_password')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-300 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  {activeSubTab === 'change_password' ? 'Back' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-rose-200 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Logout Admin
                </button>
              </div>

              {activeSubTab === 'change_password' && (
                <form onSubmit={handleChangePassword} className="mt-4 space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Update Admin Password / PIN
                  </h4>

                  {error && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {changeSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{changeSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      New Username (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. admin"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter current password"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        New Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Min 4 chars"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Confirm *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Re-type new"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    Save New Password
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="admin-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Password / Security PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password or PIN"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-slate-50 focus:bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Default Credential helper pill */}
              <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-amber-900 text-xs">
                <p className="font-semibold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  Default Admin Login:
                </p>
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono bg-amber-100/70 px-2 py-1 rounded">
                  <span>Username: <strong>admin</strong></span>
                  <span>Password: <strong>admin123</strong></span>
                </div>
                <p className="text-[10px] text-amber-700 mt-1">
                  (You can change this password anytime in settings)
                </p>
              </div>

              <button
                id="btn-submit-admin-login"
                type="submit"
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Login as Administrator
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
