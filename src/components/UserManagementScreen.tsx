import React, { useState, useRef } from 'react';
import { Users, Plus, Camera, Trash2, Edit, CheckCircle, Upload, X } from 'lucide-react';
import { AppUser, UserRole } from '../types/pos';
import { translations } from '../i18n/translations';
import { ConfirmModal } from './FeedbackModal';

interface UserManagementScreenProps {
  users: AppUser[];
  activeUser: AppUser;
  language: 'bn' | 'en';
  onSaveUser: (user: AppUser) => { success: boolean; error?: string };
  onDeleteUser: (userId: string) => { success: boolean; error?: string };
  onSwitchUser: (userId: string) => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  users,
  activeUser,
  language,
  onSaveUser,
  onDeleteUser,
  onSwitchUser,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    id?: string;
    name: string;
    phone: string;
    role: UserRole;
    pin: string;
    active: boolean;
    avatar?: string;
  }>({
    name: '',
    phone: '',
    role: 'SALESMAN',
    pin: '1234',
    active: true,
    avatar: '',
  });

  const roleColors: Record<UserRole, { bg: string; text: string; badge: string }> = {
    ADMIN: { bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-600' },
    MANAGER: { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-600' },
    SALESMAN: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-600' },
    ACCOUNTANT: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-600' },
  };

  const openCreateModal = () => {
    setErrorMsg(null);
    setEditingUser(null);
    setForm({
      id: 'usr-' + Date.now(),
      name: '',
      phone: '',
      role: 'SALESMAN',
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      active: true,
      avatar: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setErrorMsg(null);
    setEditingUser(user);
    setForm({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      pin: user.pin,
      active: user.active,
      avatar: user.avatar || '',
    });
    setIsModalOpen(true);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট (2MB) হতে হবে!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({ ...prev, avatar: event.target?.result as string }));
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg('ইউজারের নাম আবশ্যক!');
      return;
    }
    if (!form.pin || form.pin.length !== 4) {
      setErrorMsg('পিন অবশ্যই ৪ ডিজিটের সংখ্যা হতে হবে!');
      return;
    }

    const userToSave: AppUser = {
      id: editingUser ? editingUser.id : form.id || 'usr-' + Date.now(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      role: form.role,
      pin: form.pin,
      active: form.active,
      avatar: form.avatar?.trim() || undefined,
      createdAt: editingUser ? editingUser.createdAt : Date.now(),
    };

    const res = onSaveUser(userToSave);
    if (res.success) {
      setIsModalOpen(false);
      setEditingUser(null);
    } else {
      setErrorMsg(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const handleDelete = (user: AppUser) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    const res = onDeleteUser(userToDelete.id);
    if (!res.success) {
      setDeleteError(res.error || 'ইউজার মুছতে ব্যর্থ হয়েছে');
    }
    setUserToDelete(null);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>{t.users}</span>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
              {users.length} জন
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ম্যানেজার, সেলসম্যান, এডমিন ও একাউন্টিং স্টাফদের রোল, ছবি ও এক্সেস নিয়ন্ত্রণ
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addUser}</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        {[
          { title: t.admin, desc: t.roleAdminDesc, bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' },
          { title: t.manager, desc: t.roleManagerDesc, bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' },
          { title: t.salesman, desc: t.roleSalesmanDesc, bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' },
          { title: t.accountant, desc: t.roleAccountantDesc, bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' },
        ].map((r, i) => (
          <div key={i} className={`p-2.5 rounded-xl border ${r.bg}`}>
            <span className="font-bold block mb-0.5">{r.title}</span>
            <span className="text-[11px] opacity-90">{r.desc}</span>
          </div>
        ))}
      </div>

      {/* Users List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-750 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">ইউজার প্রোফাইল ও নাম</th>
                <th className="py-2.5 px-3">রোল / পদবী</th>
                <th className="py-2.5 px-3 text-center">পিন কোড</th>
                <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {users.map((user) => {
                const colors = roleColors[user.role];
                const isCurrent = user.id === activeUser.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-purple-500/30 shadow-xs"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white ${colors.badge} shadow-xs`}>
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                                {t.activeUser}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {user.phone || 'ফোন নম্বর নেই'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${colors.bg} ${colors.text}`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {user.pin}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {user.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isCurrent && (
                          <button
                            onClick={() => onSwitchUser(user.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                            title="লগইন / সুইচ করুন"
                          >
                            সুইচ
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                          title="মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up text-slate-900 dark:text-slate-100 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold">
                {editingUser ? t.editUser : t.addUser}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
              {/* Custom Photo Upload Section */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="relative mb-2">
                  {form.avatar ? (
                    <img
                      src={form.avatar}
                      alt="User Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-2xl border-2 border-dashed border-purple-300 dark:border-purple-700">
                      {form.name ? form.name.charAt(0) : <Camera className="w-6 h-6" />}
                    </div>
                  )}

                  {form.avatar && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, avatar: '' })}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow hover:bg-rose-700"
                      title="ছবি মুছুন"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-purple-600" />
                    <span>{form.avatar ? 'ছবি পরিবর্তন' : 'কাস্টম ছবি দিন'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1">PNG, JPG বা WebP (সর্বোচ্চ 2MB)</span>
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  স্টাফ / ইউজারের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="যেমন: মোঃ তানভীর"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01712-XXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  ইউজার রোল / পদবী *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="ADMIN">এডমিন (Admin - সর্বময় ক্ষমতা)</option>
                  <option value="MANAGER">ম্যানেজার (Manager - পণ্য, বিক্রয় ও রিপোর্ট)</option>
                  <option value="SALESMAN">সেলসম্যান (Salesman - শুধু ক্যাশ কাউন্টার বিক্রয়)</option>
                  <option value="ACCOUNTANT">অ্যাকাউন্ট্যান্ট (Accountant - হিসাব ও খরচ অডিট)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  ৪ ডিজিটের সিকিউরিটি পিন (PIN) *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })}
                  placeholder="1234"
                  className="w-full text-center tracking-widest px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-sm font-bold"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="text-slate-700 dark:text-slate-300">ইউজার সক্রিয় থাকবে</span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        title="ইউজার অ্যাকাউন্ট মুছুন"
        message={`আপনি কি নিশ্চিত "${userToDelete?.name}" ইউজারটি মুছে ফেলতে চান? এই ইউজারের লগইন এবং পিন নিষ্ক্রিয় হয়ে যাবে।`}
        confirmText="মুছে ফেলুন"
        cancelText="বাতিল"
        tone="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />

      {/* Delete Error Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteError)}
        title="মুছে ফেলা যায়নি"
        message={deleteError || ''}
        confirmText="ঠিক আছে"
        cancelText=""
        tone="warning"
        onConfirm={() => setDeleteError(null)}
        onCancel={() => setDeleteError(null)}
      />
    </div>
  );
};
