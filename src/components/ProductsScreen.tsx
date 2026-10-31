import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  History,
  SlidersHorizontal,
  Package,
  PackageSearch,
  RotateCcw,
} from 'lucide-react';
import { BusinessSettings, Category, Product, StockAdjustment } from '../types/pos';
import { translations } from '../i18n/translations';
import { formatCurrency, formatDate } from '../services/pdfReceipt';
import { ConfirmModal } from './FeedbackModal';

interface ProductsScreenProps {
  products: Product[];
  categories: Category[];
  stockMovements: StockAdjustment[];
  settings: BusinessSettings;
  onSaveProduct: (product: Product) => { success: boolean; error?: string };
  onDeleteProduct: (id: string) => { success: boolean; error?: string };
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({
  products,
  categories,
  stockMovements,
  settings,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const t = translations[settings.language];
  const sym = settings.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeStockProduct, setActiveStockProduct] = useState<Product | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [actionErrorModal, setActionErrorModal] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    nameBn: '',
    sku: '',
    barcode: '',
    categoryId: categories[0]?.id || 'cat-1',
    purchasePrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 5,
    unit: 'পিস (Pcs)',
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nameBn.includes(searchTerm) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const openCreateModal = () => {
    setErrorNotice(null);
    setEditingProduct(null);
    setFormData({
      id: 'prod-' + Date.now(),
      name: '',
      nameBn: '',
      sku: 'PRD-' + Math.floor(1000 + Math.random() * 9000),
      barcode: '',
      categoryId: categories[0]?.id || 'cat-1',
      purchasePrice: 0,
      sellingPrice: 0,
      stockQuantity: 10,
      lowStockThreshold: 5,
      unit: 'পিস (Pcs)',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setErrorNotice(null);
    setEditingProduct(product);
    setFormData({ ...product });
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() && !formData.nameBn?.trim()) {
      setErrorNotice('পণ্যের নাম আবশ্যক!');
      return;
    }

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : formData.id || 'prod-' + Date.now(),
      name: formData.name || formData.nameBn || '',
      nameBn: formData.nameBn || formData.name || '',
      sku: formData.sku?.trim() || 'SKU-' + Date.now().toString().slice(-4),
      barcode: formData.barcode?.trim() || undefined,
      categoryId: formData.categoryId || categories[0]?.id || 'cat-1',
      purchasePrice: Number(formData.purchasePrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      stockQuantity: Number(formData.stockQuantity) || 0,
      lowStockThreshold: Number(formData.lowStockThreshold) || 5,
      unit: formData.unit || 'পিস (Pcs)',
      createdAt: editingProduct ? editingProduct.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    const res = onSaveProduct(productToSave);
    if (res.success) {
      setIsAddModalOpen(false);
      setEditingProduct(null);
    } else {
      setErrorNotice(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;
    const res = onDeleteProduct(productToDelete.id);
    if (!res.success) {
      setActionErrorModal(res.error || t.cannotDeleteWithSales);
    }
    setProductToDelete(null);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>{t.products}</span>
            <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-mono text-slate-600 dark:text-slate-300">
              {products.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            মজুদ পণ্য তালিকা, ক্রয়-বিক্রয় দর এবং স্টক সতর্কতা ব্যবস্থাপনা
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addProduct}</span>
        </button>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchProductPlaceholder}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 shadow-xs"
        >
          <option value="all">{t.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {settings.language === 'bn' ? c.nameBn : c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table / List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
              <PackageSearch className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {searchTerm || selectedCategory !== 'all'
                ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি'
                : 'ইনভেন্টরিতে কোনো পণ্য নেই'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {searchTerm || selectedCategory !== 'all'
                ? 'আপনার অনুসন্ধান বা নির্বাচিত ক্যাটাগরির সাথে মিলে এমন কোনো পণ্য পাওয়া যায়নি।'
                : 'আপনার দোকানের পণ্য বা আইটেম যোগ করে স্টক ও মূল্য ব্যবস্থাপনা শুরু করুন।'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ফিল্টার মুছুন</span>
                </button>
              )}
              <button
                type="button"
                onClick={openCreateModal}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন পণ্য যোগ করুন</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-750 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">পণ্য ও SKU</th>
                  <th className="py-2.5 px-3">ক্যাটাগরি</th>
                  <th className="py-2.5 px-3 text-right">ক্রয় মূল্য</th>
                  <th className="py-2.5 px-3 text-right">বিক্রয় মূল্য</th>
                  <th className="py-2.5 px-3 text-center">বর্তমান স্টক</th>
                  <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const isLowStock = p.stockQuantity <= p.lowStockThreshold;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {settings.language === 'bn' ? p.nameBn : p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>SKU: {p.sku}</span>
                          {p.barcode && <span>বারকোড: {p.barcode}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[11px]">
                          {settings.language === 'bn' ? cat?.nameBn : cat?.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-600 dark:text-slate-300">
                        {formatCurrency(p.purchasePrice, sym)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(p.sellingPrice, sym)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            isLowStock
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3" />}
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActiveStockProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="স্টক হিস্ট্রি"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="সম্পাদনা"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto animate-scale-up">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              {editingProduct ? t.editProduct : t.addProduct}
            </h3>

            {errorNotice && (
              <div className="mb-3 p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                {errorNotice}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  পণ্যের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameBn || ''}
                  onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                  placeholder="যেমন: মিনিকেট চাল (৫০ কেজি)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                  Product Name (English)
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Miniket Rice 50kg"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    SKU কোড
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {settings.language === 'bn' ? c.nameBn : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    ক্রয় মূল্য ({sym})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    বিক্রয় মূল্য ({sym}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    স্টক পরিমাণ
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stockQuantity !== undefined ? formData.stockQuantity : ''}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    সতর্কতা সীমা
                  </label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold || ''}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                    একক (Unit)
                  </label>
                  <input
                    type="text"
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="কেজি / পিস"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Audit Modal */}
      {activeStockProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  স্টক লেনদেন অডিট লগ
                </h3>
                <span className="text-xs text-blue-600 font-semibold">
                  {settings.language === 'bn' ? activeStockProduct.nameBn : activeStockProduct.name}
                </span>
              </div>
              <button
                onClick={() => setActiveStockProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {stockMovements.filter((m) => m.productId === activeStockProduct.id).length === 0 ? (
                <p className="text-center py-6 text-slate-400">কোনো হিস্ট্রি রেকর্ড পাওয়া যায়নি</p>
              ) : (
                stockMovements
                  .filter((m) => m.productId === activeStockProduct.id)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {m.reason}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(m.createdAt, settings.language === 'bn' ? 'bn-BD' : 'en-US')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          স্টক: {m.previousStock} ➔ {m.newStock}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        title="পণ্য মুছে ফেলা নিশ্চিত করুন"
        message={`আপনি কি নিশ্চিত "${productToDelete?.nameBn || productToDelete?.name}" তালিকা থেকে চিরতরে মুছে ফেলতে চান?`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="না, থাক"
        tone="danger"
        onConfirm={confirmDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />

      {/* Action Error / Notice Modal */}
      <ConfirmModal
        isOpen={Boolean(actionErrorModal)}
        title="কার্যক্রম সম্পন্ন করা যায়নি"
        message={actionErrorModal || ''}
        confirmText="ঠিক আছে"
        cancelText=""
        tone="warning"
        onConfirm={() => setActionErrorModal(null)}
        onCancel={() => setActionErrorModal(null)}
      />
    </div>
  );
};
