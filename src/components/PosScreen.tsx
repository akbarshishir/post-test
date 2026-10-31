import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Receipt,
  Scan,
  RotateCcw,
} from 'lucide-react';
import {
  BusinessSettings,
  CartItem,
  Category,
  Customer,
  PaymentMethod,
  Product,
  Sale,
} from '../types/pos';
import { translations } from '../i18n/translations';
import { formatCurrency } from '../services/pdfReceipt';

interface PosScreenProps {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  settings: BusinessSettings;
  onCompleteSale: (saleData: any) => { success: boolean; sale?: Sale; error?: string };
  onShowReceipt: (sale: Sale) => void;
  onOpenCustomerModal: () => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  products,
  categories,
  customers,
  settings,
  onCompleteSale,
  onShowReceipt,
  onOpenCustomerModal,
}) => {
  const t = translations[settings.language];
  const sym = settings.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [saleNote, setSaleNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nameBn.includes(searchTerm) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart Totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [cart]);

  const grandTotal = Math.max(0, subtotal - (Number(discountTotal) || 0));

  const totalCostOfGoods = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.product.purchasePrice, 0);
  }, [cart]);

  const grossProfit = Math.max(0, grandTotal - totalCostOfGoods);

  const tenderedAmount = paymentMethod === 'CREDIT' ? 0 : parseFloat(cashTendered) || grandTotal;
  const changeAmount = paymentMethod === 'CASH' && tenderedAmount > grandTotal ? tenderedAmount - grandTotal : 0;
  const balanceDue = Math.max(0, grandTotal - (paymentMethod === 'CREDIT' ? 0 : tenderedAmount));

  // Cart operations
  const addToCart = (product: Product) => {
    setErrorMsg(null);
    const existing = cart.find((i) => i.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (!settings.allowNegativeStock && currentQty + 1 > product.stockQuantity) {
      setErrorMsg(`${product.nameBn || product.name} এর আর পর্যাপ্ত স্টক নেই! (সর্বোচ্চ: ${product.stockQuantity})`);
      return;
    }

    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitPrice: product.sellingPrice,
          discount: 0,
          total: product.sellingPrice,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setErrorMsg(null);
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (!settings.allowNegativeStock && newQty > item.product.stockQuantity) {
      setErrorMsg(`${item.product.nameBn || item.product.name} এর বর্তমান স্টক: ${item.product.stockQuantity}`);
      return;
    }

    setCart(
      cart.map((i) =>
        i.product.id === productId ? { ...i, quantity: newQty, total: newQty * i.unitPrice } : i
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountTotal(0);
    setCashTendered('');
    setSelectedCustomerId('');
    setSaleNote('');
    setErrorMsg(null);
  };

  // Submit Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      setErrorMsg(t.cartEmpty);
      return;
    }

    if (balanceDue > 0 && !selectedCustomerId) {
      setErrorMsg('বাকি বিক্রয়ের ক্ষেত্রে অবশ্যই একজন গ্রাহক নির্বাচন করতে হবে!');
      return;
    }

    setIsProcessing(true);
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

    // Generate unique invoice number: e.g. INV-202610-1234
    const invoiceNumber = `${settings.invoicePrefix || 'INV'}-${new Date()
      .toISOString()
      .slice(0, 7)
      .replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const saleItems = cart.map((item) => ({
      id: 'sitem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      saleId: '',
      productId: item.product.id,
      productName: item.product.nameBn || item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      purchaseCost: item.product.purchasePrice, // Stored historical cost for exact COGS
      unitPrice: item.unitPrice,
      discountAmount: item.discount,
      lineTotal: item.total,
    }));

    const paid = paymentMethod === 'CREDIT' ? 0 : Math.min(tenderedAmount, grandTotal);

    const result = onCompleteSale({
      invoiceNumber,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer ? selectedCustomer.name : 'সাধারণ খদ্দের (নগদ)',
      customerPhone: selectedCustomer?.phone,
      subtotal,
      discountTotal: Number(discountTotal) || 0,
      vatTaxTotal: 0,
      grandTotal,
      paidAmount: paid,
      changeAmount,
      balanceDue,
      paymentMethod,
      totalCostOfGoods,
      grossProfit,
      notes: saleNote,
      items: saleItems,
    });

    setIsProcessing(false);

    if (result.success && result.sale) {
      clearCart();
      onShowReceipt(result.sale);
    } else {
      setErrorMsg(result.error || 'বিক্রয় সম্পন্ন হতে ত্রুটি হয়েছে!');
    }
  };

  return (
    <div className="pb-24 animate-fade-in">
      {/* Top Banner / Error notice */}
      {errorMsg && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold px-1 hover:text-rose-900">
            ×
          </button>
        </div>
      )}

      {/* POS Two-Column Grid on Tablet/Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Product Catalog & Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search bar & Barcode simulation */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchProductPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Chips Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.allCategories}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition ${
                  selectedCategory === c.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {settings.language === 'bn' ? c.nameBn : c.name}
              </button>
            ))}
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[580px] overflow-y-auto pr-0.5">
            {filteredProducts.map((p) => {
              const inCart = cart.find((i) => i.product.id === p.id);
              const isOutOfStock = p.stockQuantity <= 0;
              const isLowStock = p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0;

              return (
                <button
                  key={p.id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  disabled={isOutOfStock && !settings.allowNegativeStock}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition relative group shadow-xs ${
                    isOutOfStock && !settings.allowNegativeStock
                      ? 'bg-slate-100 dark:bg-slate-800/40 opacity-60 border-slate-200 cursor-not-allowed'
                      : inCart
                      ? 'bg-blue-50/70 dark:bg-blue-900/30 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-white dark:bg-slate-800 hover:border-blue-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Cart badge if added */}
                  {inCart && (
                    <span className="absolute top-2 right-2 bg-blue-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                      {inCart.quantity}
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block truncate">
                      {p.sku}
                    </span>
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
                      {settings.language === 'bn' ? p.nameBn : p.name}
                    </h4>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                        {formatCurrency(p.sellingPrice, sym)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/{p.unit}</span>
                    </div>

                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-700'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isOutOfStock ? 'স্টক শেষ' : `${p.stockQuantity} ${p.unit}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Checkout Cart & Payment (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.cartItems} ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                >
                  কার্ট খালি করুন
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <p>{t.cartEmpty}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-56 overflow-y-auto my-2 pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="truncate pr-2 max-w-[170px]">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {settings.language === 'bn' ? item.product.nameBn : item.product.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatCurrency(item.unitPrice, sym)} × {item.quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-700">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-16 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.total, sym)}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
            {/* Customer Selector */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">{t.walkInCustomer}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - বাকি: {formatCurrency(c.totalBalanceDue, sym)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={onOpenCustomerModal}
                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                title="Add Customer"
              >
                +
              </button>
            </div>

            {/* Calculations: Subtotal & Discount */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span className="font-semibold">{formatCurrency(subtotal, sym)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t.discount} ({sym})</span>
                <input
                  type="number"
                  min="0"
                  value={discountTotal || ''}
                  onChange={(e) => setDiscountTotal(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-20 px-2 py-0.5 text-right bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>{t.grandTotal}</span>
                <span className="text-blue-600 dark:text-blue-400 text-base">
                  {formatCurrency(grandTotal, sym)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-1">
                {t.paymentMethod}
              </span>
              <div className="grid grid-cols-4 gap-1 text-[11px]">
                {(['CASH', 'BKASH', 'NAGAD', 'CREDIT'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m);
                      if (m === 'CREDIT') {
                        setCashTendered('0');
                      }
                    }}
                    className={`py-1.5 px-1 rounded-lg font-semibold transition text-center truncate ${
                      paymentMethod === m
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {m === 'CASH'
                      ? 'নগদ'
                      : m === 'BKASH'
                      ? 'বিকাশ'
                      : m === 'NAGAD'
                      ? 'নগদ পে'
                      : 'বাকি'}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tendered & Change (for Cash / Partial) */}
            {paymentMethod !== 'CREDIT' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">
                    {t.paidAmount} ({sym})
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={grandTotal.toString()}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">
                    {changeAmount > 0 ? t.changeReturn : t.creditDueAmount}
                  </label>
                  <div
                    className={`px-2 py-1 rounded font-bold text-xs ${
                      changeAmount > 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : balanceDue > 0
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {changeAmount > 0
                      ? formatCurrency(changeAmount, sym)
                      : balanceDue > 0
                      ? `বাকি: ${formatCurrency(balanceDue, sym)}`
                      : '০'}
                  </div>
                </div>
              </div>
            )}

            {/* Complete Sale Action Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-md transition ${
                cart.length === 0
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t.completeSale}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
