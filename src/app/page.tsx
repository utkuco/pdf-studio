'use client';

import Link from 'next/link';
import { FileText, ArrowRightLeft, Layers, Type, FileEdit, Shield, Zap, Globe, ArrowRight, Sparkles, Lock, Clock, CheckCircle, Star, ChevronDown, ChevronUp, Users, Zap as ZapIcon } from 'lucide-react';
import { LanguageSelector } from '@/lib/i18n/LanguageSelector';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ToolPreview } from '@/components/ToolPreview';
import { cn } from '@/lib/utils';

type TranslationKey = keyof typeof translations.en;

type ToolPreviewType = 'annotate' | 'edit' | 'convert' | 'merge' | 'word-to-pdf' | 'security' | 'batch';

// Floating PDF Mockup Component
function FloatingPdfMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto mt-12 perspective-1000">
      {/* Main floating document */}
      <div className="relative animate-float-slow">
        {/* Document shadow */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 to-indigo-900/20 rounded-2xl blur-xl transform translate-y-4" />
        
        {/* Main PDF */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* PDF Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-white/80 text-sm font-medium ml-2">document.pdf</span>
          </div>
          
          {/* PDF Content */}
          <div className="p-6 space-y-4">
            {/* Lines representing text */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
            </div>
            
            {/* Highlighted annotation */}
            <div className="bg-yellow-200/60 dark:bg-yellow-500/20 h-8 rounded-lg flex items-center px-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">Important annotation here</span>
            </div>
            
            {/* More text */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
            
            {/* Image placeholder */}
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg h-24 flex items-center justify-center">
              <div className="bg-gray-300 dark:bg-gray-600 rounded-lg w-16 h-16 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Toolbar overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Type className="w-4 h-4 text-blue-600" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FileEdit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
        
        {/* Floating tooltips */}
        <div className="absolute -right-8 top-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 px-3 py-2 animate-float-right hidden lg:block">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Encrypted</span>
          </div>
        </div>
        
        <div className="absolute -left-8 top-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 px-3 py-2 animate-float-left hidden lg:block">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Instant save</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Testimonial Card
function TestimonialCard({ name, role, content, avatar, rating }: { name: string; role: string; content: string; avatar: string; rating: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300">
      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={cn("w-4 h-4", i < rating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600")} />
        ))}
      </div>
      
      {/* Content */}
      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">"{content}"</p>
      
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  );
}

// FAQ Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-semibold text-gray-900 dark:text-white pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-5 text-gray-500 dark:text-gray-400 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const tools: { key: TranslationKey; descKey: TranslationKey; icon: typeof Type; color: string; gradient: string; features: string[]; toolType: ToolPreviewType }[] = [
    { 
      key: 'annotate', 
      descKey: 'annotateDesc', 
      icon: Type, 
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-indigo-600',
      features: ['Add text & comments', 'Draw & highlight', 'Erase & move elements'],
      toolType: 'annotate'
    },
    { 
      key: 'editPages', 
      descKey: 'editPagesDesc', 
      icon: FileEdit, 
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-purple-600',
      features: ['Rotate pages', 'Delete pages', 'Reorder pages'],
      toolType: 'edit'
    },
    { 
      key: 'convert', 
      descKey: 'convertDesc', 
      icon: ArrowRightLeft, 
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-teal-600',
      features: ['PDF to Images', 'Images to PDF', 'High quality output'],
      toolType: 'convert'
    },
    { 
      key: 'mergePdf', 
      descKey: 'mergePdfDesc', 
      icon: Layers, 
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-amber-600',
      features: ['Combine multiple files', 'Drag to reorder', 'Instant merge'],
      toolType: 'merge'
    },
    { 
      key: 'wordToPdf', 
      descKey: 'wordToPdfDesc', 
      icon: FileText, 
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-600',
      features: ['Preserve formatting', 'Fast conversion', 'Secure processing'],
      toolType: 'word-to-pdf'
    },
    { 
      key: 'security', 
      descKey: 'securityDesc', 
      icon: Shield, 
      color: 'bg-red-500',
      gradient: 'from-red-500 to-rose-600',
      features: ['Password protect', 'AES-256 encryption', 'Secure processing'],
      toolType: 'security'
    },
    { 
      key: 'batch', 
      descKey: 'batchDesc', 
      icon: Layers, 
      color: 'bg-cyan-500',
      gradient: 'from-cyan-500 to-sky-600',
      features: ['Process multiple files', 'Batch operations', 'Save time'],
      toolType: 'batch'
    },
  ];

  const features: { icon: typeof Shield; titleKey: TranslationKey; descKey: TranslationKey; colorLight: string; colorDark: string }[] = [
    { icon: Lock, titleKey: 'privacy', descKey: 'privacyDesc', colorLight: 'bg-blue-100 text-blue-600', colorDark: 'dark:bg-blue-900/30 dark:text-blue-400' },
    { icon: Zap, titleKey: 'fast', descKey: 'fastDesc', colorLight: 'bg-amber-100 text-amber-600', colorDark: 'dark:bg-amber-900/30 dark:text-amber-400' },
    { icon: Globe, titleKey: 'worksEverywhere', descKey: 'worksEverywhereDesc', colorLight: 'bg-emerald-100 text-emerald-600', colorDark: 'dark:bg-emerald-900/30 dark:text-emerald-400' },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Marketing Manager",
      content: "PDF Studio saved me hours every week. I can merge contracts and add annotations without leaving my browser. The privacy-first approach means I never worry about sensitive documents.",
      avatar: "SC",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Software Engineer",
      content: "As a developer, I appreciate that everything runs locally. No server uploads, no tracking. Just pure functionality in a beautiful interface. This is how all web apps should work.",
      avatar: "MJ",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Freelance Designer",
      content: "The batch processing feature is a game-changer for my workflow. I can compress dozens of images and convert them to PDF in seconds. Highly recommend!",
      avatar: "ER",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "Is PDF Studio really free?",
      answer: "Yes! PDF Studio is completely free to use. All features are available without any payment. We believe everyone should have access to powerful PDF tools without barriers."
    },
    {
      question: "Are my files uploaded to a server?",
      answer: "No! All processing happens locally in your browser using JavaScript. Your files never leave your device. This makes PDF Studio 100% private and secure."
    },
    {
      question: "What file formats are supported?",
      answer: "We support PDF, PNG, JPG, JPEG, GIF, WebP, and Word documents (.docx). You can convert between these formats and perform various operations on PDFs."
    },
    {
      question: "Does the encryption work with other PDF readers?",
      answer: "Yes! PDFs encrypted with PDF Studio use standard RC4-128 encryption and can be opened with any PDF reader that supports this encryption standard."
    },
    {
      question: "Can I use PDF Studio on my mobile device?",
      answer: "Absolutely! PDF Studio is fully responsive and works great on smartphones and tablets. The interface automatically adapts to your screen size."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB"/>
                  <stop offset="100%" stopColor="#4F46E5"/>
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="30" height="30" rx="6" fill="url(#logoGrad)"/>
              <rect x="5" y="4" width="22" height="24" rx="2" fill="white"/>
              <path d="M19 4 L27 12 L19 12 Z" fill="#E5E7EB"/>
              <text x="7" y="20" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="#2563EB">PDF</text>
            </svg>
            <span className="text-base sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">PDF Studio</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            <Link href="/editor" className="group px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 flex items-center gap-1 sm:gap-2">
              {t('openEditor')} <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/30 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30" />
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold rounded-full mb-6 sm:mb-8 border border-blue-200 dark:border-blue-800 shadow-sm">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t('browserBased')}</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                {t('heroTitle')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t('heroSubtitle')}
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed px-2 mb-8 sm:mb-10">
              {t('heroDesc')}
            </p>
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/editor" className="group px-7 sm:px-10 py-4 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base sm:text-lg font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl shadow-blue-500/30 dark:shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/40 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                <Sparkles className="w-5 h-5" />
                {t('startEditing')} 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>No signup required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>100% Private</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Free forever</span>
              </div>
            </div>
          </div>
          
          {/* Floating PDF Mockup */}
          <FloatingPdfMockup />
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {t('allToolsTitle')}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400">{t('allToolsSubtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isHovered = hoveredTool === tool.key;
              return (
                <Link 
                  key={tool.key} 
                  href="/editor"
                  className="group relative"
                  onMouseEnter={() => setHoveredTool(tool.key)}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  {/* Card */}
                  <div className={`
                    relative rounded-2xl border-2 overflow-hidden
                    transition-all duration-300 ease-out
                    bg-white dark:bg-gray-900
                    ${isHovered 
                      ? 'border-transparent shadow-2xl scale-[1.02]' 
                      : 'border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700'
                    }
                  `}>
                    {/* Gradient border effect */}
                    <div className={`
                      absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0
                      transition-opacity duration-300
                      ${isHovered ? 'opacity-100' : ''}
                    `} />
                    <div className="absolute inset-[1px] rounded-2xl bg-white dark:bg-gray-900" />
                    
                    {/* tool Preview */}
                    <div className="relative p-4 sm:p-6">
                      <ToolPreview tool={tool.toolType} />
                    </div>
                    
                    {/* Content */}
                    <div className="relative px-5 sm:px-6 pb-5 sm:pb-6 -mt-2">
                      {/* Icon */}
                      <div className={`
                        w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4
                        bg-gradient-to-br ${tool.gradient} shadow-lg
                        transition-transform duration-300
                        ${isHovered ? 'scale-110 rotate-3' : ''}
                      `}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                        {t(tool.key)}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                        {t(tool.descKey)}
                      </p>
                      
                      {/* Features (show on hover) */}
                      <div className={`
                        space-y-1.5 transition-all duration-300
                        ${isHovered ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}
                      `}>
                        {tool.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${tool.gradient}`} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-semibold rounded-full mb-4">
              <Users className="w-4 h-4" />
              <span>Loved by thousands</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              What people are saying
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of happy users who trust PDF Studio for their PDF needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard key={i} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {t('whyPdfStudio')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div 
                  key={f.titleKey} 
                  className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 text-center hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300"
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 ${f.colorLight} ${f.colorDark} rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    {t(f.titleKey)}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                    {t(f.descKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              100% Free, Forever
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400">
              All features are completely free. No hidden costs, no premium paywalls.
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-2xl shadow-blue-500/30 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                <ZapIcon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-2">Free Forever</h3>
              
              <div className="mb-6">
                <span className="text-5xl font-extrabold">$0</span>
                <span className="text-white/70 ml-2">forever</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  "All PDF tools",
                  "Unlimited files",
                  "Local processing",
                  "No signup required",
                  "Batch processing",
                  "Priority support",
                  "Cloud sync (coming soon)"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white/80 flex-shrink-0" />
                    <span className="text-white/90">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href="/editor"
                className="block w-full py-4 px-6 rounded-xl font-bold text-center bg-white text-blue-600 hover:bg-gray-100 transition-all"
              >
                Start Using Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Frequently asked questions
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400">
              Everything you need to know about PDF Studio.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-6 sm:px-8">
            {faqs.map((faq, i) => (
              <FAQItem key={i} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 dark:bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 dark:bg-purple-600/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            {t('ctaTitle')}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 max-w-xl mx-auto">
            {t('ctaDesc')}
          </p>
          <Link href="/editor" className="group inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base sm:text-lg font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-2xl shadow-blue-900/50 hover:shadow-blue-800/50 hover:scale-[1.02] active:scale-[0.98]">
            <Clock className="w-5 h-5" />
            {t('openEditor')} 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="w-6 h-6">
              <defs>
                <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB"/>
                  <stop offset="100%" stopColor="#4F46E5"/>
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="30" height="30" rx="6" fill="url(#logoGrad2)"/>
              <rect x="5" y="4" width="22" height="24" rx="2" fill="white"/>
              <path d="M19 4 L27 12 L19 12 Z" fill="#E5E7EB"/>
              <text x="7" y="20" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="#2563EB">PDF</text>
            </svg>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">PDF Studio</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">© {new Date().getFullYear()} PDF Studio. {t('footerNote')}</p>
        </div>
      </footer>
    </div>
  );
}
