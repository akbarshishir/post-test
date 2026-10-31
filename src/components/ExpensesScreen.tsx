import React, { useState } from 'react';
import { Receipt, Plus, Calendar, CreditCard, Tag } from 'lucide-react';
import { BusinessSettings, Expense, ExpenseCategory, PaymentMethod } from '../types/pos';
import { translations } from '../i18n/translations';
import { formatCurrency, formatDate } from '../services/pdfReceipt';

interface ExpensesScreenProps {
  expenses: Expense[];
  settings: BusinessSettings;
  onRecordExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  expenses,
  settings,
  onRecordExpense,
}) => {
  const t = translations[settings.language];
  const sym = settings.currencySymbol;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('TEA_SNACKS');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  const categoryNames: Record<ExpenseCategory, string> = {
    RENT: t.expenseRent,
    ELECTRICITY_UTILITY: t.expenseElectricity,
    STAFF_SALARY: t.expenseSalary,
    TRANSPORT: t.expenseTransport,
    PACKAGING: t.expensePackaging,
    TEA_SNACKS: t.expenseTeaSnacks,
    REPAIR_MAINTENANCE: t.expenseRepair,
    OTHER: t.expenseOther,
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    onRecordExpense({
      category,
      amount: val,
      paymentMethod,
      notes: notes.trim() || undefined,
      date: Date.now(),
    });

    setAmount('');
    setNotes('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <span>{t.expenses}</span>
            <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
              মোট: {formatCurrency(totalExpenseAmount, sym)}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            দোকান পরিচালনার দৈনিক খরচ, বিদ্যুৎ বিল, ভাড়া ও পরিবহন ব্যয় ট্র্যাকিং
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-750 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">খাত ও বিবরণ</th>
                <th className="py-2.5 px-3">তারিখ ও সময়</th>
                <th className="py-2.5 px-3">মাধ্যম</th>
                <th className="py-2.5 px-3 text-right">পরিমাণ ({sym})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    কোনো খরচের ভাউচার এন্ট্রি নেই
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {categoryNames[exp.category] || exp.category}
                      </div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-400">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {formatDate(exp.date, settings.language === 'bn' ? 'bn-BD' : 'en-US')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-amber-600 dark:text-amber-400">
                      {formatCurrency(exp.amount, sym)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              {t.addExpense}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  খরচের খাত *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                >
                  {Object.entries(categoryNames).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  টাকার পরিমাণ ({sym}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="যেমন: ১৫০"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  পরিশোধ মাধ্যম
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                >
                  <option value="CASH">নগদ (Cash)</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="BANK">ব্যাংক ট্রান্সফার</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  বিবরণ বা ভাউচার নোট
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="যেমন: দোকানের চা-নাস্তা ও ডেলিভারি বিল"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow"
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
