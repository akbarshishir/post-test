import React, { useState } from 'react';
import { Printer, Download, X, Bluetooth, Check, Copy } from 'lucide-react';
import { BusinessSettings, Sale } from '../types/pos';
import { translations } from '../i18n/translations';
import { formatCurrency, formatDate, generatePdfReceipt } from '../services/pdfReceipt';

interface ReceiptModalProps {
  sale: Sale;
  settings: BusinessSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose }) => {
  const t = translations[settings.language];
  const sym = settings.currencySymbol;

  const [copiedEscPos, setCopiedEscPos] = useState(false);
  const [showBluetoothEscPos, setShowBluetoothEscPos] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setPdfError(null);
      setIsGeneratingPdf(true);
      await generatePdfReceipt(sale, settings);
    } catch (err) {
      console.error(err);
      setPdfError('পিডিএফ ফাইলে রূপান্তরে সমস্যা হয়েছে। দয়া করে প্রিন্ট অপশন ব্যবহার করুন।');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate ESC/POS raw hex / plain text for Bluetooth thermal printers
  const generateEscPosText = () => {
    let raw = `ESC @ (Init)\n`;
    raw += `ESC a 1 (Align Center)\n`;
    raw += `${settings.businessNameBn || settings.businessName}\n`;
    raw += `${settings.address}\n`;
    raw += `Tel: ${settings.phone}\n`;
    raw += `--------------------------------\n`;
    raw += `Invoice: ${sale.invoiceNumber}\n`;
    raw += `Date: ${formatDate(sale.createdAt, 'bn-BD')}\n`;
    if (sale.customerName) raw += `Customer: ${sale.customerName}\n`;
    raw += `--------------------------------\n`;
    raw += `Item              Qty  Rate  Total\n`;
    for (const item of sale.items) {
      const name = item.productName.substring(0, 16).padEnd(16, ' ');
      const qty = item.quantity.toString().padStart(3, ' ');
      const rate = item.unitPrice.toString().padStart(5, ' ');
      const total = item.lineTotal.toString().padStart(6, ' ');
      raw += `${name} ${qty} ${rate} ${total}\n`;
    }
    raw += `--------------------------------\n`;
    raw += `Subtotal:             ${sym} ${sale.subtotal}\n`;
    if (sale.discountTotal > 0) raw += `Discount:            -${sym} ${sale.discountTotal}\n`;
    raw += `Grand Total:          ${sym} ${sale.grandTotal}\n`;
    raw += `Paid Amount:          ${sym} ${sale.paidAmount}\n`;
    if (sale.changeAmount > 0) raw += `Change:               ${sym} ${sale.changeAmount}\n`;
    if (sale.balanceDue > 0) raw += `Due Balance:          ${sym} ${sale.balanceDue}\n`;
    raw += `--------------------------------\n`;
    raw += `${settings.receiptFooterMessage}\n`;
    raw += `GS V 66 0 (Paper Cut)\n`;
    return raw;
  };

  const copyEscPos = () => {
    navigator.clipboard.writeText(generateEscPosText());
    setCopiedEscPos(true);
    setTimeout(() => setCopiedEscPos(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[95vh] overflow-y-auto">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {t.receiptTitle}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: Print, PDF, Bluetooth Thermal */}
        <div className="my-3 grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handlePrint}
            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReceipt}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'পিডিএফ তৈরি হচ্ছে...' : t.downloadPdf}</span>
          </button>
        </div>

        {pdfError && (
          <div className="mb-2 p-2 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
            {pdfError}
          </div>
        )}

        <button
          onClick={() => setShowBluetoothEscPos(!showBluetoothEscPos)}
          className="w-full mb-3 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
        >
          <Bluetooth className="w-3.5 h-3.5 text-blue-500" />
          <span>ব্লুটুথ থার্মাল প্রিন্টার কমান্ড (ESC/POS)</span>
        </button>

        {showBluetoothEscPos && (
          <div className="mb-3 p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono relative">
            <div className="flex justify-between items-center mb-1 text-slate-400">
              <span>Android Bluetooth ESC/POS Stream</span>
              <button
                onClick={copyEscPos}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
              >
                {copiedEscPos ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEscPos ? 'কপি হয়েছে' : 'কমান্ড কপি'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap max-h-36">
              {generateEscPosText()}
            </pre>
          </div>
        )}

        {/* 80mm Printable Receipt Render Box */}
        <div
          id="thermal-receipt"
          className="bg-white text-slate-900 border border-dashed border-slate-300 p-4 rounded-xl font-sans text-[11px] leading-relaxed select-text shadow-inner"
        >
          {/* Business Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
            {settings.logoUrl && (
              <div className="flex justify-center mb-1.5">
                <img src={settings.logoUrl} alt="Store Logo" className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-0.5" />
              </div>
            )}
            <h4 className="font-bold text-base tracking-tight text-slate-900">
              {settings.language === 'bn' ? settings.businessNameBn : settings.businessName}
            </h4>
            {settings.slogan && (
              <p className="text-[10px] text-slate-500 italic font-medium">{settings.slogan}</p>
            )}
            <p className="text-[10px] text-slate-600">{settings.address}</p>
            <p className="text-[10px] text-slate-600">
              মোবাইল: {settings.phone} {settings.email ? ` | ${settings.email}` : ''}
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span>চালান:</span>
              <span className="font-bold">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>তারিখ:</span>
              <span>{formatDate(sale.createdAt, settings.language === 'bn' ? 'bn-BD' : 'en-US')}</span>
            </div>
            {sale.customerName && (
              <div className="flex justify-between">
                <span>গ্রাহক:</span>
                <span>{sale.customerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>পেমেন্ট:</span>
              <span className="font-bold">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-slate-200">
              <span className="w-32">পণ্য</span>
              <span className="w-8 text-center">পরিমাণ</span>
              <span className="w-12 text-right">দর</span>
              <span className="w-14 text-right">মোট</span>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {sale.items.map((item) => (
                <div key={item.id} className="py-1 flex justify-between items-center text-[10px]">
                  <span className="w-32 truncate">{item.productName}</span>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <span className="w-12 text-right">{item.unitPrice}</span>
                  <span className="w-14 text-right font-semibold">{item.lineTotal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>উপমোট (Subtotal):</span>
              <span>{formatCurrency(sale.subtotal, sym)}</span>
            </div>
            {sale.discountTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>ছাড় (Discount):</span>
                <span>-{formatCurrency(sale.discountTotal, sym)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
              <span>সর্বমোট:</span>
              <span>{formatCurrency(sale.grandTotal, sym)}</span>
            </div>
            <div className="flex justify-between">
              <span>পরিশোধিত:</span>
              <span>{formatCurrency(sale.paidAmount, sym)}</span>
            </div>
            {sale.changeAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>ফেরত (Change):</span>
                <span>{formatCurrency(sale.changeAmount, sym)}</span>
              </div>
            )}
            {sale.balanceDue > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>বাকি (Due):</span>
                <span>{formatCurrency(sale.balanceDue, sym)}</span>
              </div>
            )}
          </div>

          {/* Footer message */}
          <div className="text-center pt-2 text-[10px] text-slate-500 space-y-0.5">
            <p>{settings.receiptFooterMessage}</p>
            <p className="font-semibold">{t.thankYouMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
