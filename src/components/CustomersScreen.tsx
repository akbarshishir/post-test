import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  FileText,
  BadgeCent,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { BusinessSettings, Customer, CustomerLedgerEntry } from '../types/pos';
import { translations } from '../i18n/translations';
import { formatCurrency, formatDate } from '../services/pdfReceipt';

interface CustomersScreenProps {
  customers: Customer[];
  ledger: CustomerLedgerEntry[];
  settings: BusinessSettings;
  onSaveCustomer: (customer: Customer) => void;
  onRecordPayment: (data: { customerId: string; amount: number; note: string }) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  ledger,
  settings,
  onSaveCustomer,
  onRecordPayment,
}) => {
  const t = translations[settings.language];
  const sym = settings.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Customer Form
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);

  const customerLedgerEntries = useMemo(() => {
    if (!selectedCustomer) return [];
    return ledger.filter((l) => l.customerId === selectedCustomer.id);
  }, [selectedCustomer, ledger]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim()) return;

    onSaveCustomer({
      id: 'cust-' + Date.now(),
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      address: customerForm.address.trim() || undefined,
      notes: customerForm.notes.trim() || undefined,
      totalBalanceDue: 0,
      createdAt: Date.now(),
    });

    setCustomerForm({ name: '', phone: '', address: '', notes: '' });
    setIsAddCustomerOpen(false);
  };

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;

    onRecordPayment({
      customerId: selectedCustomer.id,
      amount,
      note: paymentNote.trim() || 'নগদ বাকি আদায়',
    });

    setPaymentAmount('');
    setPaymentNote('');
    setIsPaymentModalOpen(false);

    // Update locally selected customer state
    const updated = {
      ...selectedCustomer,
      totalBalanceDue: Math.max(0, selectedCustomer.totalBalanceDue - amount),
    };
    setSelectedCustomer(updated);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>{t.customers}</span>
            <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-mono text-slate-600 dark:text-slate-300">
              {customers.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            গ্রাহক তালিকা, বকেয়া পাওনা ও বাকির খাতার বিস্তারিত অডিট ট্রেইল
          </p>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCustomer}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="গ্রাহকের নাম, মোবাইল নম্বর বা ঠিকানা খুঁজুন..."
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* Customers List & Due Summary Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {searchTerm ? 'কোনো গ্রাহক খুঁজে পাওয়া যায়নি' : 'গ্রাহক তালিকা খালি'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {searchTerm
              ? `‘${searchTerm}’ মোবাইল নম্বর বা নামের সাথে কোনো গ্রাহক মিলছে না।`
              : 'দোকানের নিয়মিত খদ্দের বা বাকি খাতার গ্রাহকদের তালিকা সংরক্ষণ করতে যোগ করুন।'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                অনুসন্ধান মুছুন
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addCustomer}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCustomers.map((customer) => {
            const hasDue = customer.totalBalanceDue > 0;

            return (
              <div
                key={customer.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-xs flex flex-col justify-between hover:border-blue-400 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {customer.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        hasDue
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {hasDue ? `বাকি: ${formatCurrency(customer.totalBalanceDue, sym)}` : 'বাকি নেই'}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>বাকির খাতা</span>
                  </button>

                  {hasDue && (
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setPaymentAmount(customer.totalBalanceDue.toString());
                        setIsPaymentModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs"
                    >
                      <BadgeCent className="w-3.5 h-3.5" />
                      <span>টাকা আদায়</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Ledger History Modal */}
      {selectedCustomer && !isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedCustomer.name} - বাকির খাতা
                </h3>
                <span className="text-xs text-slate-500">
                  মোবাইল: {selectedCustomer.phone} | বর্তমান বাকি:{' '}
                  <b className="text-rose-600">{formatCurrency(selectedCustomer.totalBalanceDue, sym)}</b>
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {selectedCustomer.totalBalanceDue > 0 && (
              <button
                onClick={() => {
                  setPaymentAmount(selectedCustomer.totalBalanceDue.toString());
                  setIsPaymentModalOpen(true);
                }}
                className="w-full mb-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5"
              >
                <BadgeCent className="w-4 h-4" />
                <span>বাকি টাকা পরিশোধ লিপিবদ্ধ করুন</span>
              </button>
            )}

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">
                লেনদেনের সময়কাল ও পরিবর্তন ইতিহাস:
              </h4>
              {customerLedgerEntries.length === 0 ? (
                <p className="text-center py-6 text-slate-400">কোনো লেনদেন রেকর্ড পাওয়া যায়নি</p>
              ) : (
                customerLedgerEntries.map((entry) => {
                  const isSale = entry.type === 'CREDIT_SALE';
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSale ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {isSale ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {entry.note}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatDate(entry.createdAt, settings.language === 'bn' ? 'bn-BD' : 'en-US')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-bold font-mono text-xs ${
                            isSale ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isSale ? `+${formatCurrency(entry.amount, sym)}` : `-${formatCurrency(entry.amount, sym)}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ব্যালেন্স: {formatCurrency(entry.newBalance, sym)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              বাকি আদায় গ্রহণ
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              গ্রাহক: {selectedCustomer.name} (বর্তমান বাকি: {formatCurrency(selectedCustomer.totalBalanceDue, sym)})
            </p>

            <form onSubmit={handleRepaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  গৃহীত টাকার পরিমাণ ({sym}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedCustomer.totalBalanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  মন্তব্য / রসিদ নম্বর
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="যেমন: নগদ পরিশোধ / ক্যাশ কাউন্টার"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow"
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              {t.addCustomer}
            </h3>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  গ্রাহকের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="01712-XXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  ঠিকানা
                </label>
                <input
                  type="text"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="বাড়ি/দোকান ঠিকানা"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  মন্তব্য / নোট
                </label>
                <textarea
                  rows={2}
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  placeholder="গ্রাহক সম্পর্কে যেকোনো অতিরিক্ত তথ্য"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
