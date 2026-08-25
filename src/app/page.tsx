"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Coins,
  Cpu,
  Download,
  Gamepad2,
  Gem,
  Globe,
  Layers,
  Play,
  Quote,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

/* ------------------------------ helpers ---------------------------- */

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

function HeroBall({
  className,
  delay = 0,
  color = "#e53935",
  number,
  stripe = false,
  size = 72,
}: {
  className?: string;
  delay?: number;
  color?: string;
  number?: number;
  stripe?: boolean;
  size?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.7 }}
      className={`absolute pointer-events-none ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <motion.div
        animate={{ y: [0, -22, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, delay, ease: "easeInOut" }}
        className="relative size-full rounded-full"
        style={{
          background: stripe
            ? `radial-gradient(circle at 34% 30%, #ffffff 0%, #f0ede2 38%, #b9b5a6 75%, #6b6759 100%)`
            : `radial-gradient(circle at 34% 30%, ${color} 0%, ${color} 38%, rgba(0,0,0,0.55) 130%)`,
          boxShadow:
            "0 18px 40px rgba(0,0,0,0.55), inset -6px -10px 24px rgba(0,0,0,0.4), inset 4px 6px 12px rgba(255,255,255,0.25)",
        }}
      >
        {stripe && (
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: `linear-gradient(to bottom, transparent 26%, ${color} 26%, ${color} 74%, transparent 74%)`,
            }}
          />
        )}
        {number !== undefined && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: "translateY(-1px)" }}
          >
            <span className="flex items-center justify-center rounded-full bg-[#f4f1e6] text-[#20242e] font-bold font-latin shadow-inner"
              style={{ width: size * 0.44, height: size * 0.44, fontSize: size * 0.2 }}
            >
              {number}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------- navbar ---------------------------- */

function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <div className="glass border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <span className="relative flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-glow">
              <span className="size-5 rounded-full bg-[#0a0d1a] flex items-center justify-center">
                <span className="size-2 rounded-full bg-primary" />
              </span>
            </span>
            <span className="font-display text-lg tracking-wide">کیوورس</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
            <a href="#games" className="hover:text-primary transition-colors cursor-pointer">بازی‌ها</a>
            <a href="#features" className="hover:text-primary transition-colors cursor-pointer">امکانات</a>
            <a href="/shop" className="hover:text-primary transition-colors cursor-pointer">فروشگاه</a>
            <a href="/wallet" className="hover:text-primary transition-colors cursor-pointer">کیف پول</a>
          </nav>
          <Link href="/play" className="btn-primary !py-2.5 !px-5 text-sm">
            <Play className="size-4" />
            بازی کن
          </Link>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------- hero ----------------------------- */

function Hero() {
  return (
    <section className="relative min-h-dvh flex items-center overflow-hidden">
      {/* background */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-billiards.jpg"
          alt="میز بیلیارد حرفه‌ای"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/55 to-bg" />
        <div className="absolute inset-0 bg-gradient-to-l from-bg/60 via-transparent to-bg/30" />
      </div>

      {/* floating balls — motion graphics */}
      <HeroBall className="top-[18%] left-[6%] hidden md:block" delay={0.9} color="#fdd835" number={9} stripe size={84} />
      <HeroBall className="top-[58%] left-[14%] hidden lg:block" delay={1.4} color="#1e88e5" number={2} size={56} />
      <HeroBall className="top-[24%] right-[8%] hidden md:block" delay={1.1} color="#43a047" number={6} stripe size={66} />
      <HeroBall className="bottom-[20%] right-[16%] hidden lg:block" delay={1.7} color="#15171f" number={8} size={90} />
      <HeroBall className="top-[70%] right-[38%] hidden sm:block" delay={2} color="#e53935" number={3} size={44} />

      {/* content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 w-full pt-24 pb-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-primary mb-6"
          >
            <Sparkles className="size-3.5" />
            موتور فیزیک سه‌بعدی — تجربه‌ای که لمس می‌شود
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.15] mb-6"
          >
            بیلیارد را در
            <br />
            <span className="text-gradient-green">بهترین حالتش</span> تجربه کن
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-muted text-base sm:text-lg leading-8 mb-8 max-w-xl"
          >
            اسنوکر، ۸ توپ و ۹ توپ با گرافیک سه‌بعدی خیره‌کننده. با هوش مصنوعی
            بازی کن، دوستانت را با شناسه بازیکن دعوت کن و با ارز دیجیتال داخلی،
            آیتم‌های حرفه‌ای جمع کن.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 mb-12"
          >
            <Link href="/play" className="btn-primary text-lg">
              <Play className="size-5" />
              شروع رایگان بازی
            </Link>
            <a href="#install" className="btn-gold">
              <Download className="size-5" />
              نصب اپلیکیشن
            </a>
          </motion.div>

          {/* stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="grid grid-cols-3 gap-4 max-w-md"
          >
            {[
              { n: "+۵۰۰K", t: "بازیکن فعال" },
              { n: "۳", t: "حالت بازی" },
              { n: "۴.۸", t: "امتیاز کاربران" },
            ].map((s) => (
              <div key={s.t} className="glass rounded-2xl px-4 py-3 text-center">
                <div className="font-latin text-2xl font-bold text-gradient-gold">{s.n}</div>
                <div className="text-[11px] text-muted mt-1">{s.t}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* scroll hint */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted"
      >
        <ArrowLeft className="size-5 rotate-90" />
      </motion.div>
    </section>
  );
}

/* ------------------------------ marquee ---------------------------- */

function Marquee() {
  const items = [
    "اسنوکر حرفه‌ای",
    "۸ توپ کلاسیک",
    "۹ توپ سریع",
    "موتور فیزیک واقعی",
    "بازی با هوش مصنوعی",
    "دعوت دوستان",
    "نصب روی موبایل",
    "گرافیک سه‌بعدی",
  ];
  const row = [...items, ...items];
  return (
    <div className="relative border-y border-line bg-surface/60 py-4 overflow-hidden">
      <div className="flex w-max animate-marquee gap-8">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8 text-sm text-muted whitespace-nowrap">
            {t}
            <Star className="size-3.5 text-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- games ----------------------------- */

const GAMES = [
  {
    id: "8ball",
    name: "۸ توپ",
    desc: "کلاسیک‌ترین حالت بیلیارد: توپ‌های رنگی در برابر خط‌دار و ضربه نهایی به توپ ۸",
    img: "/images/mode-8ball.jpg",
    players: "۲ نفره",
  },
  {
    id: "9ball",
    name: "۹ توپ",
    desc: "هیجان سرعتی با قانون ضربه به کم‌ترین شماره — دقیق، سریع و پرتعادل",
    img: "/images/mode-9ball.jpg",
    players: "۲ نفره",
  },
  {
    id: "snooker",
    name: "اسنوکر",
    desc: "بازی ذهن و استراتژی با امتیازشماری رسمی: قرمز‌ها، رنگ‌ها و توالی حرفه‌ای",
    img: "/images/mode-snooker.jpg",
    players: "۲ نفره",
  },
];

function Games() {
  return (
    <section id="games" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-primary text-sm mb-3">
            <Gamepad2 className="size-4" />
            حالت‌های بازی
          </div>
          <h2 className="font-display text-3xl sm:text-4xl mb-4">
            سه دنیا، <span className="text-gradient-green">یک میز</span>
          </h2>
          <p className="text-muted max-w-xl mx-auto leading-7">
            هر حالت با قوانین کامل، فیزیک اختصاصی و رابط کاربری مخصوص خودش
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {GAMES.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1 }}
              className="card-3d group relative rounded-3xl overflow-hidden border border-line bg-surface cursor-pointer"
            >
              <Link href="/play" className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={g.img}
                    alt={g.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                  <span className="absolute top-4 right-4 glass rounded-full px-3 py-1 text-xs flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {g.players}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl mb-2 group-hover:text-primary transition-colors">
                    {g.name}
                  </h3>
                  <p className="text-sm text-muted leading-7">{g.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-primary text-sm font-bold mt-4">
                    بازی کن
                    <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ features --------------------------- */

const FEATURES = [
  {
    icon: Layers,
    title: "گرافیک سه‌بعدی واقع‌گرایانه",
    desc: "توپ‌های براق با سایه و هایلایت واقعی، میز چوبی با بافت طبیعی و نورپردازی سینمایی",
  },
  {
    icon: Cpu,
    title: "موتور فیزیک اختصاصی",
    desc: "برخورد الاستیک توپ‌ها، اصطکاک میز، برگشت از لبه‌ها و پاکت‌های واقعی — همه در ۶۰ فریم بر ثانیه",
  },
  {
    icon: Bot,
    title: "حریف هوش مصنوعی",
    desc: "سه سطح دشواری با الگوریتم نشانه‌گیری گوست‌بال؛ از تمرین تا چالش جدی",
  },
  {
    icon: Globe,
    title: "بازی با دوستان",
    desc: "حریف را با شناسه بازیکن دعوت کنید؛ دعوت‌نامه می‌رود و بازی شروع می‌شود",
  },
  {
    icon: Coins,
    title: "کیف پول و ارز دیجیتال",
    desc: "شارژ کیف پول و خرید کیو، میز و گونه با سکه و جواهر — بدون نیاز به حساب کاربری",
  },
  {
    icon: Smartphone,
    title: "قابل نصب روی موبایل",
    desc: "روی اندروید و آیفون مثل یک اپ واقعی نصب می‌شود؛ آفلاین هم بازی کنید",
  },
];

function Features() {
  return (
    <section id="features" className="relative py-24 bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-primary text-sm mb-3">
            <Zap className="size-4" />
            چرا کیوورس؟
          </div>
          <h2 className="font-display text-3xl sm:text-4xl mb-4">
            ساخته شده برای <span className="text-gradient-gold">حرفه‌ای‌ها</span>
          </h2>
          <p className="text-muted max-w-xl mx-auto leading-7">
            هر جزئیات، از حرکت توپ تا صدای برخورد، با وسواس طراحی شده
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.08 }}
              className="card-3d rounded-3xl border border-line bg-surface p-7"
            >
              <div className="rounded-2xl bg-primary/10 w-fit p-3.5 mb-5">
                <f.icon className="size-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-7">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ install ---------------------------- */

function Install() {
  return (
    <section id="install" className="relative py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative rounded-[2rem] overflow-hidden border border-line shadow-2xl">
              <Image
                src="/images/app-devices.jpg"
                alt="اپلیکیشن کیوورس روی موبایل و تبلت"
                width={900}
                height={700}
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/50 to-transparent" />
            </div>
            {/* floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-5 -right-4 glass-strong rounded-2xl px-4 py-3 flex items-center gap-2 text-sm"
            >
              <Wifi className="size-5 text-primary" />
              بازی آنلاین با دوستان
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-5 -left-4 glass-strong rounded-2xl px-4 py-3 flex items-center gap-2 text-sm"
            >
              <ShieldCheck className="size-5 text-accent" />
              بدون تبلیغات مزاحم
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 text-primary text-sm mb-3">
              <Download className="size-4" />
              نصب روی اندروید و iOS
            </div>
            <h2 className="font-display text-3xl sm:text-4xl mb-5 leading-snug">
              کیوورس را مثل یک اپ واقعی
              <span className="text-gradient-green"> نصب کنید</span>
            </h2>
            <p className="text-muted leading-8 mb-8">
              کیوورس یک وب‌اپ پیشرفته (PWA) است؛ روی اندروید با یک دکمه نصب
              می‌شود و روی آیفون از منوی اشتراک‌گذاری سافاری. آیکونش روی صفحه
              اصلی گوشی شما می‌نشیند و تمام‌صفحه و روان اجرا می‌شود.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4">
                <span className="rounded-xl bg-primary/10 p-2.5 shrink-0">
                  <Smartphone className="size-5 text-primary" />
                </span>
                <div>
                  <div className="font-bold text-sm mb-1">اندروید — کروم</div>
                  <div className="text-xs text-muted leading-6">
                    روی دکمه «نصب اپلیکیشن» پایین صفحه بزنید یا از منوی مرورگر
                    گزینه Add to Home screen را انتخاب کنید.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4">
                <span className="rounded-xl bg-accent/10 p-2.5 shrink-0">
                  <Smartphone className="size-5 text-accent" />
                </span>
                <div>
                  <div className="font-bold text-sm mb-1">آیفون — سافاری</div>
                  <div className="text-xs text-muted leading-6">
                    دکمه اشتراک‌گذاری را بزنید و «افزودن به صفحه اصلی» (Add to
                    Home Screen) را انتخاب کنید.
                  </div>
                </div>
              </div>
            </div>

            <Link href="/play" className="btn-gold">
              <Play className="size-5" />
              همین حالا بازی کن
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- wallet strip -------------------------- */

function WalletSection() {
  return (
    <section className="relative py-24 bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 text-primary text-sm mb-3">
              <Coins className="size-4" />
              اقتصاد بازی
            </div>
            <h2 className="font-display text-3xl sm:text-4xl mb-5 leading-snug">
              کیف پول، سکه و جواهر —
              <span className="text-gradient-gold"> اقتصاد واقعی بازی</span>
            </h2>
            <p className="text-muted leading-8 mb-8">
              کیف پول خود را شارژ کنید و با ارز دیجیتال داخلی از فروشگاه خرید
              کنید: کیوهای افسانه‌ای، میزهای خاص و گونه‌های اسپین‌دار. هر
              بازیکن با ثبت‌نام ۲,۵۰۰ سکه هدیه می‌گیرد.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/wallet" className="btn-primary">
                <Coins className="size-5" />
                شارژ کیف پول
              </Link>
              <Link href="/shop" className="btn-ghost">
                <Gem className="size-5" />
                فروشگاه آیتم
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: Coins, label: "۱,۰۰۰ سکه", price: "۴۹ هزار تومان" },
              { icon: Sparkles, label: "۵,۰۰۰ سکه + ۵ جواهر", price: "۱۹۹ هزار تومان", hot: true },
              { icon: Gem, label: "۱۲,۰۰۰ سکه + ۱۵ جواهر", price: "۴۴۹ هزار تومان" },
              { icon: Trophy, label: "۳۰,۰۰۰ سکه + ۴۰ جواهر", price: "۹۹۰ هزار تومان" },
            ].map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`card-3d rounded-3xl border p-6 relative ${
                  p.hot ? "border-primary shadow-glow" : "border-line bg-surface"
                }`}
              >
                {p.hot && (
                  <span className="absolute -top-3 right-4 rounded-full bg-primary text-[#06220f] text-[11px] font-bold px-3 py-1">
                    محبوب‌ترین
                  </span>
                )}
                <p.icon className={`size-8 mb-4 ${p.hot ? "text-primary" : "text-accent"}`} />
                <div className="font-bold text-sm mb-1 leading-6">{p.label}</div>
                <div className="text-xs text-muted">{p.price}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- testimonials ------------------------- */

const TESTIMONIALS = [
  {
    name: "امیر رضایی",
    role: "بازیکن حرفه‌ای اسنوکر",
    text: "فیزیک توپ‌ها واقعاً واقعیه؛ حتی اسپین و زاویه برگشت هم مثل میز واقعیه. بهترین بازی بیلیارد ایرانی که تا حالا دیدم.",
  },
  {
    name: "نگار محمدی",
    role: "گیمر موبایل",
    text: "روی گوشی بدون هیچ مشکلی اجرا می‌شه و گرافیکه موبیلم رو چپال کرده. با دوستم آنلاین بازی می‌کنیم هر شب.",
  },
  {
    name: "سعید کریمی",
    role: "قهرمان استانی بیلیارد",
    text: "حالت اسنوکر با امتیازشماری درست و توالی رنگ‌ها دقیقاً مثل قوانین واقعیه. برای تمرین ذهنی عالیه.",
  },
];

function Testimonials() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-primary text-sm mb-3">
            <Quote className="size-4" />
            حرف‌های بازیکن‌ها
          </div>
          <h2 className="font-display text-3xl sm:text-4xl">
           Community <span className="text-gradient-green">کیوورس</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1 }}
              className="card-3d rounded-3xl border border-line bg-surface p-7"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="size-4 text-accent fill-accent" />
                ))}
              </div>
              <p className="text-sm text-muted leading-8 mb-6">{t.text}</p>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 font-bold">
                  {t.name[0]}
                </span>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- CTA ------------------------------- */

function FinalCTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-billiards.jpg"
          alt=""
          fill
          className="object-cover opacity-25"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/80 to-bg" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <motion.div {...fadeUp}>
          <Target className="size-12 mx-auto text-primary mb-6" />
          <h2 className="font-display text-3xl sm:text-5xl mb-5 leading-snug">
            آماده‌ای <span className="text-gradient-gold">شروع‌کننده</span> باشی؟
          </h2>
          <p className="text-muted leading-8 mb-8 max-w-xl mx-auto">
            بدون نصب، بدون ثبت‌نام — یک کلیک تا اولین ضربه. میز منتظر توست.
          </p>
          <Link href="/play" className="btn-primary text-lg">
            <Play className="size-5" />
            ورود به میز بازی
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------ footer ----------------------------- */

function Footer() {
  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="relative flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark">
                <span className="size-5 rounded-full bg-[#0a0d1a] flex items-center justify-center">
                  <span className="size-2 rounded-full bg-primary" />
                </span>
              </span>
              <span className="font-display text-lg">کیوورس</span>
            </div>
            <p className="text-sm text-muted leading-7">
              پلتفرم بازی بیلیارد سه‌بعدی — اسنوکر، ۸ توپ و ۹ توپ با موتور
              فیزیک اختصاصی و گرافیک نسل جدید.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">بازی</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li><Link href="/play" className="hover:text-primary transition-colors cursor-pointer">۸ توپ</Link></li>
              <li><Link href="/play" className="hover:text-primary transition-colors cursor-pointer">۹ توپ</Link></li>
              <li><Link href="/play" className="hover:text-primary transition-colors cursor-pointer">اسنوکر</Link></li>
              <li><Link href="/play" className="hover:text-primary transition-colors cursor-pointer">بازی با هوش مصنوعی</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">اکونومی</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li><Link href="/wallet" className="hover:text-primary transition-colors cursor-pointer">شارژ کیف پول</Link></li>
              <li><Link href="/shop" className="hover:text-primary transition-colors cursor-pointer">فروشگاه آیتم</Link></li>
              <li><span className="text-muted/60">جداول رده‌بندی (به‌زودی)</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">پشتیبانی</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li><span className="text-muted/60">راهنمای نصب</span></li>
              <li><span className="text-muted/60">قوانین بازی</span></li>
              <li><span className="text-muted/60">تماس با ما</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <span>© ۱۴۰۳ کیوورس — تمام حقوق محفوظ است</span>
          <span className="font-latin tracking-widest">CUEVERSE BILLIARDS</span>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------- page ----------------------------- */

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Marquee />
      <Games />
      <Features />
      <Install />
      <WalletSection />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}
