import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Zap,
  BarChart3,
  Bell,
  Target,
  TrendingUp,
  Users,
  Shield,
  Clock,
  ChevronRight,
  CheckCircle2,
  Play,
  Star,
  ArrowRight,
  Sparkles,
  LineChart,
  Calculator,
  BookOpen,
  Layers,
  Radio,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Radio,
    title: 'Real-Time Live Scores',
    description: 'Track 50+ live matches simultaneously with instant score updates, minute markers, and live statistics.',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: BarChart3,
    title: 'Advanced Statistics',
    description: 'Deep dive into xG, shot maps, possession stats, and performance metrics for every match.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Calculator,
    title: 'Prediction Model',
    description: 'AI-powered match predictions using Poisson distribution, xG data, and form analysis.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Live Odds Comparison',
    description: 'Compare odds from 20+ bookmakers in real-time. Track movements and find the best value.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get notified about lineup changes, significant odds movements, and value opportunities.',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Target,
    title: 'Selection Tracker',
    description: 'Track your picks with full P&L analysis, win rate stats, and ROI calculations.',
    color: 'from-rose-500 to-red-500',
  },
]

const STATS = [
  { value: '500+', label: 'Leagues Covered' },
  { value: '50K+', label: 'Matches/Year' },
  { value: '20+', label: 'Bookmakers' },
  { value: '99.9%', label: 'Uptime' },
]

const TESTIMONIALS = [
  {
    quote: "Finally, a research tool that takes football analytics seriously. The xG predictions alone have transformed my approach.",
    author: "Marcus R.",
    role: "Professional Analyst",
    avatar: "MR",
  },
  {
    quote: "The live odds comparison saves me hours every week. I can spot value in seconds instead of minutes.",
    author: "Sarah K.",
    role: "Sports Trader",
    avatar: "SK",
  },
  {
    quote: "Clean interface, powerful data. The selection tracker helped me understand my betting patterns.",
    author: "James L.",
    role: "Research Enthusiast",
    avatar: "JL",
  },
]

const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [
      'Live scores & basic stats',
      'Top 5 leagues coverage',
      'Basic odds comparison',
      'Match notes',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For serious researchers',
    features: [
      'Everything in Starter',
      '500+ leagues worldwide',
      'Advanced xG & predictions',
      'Smart alerts system',
      'Selection tracker with P&L',
      'Saved screens & filters',
      'Priority support',
    ],
    cta: 'Start 7-Day Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams & organizations',
    features: [
      'Everything in Pro',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Team collaboration',
      'White-label options',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px]" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Zap className="w-6 h-6 text-[#0a0a0f]" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Football<span className="text-emerald-400">Insights</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/app"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/app"
              className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Now with AI-powered predictions</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              The Research Terminal
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                for Football
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Professional-grade analytics, live odds comparison, and AI predictions. 
              Everything you need to make data-driven decisions in one powerful terminal.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/app"
                className="group flex items-center gap-2 px-8 py-4 text-lg font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-1"
              >
                Launch Terminal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="flex items-center gap-2 px-8 py-4 text-lg text-gray-300 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Hero Image/Terminal Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl shadow-black/50 overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0f] border-b border-white/5">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-gray-500 ml-4">Football Insights Terminal</span>
              </div>
              {/* Terminal content mockup */}
              <div className="p-6 grid grid-cols-12 gap-4 min-h-[400px]">
                {/* Sidebar */}
                <div className="col-span-3 space-y-3">
                  <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
                  <div className="h-6 bg-emerald-500/20 rounded-lg w-3/4" />
                  <div className="h-6 bg-white/5 rounded-lg w-4/5" />
                  <div className="h-6 bg-white/5 rounded-lg w-2/3" />
                  <div className="h-6 bg-white/5 rounded-lg w-3/4" />
                  <div className="h-6 bg-white/5 rounded-lg w-4/5" />
                </div>
                {/* Main content */}
                <div className="col-span-5 space-y-4">
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">Live</div>
                    <div className="px-3 py-1.5 bg-white/5 rounded text-xs text-gray-400">Fixtures</div>
                    <div className="px-3 py-1.5 bg-white/5 rounded text-xs text-gray-400">Results</div>
                  </div>
                  <div className="space-y-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded" />
                          <div className="h-4 bg-white/10 rounded w-20" />
                        </div>
                        <div className="text-emerald-400 font-mono text-sm">
                          {i === 1 ? '2-1' : i === 2 ? '0-0' : i === 3 ? '1-3' : '2-2'}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-4 bg-white/10 rounded w-20" />
                          <div className="w-8 h-8 bg-white/10 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right panel */}
                <div className="col-span-4 bg-white/5 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-5 bg-white/10 rounded w-24" />
                    <div className="text-xs text-emerald-400">78'</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400">1.85</div>
                      <div className="text-xs text-gray-500">xG Home</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-cyan-400">1.42</div>
                      <div className="text-xs text-gray-500">xG Away</div>
                    </div>
                  </div>
                  <div className="h-24 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Powerful tools designed for serious football research. From live data to AI predictions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-24 px-6 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">
                Built for the
                <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Modern Analyst
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Our terminal-style interface puts the power of professional analytics at your fingertips. 
                Navigate through matches, compare odds, and track your research with keyboard shortcuts and a sleek, distraction-free UI.
              </p>
              <div className="space-y-4">
                {[
                  'Command palette for lightning-fast navigation',
                  'Dark mode optimized for long research sessions',
                  'Real-time updates without page refresh',
                  'Export data and notes anytime',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
              <div className="relative bg-[#12121a] rounded-2xl border border-white/10 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                    <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">⌘</kbd>
                    <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">K</kbd>
                  </div>
                  <span className="text-sm text-gray-500">Press to search</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <LineChart className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium">xG Analysis</div>
                      <div className="text-xs text-gray-500">View expected goals breakdown</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">Odds Comparison</div>
                      <div className="text-xs text-gray-500">Compare across bookmakers</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">Lineup Tracker</div>
                      <div className="text-xs text-gray-500">Monitor team news</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by Researchers
            </h2>
            <p className="text-gray-400 text-lg">
              See what our community has to say
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/5"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple Pricing
            </h2>
            <p className="text-gray-400 text-lg">
              Start free, upgrade when you need more
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-6 rounded-2xl ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/30' 
                    : 'bg-white/[0.03] border border-white/5'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-500">{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/app"
                  className={`block w-full py-3 text-center rounded-xl font-medium transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/25'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Level Up Your
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Football Research?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of analysts, traders, and enthusiasts who trust Football Insights for their research.
            </p>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-1"
            >
              Launch Terminal Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-gray-500 text-sm mt-6">
              No credit card required • Free tier available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#0a0a0f]" />
              </div>
              <span className="font-semibold">Football Insights</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 Football Insights. Research tool only.
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-amber-400/80">
              <Shield className="w-4 h-4" />
              <span>Gambling can be addictive. Please bet responsibly. 18+ only.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

