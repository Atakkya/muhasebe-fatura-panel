'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const FatuDemo = dynamic(() => import('@/components/FatuDemo'), { ssr: false })
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './Logo'

const GRADIENT = 'linear-gradient(135deg, #2456DB, #1ABC9C)'

function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{
        background: GRADIENT,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  )
}

function GradientBtn({ children, className = '', href }: { children: React.ReactNode; className?: string; href?: string }) {
  const cls = `inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 ${className}`
  if (href) {
    return (
      <a href={href} className={cls} style={{ background: GRADIENT }}>
        {children}
      </a>
    )
  }
  return (
    <button className={cls} style={{ background: GRADIENT }}>
      {children}
    </button>
  )
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo size="sm" />
        <nav
          className="hidden md:flex items-center gap-8 text-sm text-gray-600"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          <a href="#ozellikler" className="hover:text-gray-900 transition-colors">Özellikler</a>
          <a href="#nasil-calisir" className="hover:text-gray-900 transition-colors">Nasıl Çalışır</a>
          <a href="#fiyatlar" className="hover:text-gray-900 transition-colors">Fiyatlar</a>
          <a href="#sss" className="hover:text-gray-900 transition-colors">SSS</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Giriş Yap
          </a>
          <GradientBtn href="/register">Ücretsiz Başlat</GradientBtn>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <nav
            className="flex items-center gap-6 text-sm text-gray-500"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            <a href="#" className="hover:text-gray-700 transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Kullanım Koşulları</a>
            <a href="#" className="hover:text-gray-700 transition-colors">İletişim</a>
          </nav>
          <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-open-sans)' }}>
            2026 Fatu. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

function HeroSection() {
  return (
    <section className="pt-32 pb-24 px-6 bg-white text-center">
      <motion.div
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp}>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6 text-white"
            style={{ background: GRADIENT, fontFamily: 'var(--font-open-sans)' }}
          >
            AI Destekli Fatura Yönetimi
          </span>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Fatura işlemek{' '}
          <GradientText>5 saniye sürer</GradientText>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          QR kod veya PDF yükle, yapay zeka faturanı okusun. Cari hesaplar otomatik oluşsun, Excel ile aktar.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GradientBtn href="/register" className="text-base px-8 py-4 shadow-lg shadow-blue-200">
            Ücretsiz Dene — Kredi Kartı Gerekmez
          </GradientBtn>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            style={{ fontFamily: 'var(--font-open-sans)' }}
          >
            <span className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center">
              &#9654;
            </span>
            Demoyu İzle
          </a>
        </motion.div>
        <motion.p
          variants={fadeUp}
          className="mt-6 text-xs text-gray-400"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          1.200+ muhasebeci ve KOBİ tarafından kullanılıyor
        </motion.p>
      </motion.div>
    </section>
  )
}

function ProblemSection() {
  const stats = [
    { value: '4.7 saat', label: 'haftalık ortalama manuel fatura giriş süresi' },
    { value: '%34', label: 'faturalarda hata oranı manuel giriş ile' },
    { value: '₺18.000+', label: 'yıllık muhasebe hatalarından kaynaklanan kayıp' },
  ]
  return (
    <section className="py-20 px-6 bg-red-50">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Manuel fatura girişi sizi yavaşlatıyor
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-gray-500 mb-12 max-w-xl mx-auto"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Kopyala-yapıştır, yeniden yaz, hatalı kayıt. Her fatura dakikalar alıyor.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {stats.map((s) => (
            <motion.div
              key={s.value}
              variants={fadeUp}
              className="bg-white border border-red-200 rounded-2xl p-8"
            >
              <p
                className="text-4xl font-extrabold text-red-500 mb-2"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {s.value}
              </p>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-open-sans)' }}>
                {s.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: '🤖',
      title: 'AI Okuma',
      desc: 'QR kod veya PDF yükle, Claude AI anında tüm alanları doldursun. Vergi no, tutar, tarih — hepsi otomatik.',
    },
    {
      icon: '👥',
      title: 'Cari Sistemi',
      desc: 'Alıcı ve satıcılar otomatik tanımlanıyor. Geçmiş işlemleri, bakiye ve fatura geçmişini tek ekranda gör.',
    },
    {
      icon: '📊',
      title: 'Excel Export',
      desc: 'İstediğin faturaları seç, tek tıkla XLSX indir. Muhasebe programına aktarmak hiç bu kadar kolay olmamıştı.',
    },
  ]
  return (
    <section id="ozellikler" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Her şeyi <GradientText>otomatikleştirin</GradientText>
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-gray-500 mb-12 max-w-xl mx-auto"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Tekrarlayan işleri Fatu yapsın, siz işletmenize odaklanın.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="bg-gray-50 rounded-2xl p-8 text-left hover:shadow-lg transition-shadow"
            >
              <span className="text-4xl mb-4 block">{f.icon}</span>
              <h3
                className="text-xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-open-sans)' }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { num: 1, title: 'Fatura yükle', desc: 'QR kod fotoğrafını çekin veya PDF dosyanızı sürükleyin.' },
    { num: 2, title: 'AI okusun', desc: 'Yapay zeka saniyeler içinde tüm alanları doldurur, cariyi eşleştirir.' },
    { num: 3, title: 'Onayla ve kaydet', desc: 'Bir göz atın, istersen düzenleyin, kaydedin. Bitti.' },
  ]
  return (
    <section id="nasil-calisir" className="py-20 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          3 adımda başlayabilirsiniz
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-gray-500 mb-16"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Kurulum yok, eğitim yok. Hesap açın, başlayın.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-10"
        >
          {steps.map((s) => (
            <motion.div key={s.num} variants={fadeUp} className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl mb-4 shadow-lg"
                style={{ background: GRADIENT, fontFamily: 'var(--font-montserrat)' }}
              >
                {s.num}
              </div>
              <h3
                className="text-lg font-bold text-gray-900 mb-2"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {s.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: 'var(--font-open-sans)' }}>
                {s.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function DemoSection() {
  return (
    <section id="demo" className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Gerçek demoya bakın
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-gray-500 mb-10"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Canlı bir faturanın 5 saniyede işlenmesini izleyin.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <FatuDemo />
        </motion.div>
      </div>
    </section>
  )
}

function PricingSection() {
  const plans = [
    {
      name: 'Başlangıç',
      price: '0',
      desc: 'Denemeye başlayın',
      features: ['Ayda 10 fatura', 'AI okuma', 'Excel export', '-'],
      cta: 'Ücretsiz Başlat',
      popular: false,
    },
    {
      name: 'Temel',
      price: '299',
      desc: 'Küçük işletmeler için',
      features: ['Ayda 100 fatura', 'AI okuma', 'Excel export', 'Cari sistemi'],
      cta: 'Hemen Başlat',
      popular: false,
    },
    {
      name: 'Pro',
      price: '749',
      desc: 'Büyüyen şirketler için',
      features: ['Sınırsız fatura', 'AI okuma', 'Excel export', 'Cari sistemi + analiz'],
      cta: 'Pro Seç',
      popular: true,
    },
    {
      name: 'Kurumsal',
      price: '1499',
      desc: 'Büyük ekipler için',
      features: ['Her şey Pro\'da var +', 'API erişimi', 'Öncelikli destek', 'Özel entegrasyon'],
      cta: 'Bize Yazın',
      popular: false,
    },
  ]
  return (
    <section id="fiyatlar" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Sade fiyatlar, sürpriz yok
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-gray-500 mb-12"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          İstediğiniz zaman plan değiştirin veya iptal edin.
        </motion.p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {plans.map((p) => (
            <motion.div
              key={p.name}
              variants={fadeUp}
              className={`rounded-2xl p-6 text-left flex flex-col ${
                p.popular
                  ? 'text-white shadow-2xl scale-105'
                  : 'bg-white border border-gray-200 hover:shadow-md transition-shadow'
              }`}
              style={p.popular ? { background: GRADIENT } : {}}
            >
              {p.popular && (
                <span
                  className="text-xs font-bold bg-white/20 rounded-full px-3 py-1 mb-4 self-start"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                >
                  En Popüler
                </span>
              )}
              <p
                className={`text-sm font-semibold mb-1 ${p.popular ? 'text-white/80' : 'text-gray-500'}`}
                style={{ fontFamily: 'var(--font-open-sans)' }}
              >
                {p.name}
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span
                  className="text-4xl font-extrabold"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  &#8378;{p.price}
                </span>
                <span
                  className={`text-sm mb-1 ${p.popular ? 'text-white/70' : 'text-gray-400'}`}
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                >
                  /ay
                </span>
              </div>
              <p
                className={`text-xs mb-6 ${p.popular ? 'text-white/70' : 'text-gray-400'}`}
                style={{ fontFamily: 'var(--font-open-sans)' }}
              >
                {p.desc}
              </p>
              <ul className="space-y-2 mb-8 flex-1" style={{ fontFamily: 'var(--font-open-sans)' }}>
                {p.features.map((f) => (
                  <li
                    key={f}
                    className={`text-sm flex items-start gap-2 ${
                      f === '-' ? (p.popular ? 'text-white/30' : 'text-gray-200') : ''
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">{f === '-' ? '—' : p.popular ? '✓' : '✓'}</span>
                    {f !== '-' && f}
                  </li>
                ))}
              </ul>
              {p.popular ? (
                <a
                  href="/register"
                  className="block text-center py-3 rounded-xl bg-white font-bold text-sm transition-opacity hover:opacity-90"
                  style={{
                    fontFamily: 'var(--font-open-sans)',
                    background: 'linear-gradient(135deg, #2456DB, #1ABC9C)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    backgroundColor: 'white',
                  }}
                >
                  {p.cta}
                </a>
              ) : (
                <a
                  href="/register"
                  className="block text-center py-3 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-gray-400 transition-colors"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                >
                  {p.cta}
                </a>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

const FAQ_ITEMS = [
  { q: 'Ücretsiz plan ne kadar süre kullanılabilir?', a: 'Süresizdir. Ayda 10 fatura limitiyle sonsuza kadar ücretsiz kullanabilirsiniz.' },
  { q: 'Hangi fatura formatları destekleniyor?', a: 'E-Fatura QR kodları, PDF, JPG ve PNG formatlarındaki faturalar desteklenmektedir.' },
  { q: 'Verilerim güvenli mi?', a: 'Verileriniz Supabase altyapısında şifreli olarak saklanır. Üçüncü taraflarla paylaşılmaz.' },
  { q: 'AI okuma ne kadar doğru?', a: 'GİB standartlarındaki e-faturalarda %99 üzerinde doğrulukla çalışır. Diğer formatlar için %90+ başarı sağlanır.' },
  { q: 'Cari sistemi nedir?', a: 'Alıcı ve satıcılarınız otomatik olarak kaydedilir. Her carinin geçmiş faturaları, toplam işlem tutarı ve bakiyesi görüntülenebilir.' },
  { q: 'Excel exportu nasıl çalışır?', a: 'Listeden istediğiniz faturaları checkbox ile seçin, Export butonuna basın. Hazır XLSX dosyası indirilir.' },
  { q: 'Plan değiştirmek mümkün mü?', a: 'Evet, istediğiniz zaman planı yükseltin veya düşürün. Ödeme bir sonraki faturalama döneminizde güncellenir.' },
  { q: 'Entegrasyon desteği var mı?', a: 'API erişimi Kurumsal planda mevcuttur. Diğer entegrasyonlar için bizimle iletişime geçin.' },
]

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="sss" className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Sık sorulan sorular
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-gray-500 text-center mb-12"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Aradığınızı bulamazsanız bize yazın.
        </motion.p>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-2xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span
                  className="font-semibold text-gray-800 text-sm"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                >
                  {item.q}
                </span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400 text-xl leading-none shrink-0 ml-4"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p
                      className="px-6 pb-5 text-sm text-gray-500 leading-relaxed"
                      style={{ fontFamily: 'var(--font-open-sans)' }}
                    >
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section
      className="py-24 px-6 text-white text-center"
      style={{ background: GRADIENT }}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="max-w-3xl mx-auto"
      >
        <motion.h2
          variants={fadeUp}
          className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Şimdi başlayın, zaman kazanın
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="text-white/80 text-lg mb-10"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          İlk 10 faturanızı ücretsiz işleyin. Kredi kartı bilgisi gerekmez.
        </motion.p>
        <motion.div variants={fadeUp}>
          <a
            href="/register"
            className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-white font-bold text-base transition-opacity hover:opacity-90 shadow-xl"
            style={{
              fontFamily: 'var(--font-open-sans)',
              background: 'white',
              color: '#2456DB',
            }}
          >
            Ücretsiz Hesap Aç
          </a>
        </motion.div>
        <motion.p
          variants={fadeUp}
          className="mt-6 text-xs text-white/60"
          style={{ fontFamily: 'var(--font-open-sans)' }}
        >
          Kredi kartı gerekmez. İstediğiniz zaman iptal edebilirsiniz.
        </motion.p>
      </motion.div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DemoSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
