'use client';

import Link from 'next/link';
import { FileText, ArrowRightLeft, Layers, Type, FileEdit, Shield, Zap, Globe, ArrowRight } from 'lucide-react';
import { LanguageSelector } from '@/lib/i18n/LanguageSelector';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';

type TranslationKey = keyof typeof translations.en;

export default function Home() {
  const { t } = useLanguage();

  const tools: { key: TranslationKey; descKey: TranslationKey; icon: typeof Type; color: string }[] = [
    { key: 'annotate', descKey: 'annotateDesc', icon: Type, color: 'bg-blue-500' },
    { key: 'editPages', descKey: 'editPagesDesc', icon: FileEdit, color: 'bg-indigo-500' },
    { key: 'convert', descKey: 'convertDesc', icon: ArrowRightLeft, color: 'bg-emerald-500' },
    { key: 'mergePdf', descKey: 'mergePdfDesc', icon: Layers, color: 'bg-orange-500' },
    { key: 'wordToPdf', descKey: 'wordToPdfDesc', icon: FileText, color: 'bg-purple-500' },
  ];

  const features: { icon: typeof Shield; titleKey: TranslationKey; descKey: TranslationKey }[] = [
    { icon: Shield, titleKey: 'privacy', descKey: 'privacyDesc' },
    { icon: Zap, titleKey: 'fast', descKey: 'fastDesc' },
    { icon: Globe, titleKey: 'worksEverywhere', descKey: 'worksEverywhereDesc' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-base sm:text-xl font-bold text-gray-900 tracking-tight">PDF Studio</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            <Link href="/editor" className="px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2">
              {t('openEditor')} <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium rounded-full mb-4 sm:mb-6 border border-blue-100">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" /> {t('browserBased')}
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            {t('heroTitle')}<br />
            <span className="text-blue-600">{t('heroSubtitle')}</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed px-2">
            {t('heroDesc')}
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/editor" className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white text-base sm:text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 flex items-center justify-center gap-2">
              {t('startEditing')} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{t('allToolsTitle')}</h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-gray-500">{t('allToolsSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.key} href="/editor" className="group bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 hover:shadow-lg hover:border-blue-200 transition-all">
                  <div className={`${tool.color} w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{t(tool.key)}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{t(tool.descKey)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{t('whyPdfStudio')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.titleKey} className="text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{t(f.titleKey)}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{t(f.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">{t('ctaTitle')}</h2>
          <p className="text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8">{t('ctaDesc')}</p>
          <Link href="/editor" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white text-base sm:text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg">
            {t('openEditor')} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-md">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">PDF Studio</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">© {new Date().getFullYear()} PDF Studio. {t('footerNote')}</p>
        </div>
      </footer>
    </div>
  );
}
