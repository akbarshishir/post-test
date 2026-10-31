import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Folder, ChevronRight, Download, Terminal } from 'lucide-react';
import { ANDROID_PROJECT_FILES, AndroidSourceFile } from '../services/androidProjectCode';
import { generateAndroidProjectZip } from '../services/zipExporter';

interface AndroidCodeViewerModalProps {
  onClose: () => void;
}

export const AndroidCodeViewerModal: React.FC<AndroidCodeViewerModalProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<AndroidSourceFile>(ANDROID_PROJECT_FILES[1]); // default to app/build.gradle.kts
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const copyCurrentCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadProjectZip = async () => {
    try {
      setIsZipping(true);
      const zipBlob = await generateAndroidProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Offline_POS_Manager_Android_Studio_Project.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to create ZIP:', e);
      downloadAllAsText();
    } finally {
      setIsZipping(false);
    }
  };

  const downloadAllAsText = () => {
    let combined = `====================================================\n`;
    combined += `OFFLINE POS MANAGER - COMPLETE ANDROID STUDIO SOURCE\n`;
    combined += `Generated for Android Studio with Jetpack Compose & Room\n`;
    combined += `====================================================\n\n`;

    for (const f of ANDROID_PROJECT_FILES) {
      combined += `\n/* --------------------------------------------------\n`;
      combined += ` * FILE: ${f.path}\n`;
      combined += ` * DESCRIPTION: ${f.description}\n`;
      combined += ` * -------------------------------------------------- */\n\n`;
      combined += f.code;
      combined += `\n\n`;
    }

    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Offline_POS_Manager_Android_Project_Source.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-5xl h-[88vh] shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="ml-2 font-mono font-bold text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Android Studio Project Explorer • Offline POS Manager (Kotlin / Room)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/downloads/app-debug.apk"
              download="app-debug.apk"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              title="Download real installable APK (1.4 MB)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>সরাসরি APK ডাউনলোড (1.4MB)</span>
            </a>
            <button
              onClick={downloadProjectZip}
              disabled={isZipping}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              title="Download full Android Studio project ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'জিপ তৈরি হচ্ছে...' : 'Android প্রজেক্ট .ZIP'}</span>
            </button>
            <button
              onClick={downloadAllAsText}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              title="Download combined text bundle"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">টেক্সট ফাইল</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Split Layout: Left File Tree, Right Code Preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* File Tree Left Pane (4 Cols) */}
          <div className="md:col-span-4 bg-slate-950/60 border-r border-slate-800 p-3 overflow-y-auto space-y-1 text-xs font-mono">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-blue-400" />
              <span>Project Files</span>
            </div>

            {ANDROID_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition group ${
                    isSelected
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition ${
                      isSelected ? 'opacity-100 text-blue-400' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Code Viewer Right Pane (8 Cols) */}
          <div className="md:col-span-8 flex flex-col bg-slate-900 overflow-hidden">
            {/* File info bar */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-emerald-400 font-bold">{selectedFile.path}</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  {selectedFile.description}
                </p>
              </div>

              <button
                onClick={copyCurrentCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'কপি হয়েছে!' : 'কোড কপি করুন'}</span>
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-200 bg-slate-950">
              <pre className="whitespace-pre">{selectedFile.code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
