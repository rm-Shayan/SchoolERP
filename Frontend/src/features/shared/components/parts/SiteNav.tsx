"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Pricing", href: "#pricing" },
  { label: "Why us", href: "#why-us" },
  { label: "Get access", href: "#access" },
];

function BrandLogo() {
  return (
    <div className="flex h-16 items-center sm:h-20">
      <img
        src="/header.png"
        alt="SchoolERP"
        className="block h-full w-auto object-contain object-left"
      />
    </div>
  );
}

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#fafafa]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
   <Link
  href="/"
  onClick={() => setOpen(false)}
  className="flex shrink-0 items-center gap-2 py-0.5"
>
  <BrandLogo />

  <h3 className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
    SchoolERP
  </h3>
</Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-gray-500 md:flex">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors duration-200 hover:text-primary-700"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 sm:inline-flex"
          >
            Login
          </Link>
          <a
            href="#access"
            className="hidden items-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary-600/30 hover:brightness-110 sm:inline-flex"
          >
            Get your school portal
          </a>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-200 bg-[#fafafa] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1 text-sm font-semibold text-gray-600">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 transition hover:bg-gray-50 hover:text-primary-700"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Login
              </Link>
              <a
                href="#access"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3 font-bold text-white shadow-lg"
              >
                Get your school portal
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
