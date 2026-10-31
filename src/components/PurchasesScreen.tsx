import React, { useState } from 'react';
import { Truck, Plus, PackageCheck, Building2, Phone } from 'lucide-react';
import { BusinessSettings, Product, Purchase, Supplier } from '../types/pos';
import { translations } from '../i18n/translations';
import { formatCurrency, formatDate } from '../services/pdfReceipt';

interface PurchasesScreenProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  products: Product[];
  settings: BusinessSettings;
  onSaveSupplier: (supplier: Supplier) => void;
  onExecutePurchase: (purchaseData: any) => { success: boolean };
}

export const PurchasesScreen: React.FC<PurchasesScreenProps> = ({
  suppliers,
  purchases,
  products,
  settings,
  onSaveSupplier,
  onExecutePurchase,
}) => {
  const t = translations[settings.language];
  const sym = settings.currencySymbol;

  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    address: '',
  });

  // Purchase Form
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseUnitCost, setPurchaseUnitCost] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [purchaseNote, setPurchaseNote] = useState('');

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim() || !supplierForm.phone.trim()) return;

    onSaveSupplier({
      id: 'supp-' + Date.now(),
      name: supplierForm.name.trim(),
      companyName: supplierForm.companyName.trim() || supplierForm.name.trim(),
      phone: supplierForm.phone.trim(),
      address: supplierForm.address.trim() || undefined,
      totalPayableDue: 0,
      createdAt: Date.now(),
    });

    setSupplierForm({ name: '', companyName: '', phone: '', address: '' });
    setIsAddSupplierOpen(false);
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(purchaseQty);
    const cost = parseFloat(purchaseUnitCost);
    if (!qty || qty <= 0 || !cost || cost <= 0) return;

    const prod = products.find((p) => p.id === selectedProductId);
    const supp = suppliers.find((s) => s.id === selectedSupplierId);
    if (!prod || !supp) return;

    const lineTotal = qty * cost;
    const paid = Math.min(lineTotal, parseFloat(paidAmount) || 0);
    const balanceDue = Math.max(0, lineTotal - paid);

    onExecutePurchase({
      purchaseBillNumber: `BILL-${Date.now().toString().slice(-6)}`,
      supplierId: supp.id,
      supplierName: supp.companyName || supp.name,
      totalAmount: lineTotal,
      paidAmount: paid,
      balanceDue,
      paymentMethod: paid >= lineTotal ? 'CASH' : paid > 0 ? 'CASH' : 'CREDIT',
      notes: purchaseNote.trim() || undefined,
      items: [
        {
          id: 'pitem-' + Date.now(),
          purchaseId: '',
          productId: prod.id,
          productName: prod.nameBn || prod.name,
          quantity: qty,
          unitCost: cost,
          lineTotal,
        },
      ],
    });

    setPurchaseQty('');
    setPurchaseUnitCost('');
    setPaidAmount('');
    setPurchaseNote('');
    setIsAddPurchaseOpen(false);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <span>{t.purchases}</span>
          </h2>
          <p className="text-xs text-slate-500">
            মালামাল ক্রয় ভাউচার, স্টক বৃদ্ধি এবং মহাজন/ডিলারদের বকেয়া পাওনা হিসাব
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-750 dark:text-slate-200 rounded-xl text-xs font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>সাপ্লায়ার যোগ</span>
          </button>
          <button
            onClick={() => setIsAddPurchaseOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ক্রয় এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* Switcher Tab */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-1 text-xs">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-2 px-3 font-semibold transition border-b-2 ${
            activeTab === 'purchases'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ক্রয় চালান তালিকা ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-2 px-3 font-semibold transition border-b-2 ${
            activeTab === 'suppliers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          সাপ্লায়ার ও মহাজন ({suppliers.length})
        </button>
      </div>

      {activeTab === 'purchases' ? (
        /* Purchase Invoices List */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-750 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">বিল নম্বর ও সাপ্লায়ার</th>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3 text-right">মোট ক্রয়</th>
                  <th className="py-2.5 px-3 text-right">পরিশোধ</th>
                  <th className="py-2.5 px-3 text-right">বাকি (Due)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      কোনো ক্রয় ইনভয়েস এন্ট্রি পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50">
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {p.purchaseBillNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">{p.supplierName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {formatDate(p.createdAt, settings.language === 'bn' ? 'bn-BD' : 'en-US')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.totalAmount, sym)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                        {formatCurrency(p.paidAmount, sym)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        {p.balanceDue > 0 ? formatCurrency(p.balanceDue, sym) : '০'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Suppliers List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {s.companyName}
                    </h4>
                    <span className="text-xs text-slate-500 block">{s.name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.totalPayableDue > 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    পাওনা: {formatCurrency(s.totalPayableDue, sym)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Purchase Modal */}
      {isAddPurchaseOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              নতুন স্টক ক্রয় ভাউচার
            </h3>
            <p className="text-xs text-blue-600 mb-3">{t.purchaseCostInfo}</p>

            <form onSubmit={handlePurchaseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  সাপ্লায়ার / মহাজন *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} ({s.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  পণ্য নির্বাচন *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) setPurchaseUnitCost(p.purchasePrice.toString());
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {settings.language === 'bn' ? p.nameBn : p.name} (বর্তমান স্টক: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    ক্রয় পরিমাণ *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    placeholder="পরিমাণ"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    একক ক্রয়মূল্য ({sym}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    value={purchaseUnitCost}
                    onChange={(e) => setPurchaseUnitCost(e.target.value)}
                    placeholder="দর"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  পরিশোধকৃত টাকা ({sym})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="নগদে পরিশোধ"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow"
                >
                  স্টকে যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              নতুন সাপ্লায়ার / ডিলার
            </h3>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  কোম্পানি বা প্রতিষ্ঠানের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={supplierForm.companyName}
                  onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })}
                  placeholder="যেমন: প্রাণ ডিস্ট্রিবিউশন"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  প্রতিনিধি / ব্যক্তির নাম *
                </label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="যেমন: মোঃ কামরুল ইসলাম"
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
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="01815-XXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow"
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
