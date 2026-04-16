'use client';

import React, { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { encryptPdf, decryptPdf, removePdfPassword, isPdfPasswordProtected, downloadFile } from '@/lib/pdf-utils';
import { Download, Loader2, Lock, Unlock, Shield, Eye, EyeOff, AlertCircle, CheckCircle2, FileText, Key, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '../Toast';
import { ProcessingState } from '../ProgressBar';
import { Tooltip } from '../Tooltip';

type SecurityMode = 'encrypt' | 'decrypt' | 'remove-password';

export function SecurityTool() {
  const { addToast } = useToast();
  const [mode, setMode] = useState<SecurityMode>('encrypt');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isProtected, setIsProtected] = useState<boolean | null>(null);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setPassword('');
    setConfirmPassword('');
    setIsProtected(null);
    
    try {
      const protected_ = await isPdfPasswordProtected(selectedFile);
      setIsProtected(protected_);
      addToast('success', `PDF loaded: ${selectedFile.name}`);
    } catch (error) {
      console.error("Error checking PDF:", error);
      addToast('error', 'Error reading PDF file');
      setFile(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    
    if (mode === 'encrypt') {
      if (!password) {
        addToast('warning', 'Please enter a password');
        return;
      }
      if (password !== confirmPassword) {
        addToast('warning', 'Passwords do not match');
        return;
      }
      if (password.length < 4) {
        addToast('warning', 'Password must be at least 4 characters');
        return;
      }
    }
    
    if ((mode === 'decrypt' || mode === 'remove-password') && !password) {
      addToast('warning', 'Please enter the current password');
      return;
    }
    
    setProcessing(true);
    try {
      let result: Uint8Array;
      let outputName: string;
      
      if (mode === 'encrypt') {
        result = await encryptPdf(file, password);
        outputName = file.name.replace('.pdf', '_protected.pdf');
        addToast('success', 'PDF encrypted successfully!');
      } else if (mode === 'decrypt') {
        result = await decryptPdf(file, password);
        outputName = file.name.replace('.pdf', '_decrypted.pdf');
        addToast('success', 'PDF decrypted successfully!');
      } else {
        result = await removePdfPassword(file, password);
        outputName = file.name.replace('.pdf', '_unlocked.pdf');
        addToast('success', 'Password removed successfully!');
      }
      
      downloadFile(result, outputName, 'application/pdf');
    } catch (error: any) {
      console.error("Security error:", error);
      if (error.message && error.message.includes('password')) {
        addToast('error', 'Incorrect password. Please try again.');
      } else {
        addToast('error', `Error: ${error.message || 'An error occurred'}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">PDF Security</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Encrypt, decrypt, or remove password protection</p>
      </div>

      {/* Mode Selector */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit mx-auto">
        <button 
          onClick={() => { setMode('encrypt'); setFile(null); setPassword(''); setConfirmPassword(''); setIsProtected(null); }}
          className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === 'encrypt' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")}
        >
          <Lock className="w-4 h-4" /> Encrypt
        </button>
        <button 
          onClick={() => { setMode('decrypt'); setFile(null); setPassword(''); setConfirmPassword(''); setIsProtected(null); }}
          className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all relative",
            mode === 'decrypt' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")}
        >
          <Unlock className="w-4 h-4" /> Decrypt
        </button>
        <button 
          onClick={() => { setMode('remove-password'); setFile(null); setPassword(''); setConfirmPassword(''); setIsProtected(null); }}
          className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === 'remove-password' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")}
        >
          <Key className="w-4 h-4" /> Remove Password
        </button>
      </div>
      
      {/* Info Banner */}
      {mode !== 'encrypt' && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
              Browser limitation
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              PDF decryption and password removal require desktop application or server-side processing for security reasons. You can still encrypt PDFs in your browser.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {!file ? (
          <FileUpload 
            onFilesSelected={handleFileSelect} 
            accept={{ 'application/pdf': ['.pdf'] }} 
            multiple={false}
            title={mode === 'encrypt' ? "Drop PDF to encrypt" : "Drop PDF to decrypt"}
            subtitle={mode === 'encrypt' ? "Add password protection to your PDF" : "Enter password to unlock"}
          />
        ) : (
          <div className="space-y-6">
            {/* File Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {isProtected !== null && (
                <Tooltip content={isProtected ? "Password protected" : "No password"} position="top">
                  <div className={cn("p-2 rounded-lg", isProtected ? "bg-amber-100 dark:bg-amber-900/40" : "bg-green-100 dark:bg-green-900/40")}>
                    {isProtected ? (
                      <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </Tooltip>
              )}
              <button 
                onClick={() => { setFile(null); setPassword(''); setConfirmPassword(''); setIsProtected(null); }}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                Remove
              </button>
            </div>

            {/* Password Input */}
            <div className="space-y-4">
              {mode !== 'encrypt' && isProtected === false && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>This PDF is not password protected. Use Encrypt to add password protection.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {mode === 'encrypt' ? 'Set Password' : 'Enter Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'encrypt' ? 'Enter password' : 'Enter current password'}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === 'encrypt' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Process Button */}
            <button
              onClick={handleProcess}
              disabled={processing || !password}
              className={cn("w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
                processing || !password 
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" 
                  : mode === 'encrypt' 
                    ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]" 
                    : "bg-green-600 hover:bg-green-700 active:scale-[0.98]"
              )}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : mode === 'encrypt' ? (
                <><Lock className="w-5 h-5" /> Encrypt PDF</>
              ) : (
                <><Unlock className="w-5 h-5" /> Decrypt PDF</>
              )}
            </button>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Your files are processed locally</p>
                <p className="text-blue-600 dark:text-blue-400">Passwords are never uploaded to any server. All encryption happens in your browser.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="bg-green-100 dark:bg-green-900/40 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-2">Password Protection</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">Secure your PDFs with strong AES encryption</p>
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
