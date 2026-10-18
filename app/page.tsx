'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePrograms } from '@/lib/hooks/usePrograms';
import ProgramCard from '@/components/programs/ProgramCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';

import LandingNavbar from '@/components/layout/LandingNavbar';
import Logo from '@/components/ui/Logo';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { data: programsData, isLoading: programsLoading } = usePrograms();

  const featuredPrograms = programsData?.pages[0]?.programs.slice(0, 3) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a]" suppressHydrationWarning>
      <LandingNavbar />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1a1a1a] text-white min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-6xl lg:text-8xl font-black tracking-tight mb-6 leading-tight">
                    Master <br />
                    Life Skills <br />
                    with <span className="inline-flex">ARAE LMS</span>
                  </h1>
                  <p className="text-xl lg:text-2xl font-medium mb-8 max-w-2xl leading-relaxed">
                    ARAE LMS — interactive learning, real experiences, and events
                  </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link href="/programs">
                    <Button size="lg" className="w-full sm:w-auto !bg-white !text-indigo-900 hover:!bg-indigo-50 border-none shadow-lg shadow-indigo-900/20 font-bold">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/programs">
                      <Button size="lg" className="w-full sm:w-auto !bg-white !text-indigo-900 hover:!bg-indigo-50 border-none shadow-lg shadow-indigo-900/20 font-bold">
                        Explore Programs
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto border-indigo-400 text-indigo-100 hover:bg-indigo-800/50 hover:text-white">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                <div className="space-y-4">
                  <div className="h-48 bg-indigo-800/50 rounded-xl animate-pulse"></div>
                  <div className="h-4 bg-indigo-800/50 rounded w-3/4"></div>
                  <div className="h-4 bg-indigo-800/50 rounded w-1/2"></div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-500 rounded-full blur-xl opacity-50"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500 rounded-full blur-xl opacity-50"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="py-24 bg-white dark:bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Featured Programs</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover our most popular educational series designed to inspire and engage.
            </p>
          </div>

          {programsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredPrograms.map((program: any, index: number) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProgramCard program={program} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/programs">
              <Button variant="outline" size="lg">View All Programs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features / Why ARAE LMS */}
      <section className="py-24 bg-gray-50 dark:bg-[#1e293b]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'Interactive Learning',
                description: 'Master skills through practice with comics, game boards, and gameshows—not just memorization.',
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: 'bg-orange-500'
              },
              {
                title: 'Real Experiences',
                description: 'Unforgettable lessons and life skills designed to benefit students for the rest of their lives.',
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                ),
                color: 'bg-blue-500'
              },
              {
                title: 'Corporate & School Events',
                description: 'Bridging the gap between companies and education through tailored workshops and events.',
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                color: 'bg-purple-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white dark:bg-white/5 border border-transparent dark:border-white/10 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg transform -rotate-3`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 bg-indigo-900 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Learning?</h2>
          <p className="text-xl text-indigo-200 mb-10">
            Join thousands of students and educators transforming their educational journey today.
          </p>
          <Link href={user ? "/programs" : "/login"}>
            <Button size="lg" className="!bg-white !text-indigo-900 hover:!bg-indigo-50 border-none px-12 py-4 text-lg shadow-xl font-bold">
              {user ? "Continue Learning" : "Join Now - It's Free"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111827] text-gray-400 py-16 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <Logo size="text-2xl" />
              </Link>
              <p className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
                ARAE LMS — Mastering life skills through interactive learning, real experiences, and corporate/school events.
              </p>
            </div>

            {/* Navigation Column */}
            <div>
              <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Navigation</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">About</Link>
                </li>
                <li>
                  <Link href="/contacts" className="hover:text-white transition-colors">Contacts</Link>
                </li>
                <li>
                  <Link href="/programs" className="hover:text-white transition-colors">Dashboard</Link>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()} ARAE LMS. All rights reserved.
            </p>
            <p className="text-gray-500 flex items-center gap-1">
              Made with <span className="text-red-500 animate-pulse">❤️</span> for future leaders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
