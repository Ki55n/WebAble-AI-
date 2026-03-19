"use client";

import { useState } from "react";
import Image from "next/image";
import AutomationForm from "./components/AutomationForm";

export default function Home() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-teal-50 text-gray-900">

      {/* NAVBAR */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">

          <div className="flex items-center gap-2">
            <Image
              src="/WebAble-logo2.png"
              width={36}
              height={36}
              alt="WebAble AI"
            />
            <span className="font-semibold text-lg">WebAble AI</span>
          </div>

          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-lg shadow"
          >
            Start Scan
          </button>

        </div>
      </header>


      {/* HERO */}
      <section className="pt-32 pb-12 px-6 text-center">

        <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-medium">
          THE INTELLIGENT GUARDIAN
        </span>

        <h1 className="mt-6 text-4xl md:text-6xl font-bold text-emerald-900 leading-tight">
          Build Websites That <br />
          Everyone Can Use
        </h1>

        <p className="mt-6 text-gray-600 max-w-xl mx-auto text-lg">
          WebAble AI automatically scans your website, detects accessibility
          issues, and generates developer-ready tickets.
        </p>

        <button
          onClick={() => setIsPanelOpen(true)}
          className="mt-8 bg-emerald-800 hover:bg-emerald-900 text-white px-8 py-4 rounded-xl shadow-lg text-lg font-semibold"
        >
          Start Free Scan →
        </button>

        <p className="text-sm text-gray-500 mt-3">
          No credit card required • GDPR Compliant
        </p>

      </section>


      {/* LIVE ANALYSIS CARD */}
      <section className="max-w-5xl mx-auto px-6">

        <div className="bg-gradient-to-br from-emerald-900 to-teal-800 rounded-2xl p-10 text-white shadow-xl">

          <p className="text-sm tracking-widest text-emerald-200">
            LIVE ANALYSIS
          </p>

          <div className="mt-4 bg-white/20 rounded-full h-3 w-full">
            <div className="bg-emerald-300 h-3 rounded-full w-2/3"></div>
          </div>

        </div>

      </section>


      {/* METRICS */}
      <section className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl p-8 shadow border">
          <h2 className="text-3xl font-bold text-emerald-900">98%</h2>
          <p className="text-gray-600 mt-1">Accuracy Rate</p>
        </div>

        <div className="bg-emerald-200 rounded-xl p-8 shadow">
          <h2 className="text-3xl font-bold text-emerald-900">1.2s</h2>
          <p className="text-gray-700 mt-1">Scan Speed</p>
        </div>

      </section>


      {/* FORM SECTION */}
      <section className="max-w-4xl mx-auto px-6 mt-16">

        <div className="bg-white rounded-2xl shadow-xl border p-8">

          <h2 className="text-3xl font-bold text-center text-emerald-900">
            Audit your site now
          </h2>

          <p className="text-gray-600 text-center mt-2 mb-8">
            Instantly identify accessibility gaps and compliance risks with our
            AI-powered engine.
          </p>

          <AutomationForm
            isPanelOpen={isPanelOpen}
            onPanelToggle={setIsPanelOpen}
          />

        </div>

      </section>


      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-6 mt-16">

        <div className="bg-gray-100 rounded-2xl p-10">

          <h3 className="text-2xl font-semibold mb-6">
            Why WebAble AI?
          </h3>

          <div className="space-y-6">

            <div>
              <h4 className="font-semibold text-lg">
                Auto-Remediation
              </h4>
              <p className="text-gray-600">
                Intelligent code suggestions that fix WCAG failures instantly.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg">
                Native Integrations
              </h4>
              <p className="text-gray-600">
                Connect with Jira, GitHub, Slack and CI/CD pipelines.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="bg-emerald-900 text-white mt-20">

        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">

          <div>
            <h4 className="font-semibold text-lg mb-4">
              WebAble AI
            </h4>
          </div>

          <div>
            <p className="font-semibold mb-2">Product</p>
            <p className="text-emerald-200">Features</p>
            <p className="text-emerald-200">Pricing</p>
            <p className="text-emerald-200">API</p>
          </div>

          <div>
            <p className="font-semibold mb-2">Legal</p>
            <p className="text-emerald-200">Accessibility</p>
            <p className="text-emerald-200">Privacy</p>
            <p className="text-emerald-200">Terms</p>
          </div>

        </div>

        <div className="text-center text-emerald-300 pb-6">
          © 2026 WebAble AI. All rights reserved.
        </div>

      </footer>

    </div>
  );
}