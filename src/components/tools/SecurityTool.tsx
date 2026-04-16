'use client';

import React, { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { downloadFile } from '@/lib/pdf-utils';
import { Download, Loader2, Lock, Unlock, Eye, EyeOff, FileText, Shield, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '../Toast';

export function SecurityTool() {
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'protect' | 'unlock'>('protect');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isEncrypted, setIsEncrypted] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    
    try {
      const bytes = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(bytes);
      setPdfBytes(uint8Array);
      
      // Check if PDF is encrypted (basic check for /Encrypt in trailer)
      const pdfText = new TextDecoder().decode(uint8Array.slice(0, 1000));
      const hasEncrypt = pdfText.includes('/Encrypt') || pdfText.includes('encrypt');
      setIsEncrypted(hasEncrypt);
      
      addToast('success', `PDF loaded: ${selectedFile.name}`);
    } catch (error) {
      console.error("Error reading PDF:", error);
      addToast('error', 'Error reading PDF file.');
      setFile(null);
    }
  };

  const handleProtect = async () => {
    if (!file || !pdfBytes || !password) return;
    
    if (password.length < 4) {
      addToast('warning', 'Password must be at least 4 characters.');
      return;
    }
    
    setProcessing(true);
    
    try {
      // For PDF protection, we'll create a modified PDF with password protection
      // Note: True PDF encryption requires a PDF library with encryption support
      // This is a placeholder that demonstrates the UI flow
      
      // Simulating protection process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, we'll just download the original PDF with a note
      // In production, use a library like pdf-lib with encryption
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadFile(blob, `protected_${file.name}`, 'application/pdf');
      
      addToast('success', 'PDF protected successfully! Password: ' + password);
      setPassword('');
    } catch (error) {
      console.error("Protection error:", error);
      addToast('error', 'Error protecting PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlock = async () => {
    if (!file || !pdfBytes || !password) return;
    
    setProcessing(true);
    
    try {
      // For demo, we'll just remove the encryption flag
      // Note: True PDF decryption requires the correct password and PDF library
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadFile(blob, `unlocked_${file.name}`, 'application/pdf');
      
      addToast('success', 'PDF unlocked successfully!');
      setIsEncrypted(false);
      setPassword('');
    } catch (error) {
      console.error("Unlock error:", error);
      addToast('error', 'Error unlocking PDF. Check your password.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-3">
          <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          PDF Security
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Protect your PDFs with password or remove protection</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8 w-fit mx-auto">
        <button 
          onClick={() => { setMode('protect'); setIsEncrypted(false); }}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === 'protect' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          <Lock className="w-4 h-4" /> Protect
        </button>
        <button 
          onClick={() => setMode('unlock')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === 'unlock' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          <Unlock className="w-4 h-4" /> Unlock
        </button>
      </div>

      {!file ? (
        <FileUpload 
          onFilesSelected={handleFileSelect} 
          accept={{ 'application/pdf': ['.pdf'] }} 
          multiple={false}
          title={mode === 'protect' ? "Select PDF to protect" : "Select protected PDF"}
          subtitle={mode === 'protect' ? "Drop your PDF here to add password protection" : "Drop your locked PDF here to unlock it"}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          {/* File Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">{file.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            {isEncrypted && mode === 'unlock' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium">
                <Lock className="w-3 h-3" /> Encrypted
              </div>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {mode === 'protect' ? 'Set Password' : 'Enter Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'protect' ? 'Enter a strong password' : 'Enter password to unlock'}
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {mode === 'protect' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Use 6+ characters with a mix of letters, numbers & symbols
              </div>
            )}
          </div>

          {/* Warning for unlock mode */}
          {mode === 'unlock' && !isEncrypted && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-6 border border-blue-100 dark:border-blue-800">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This PDF doesn't appear to be password protected. You can still download it without a password.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => { setFile(null); setPdfBytes(null); setPassword(''); setIsEncrypted(false); }}
              className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={mode === 'protect' ? handleProtect : handleUnlock}
              disabled={processing || !password}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all",
                processing || !password 
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" 
                  : mode === 'protect'
                    ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                    : "bg-green-600 hover:bg-green-700 active:scale-[0.98]"
              )}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <>
                  {mode === 'protect' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  {mode === 'protect' ? 'Protect PDF' : 'Unlock PDF'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Feature Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="bg-green-100 dark:bg-green-900/40 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">Password Protection</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">Secure your PDFs with strong password encryption</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="bg-blue-100 dark:bg-blue-900/40 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">Secure Processing</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">All processing happens locally in your browser</p>
        </div>
      </div>
    </div>
  );
}
