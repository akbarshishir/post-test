import React, { useState } from 'react';
import { X, UserCheck, Shield, KeyRound, Check, AlertCircle } from 'lucide-react';
import { AppUser, UserRole } from '../types/pos';
import { translations } from '../i18n/translations';

interface SwitchUserModalProps {
  users: AppUser[];
  activeUser: AppUser;
  language: 'bn' | 'en';
  onSwitchUser: (userId: string) => void;
  onClose: () => void;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({
  users,
  activeUser,
  language,
  onSwitchUser,
  onClose,
}) => {
  const t = translations[language];
  const [selectedUser, setSelectedUser] = useState<AppUser>(activeUser);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roleColors: Record<UserRole, { bg: string; text: string; badge: string }> = {
    ADMIN: { bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-600' },
    MANAGER: { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-600' },
    SALESMAN: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-600' },
    ACCOUNTANT: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-600' },
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return t.admin;
      case 'MANAGER': return t.manager;
      case 'SALESMAN': return t.salesman;
      case 'ACCOUNTANT': return t.accountant;
    }
  };

  const getRoleDesc = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return t.roleAdminDesc;
      case 'MANAGER': return t.roleManagerDesc;
      case 'SALESMAN': return t.roleSalesmanDesc;
      case 'ACCOUNTANT': return t.roleAccountantDesc;
    }
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Verify PIN
    if (selectedUser.pin && pinInput !== selectedUser.pin) {
      setErrorMsg('ভুল পিন কোড! অনুগ্রহ করে সঠিক ৪ ডিজিটের পিন দিন।');
      return;
    }

    onSwitchUser(selectedUser.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base">{t.switchUser}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleConfirmSwitch} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
              স্টাফ বা ইউজার নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
              {users.filter((u) => u.active).map((user) => {
                const isSelected = selectedUser.id === user.id;
                const colors = roleColors[user.role];

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user);
                      setPinInput('');
                      setErrorMsg(null);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white ${colors.badge}`}>
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {user.id === activeUser.id && (
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-normal">
                              বর্তমান
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {getRoleLabel(user.role)} • পিন: {user.pin}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        {user.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role permissions info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
              {getRoleLabel(selectedUser.role)} অধিকার:
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              {getRoleDesc(selectedUser.role)}
            </span>
          </div>

          {/* PIN Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                <span>{selectedUser.name} এর ৪ ডিজিটের পিন লিখুন:</span>
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                (ডেমো পিন: {selectedUser.pin})
              </span>
            </div>
            <input
              type="password"
              maxLength={4}
              required
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-lg tracking-widest px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>ইউজার পরিবর্তন করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
