import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Columns3,
  CalendarDays,
  Users,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Zap,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Columns3,
    title: "קנבן חכם",
    description: "נהל לידים ועסקאות בלוח גרירה אינטואיטיבי. עקוב אחר כל שלב בצינור המכירות.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: CalendarDays,
    title: "יומן ותזכורות",
    description: "תזמן פגישות, קבע מעקבים אוטומטיים, ואל תפספס אף לקוח עם מערכת התזכורות.",
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500",
  },
  {
    icon: Users,
    title: "ניהול אנשי קשר",
    description: "ריכוז כל המידע על הלקוחות במקום אחד — היסטוריה, הערות, תדירות מעקב ועוד.",
    gradient: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-500",
  },
  {
    icon: BarChart3,
    title: "דוחות והכנסות",
    description: "צפה בהכנסות, עקוב אחר ביצועים, וקבל תמונה מלאה על מצב העסק בזמן אמת.",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
  },
];

function GlowOrb({ className }: { className?: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 pointer-events-none ${className}`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.2, 0.35, 0.2],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden" dir="rtl">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm">
              KF
            </div>
            <span className="text-xl font-extrabold tracking-tight">KeshFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">התחבר</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-1.5">
                התחל בחינם
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <GlowOrb className="h-[500px] w-[500px] bg-primary/40 -top-40 -start-40" />
        <GlowOrb className="h-[400px] w-[400px] bg-primary/30 bottom-0 end-0" />
        <GlowOrb className="h-[300px] w-[300px] bg-emerald-500/20 top-1/2 start-1/2" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              מערכת CRM חכמה לעסקים קטנים
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              נהל את קשרי הלקוחות
              <br />
              <span className="bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                והזרם את העסק קדימה
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
              KeshFlow הופך את ניהול הלקוחות לפשוט ויעיל.
              צינור מכירות חכם, יומן מובנה, מעקב אוטומטי — הכל במקום אחד כדי להגדיל הכנסות ולחסוך זמן.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth">
              <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all group">
                <Zap className="h-5 w-5 me-2 group-hover:scale-110 transition-transform" />
                התחל עכשיו בחינם
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 flex items-center justify-center gap-8 md:gap-16 text-center"
          >
            {[
              { value: "100%", label: "חינם לעסקים קטנים" },
              { value: "RTL", label: "תמיכה מלאה בעברית" },
              { value: "24/7", label: "גישה מכל מכשיר" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-black text-primary">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              כל מה שצריך כדי לנהל עסק מצליח
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              כלים חכמים שעובדים בשבילך — כדי שתוכל להתמקד במה שחשוב באמת.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="group relative rounded-2xl border border-border bg-card p-6 md:p-8 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                  {/* Glow on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4 ${feature.iconColor} group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28">
        <GlowOrb className="h-[600px] w-[600px] bg-primary/20 top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-3xl px-4 text-center"
        >
          <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-10 md:p-16">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              מוכן להגדיל את ההכנסות?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              הצטרף ל-KeshFlow היום והתחל לנהל את העסק שלך בצורה חכמה ויעילה יותר.
            </p>
            <Link to="/auth">
              <Button size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl shadow-lg shadow-primary/25">
                התחל עכשיו — בחינם
                <ArrowLeft className="h-5 w-5 ms-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs">
                KF
              </div>
              <span className="font-bold">KeshFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} KeshFlow. כל הזכויות שמורות.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/auth" className="hover:text-foreground transition-colors">התחבר</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">הרשמה</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
