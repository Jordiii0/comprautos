"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const { cart } = useCart();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-12">
            <Link href="/">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                carNETwork
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
              <Link href="/shop" className="hover:text-black transition">
                Tienda
              </Link>
              <Link href="/about" className="hover:text-black transition">
                Sobre Nosotros
              </Link>
              <Link href="/contact" className="hover:text-black transition">
                Contactos
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-200/50 transition"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    isMobileOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>

            <Link href="/cart">
              <div className="relative p-2 rounded-full hover:bg-gray-200/50 transition">
                <svg
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>

            <Link href="/profile">
              <div className="hidden md:flex items-center space-x-2 p-2 rounded-full hover:bg-gray-200/50 transition">
                <svg
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-xs">Perfil</span>
              </div>
            </Link>
          </div>
        </div>

        {isMobileOpen && (
          <nav className="md:hidden mt-4 flex flex-col space-y-3 text-sm font-medium text-gray-700">
            <Link href="/shop" className="hover:text-black transition">
              Teinda
            </Link>
            <Link href="/about" className="hover:text-black transition">
              Sobre Nosotros
            </Link>
            <Link href="/contact" className="hover:text-black transition">
              Contactos
            </Link>
            <Link href="/login" className="hover:text-black transition">
              Iniciar Sesión
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
