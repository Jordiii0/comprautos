"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCart, User, Menu, X, ChevronDown } from "lucide-react";

export default function Header() {
  const { cart } = useCart();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-lg border-b border-gray-100"
          : "bg-white/95 backdrop-blur-md border-b border-gray-200"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="group">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 shadow-md">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                    <polygon points="12 15 17 21 7 21 12 15" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  carNETwork
                </span>
                <div className="text-[10px] text-gray-500 font-medium tracking-wider -mt-1">
                  ComprAutos
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link href="/shop">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                Tienda
              </div>
            </Link>
            <Link href="/about">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                Sobre Nosotros
              </div>
            </Link>
            <Link href="/contact">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                Contacto
              </div>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Cart Button */}
            <Link href="/cart">
              <div className="relative group">
                <div className="p-2 lg:px-4 lg:py-2 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2">
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6 text-gray-700 group-hover:text-indigo-600 transition-colors" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-bounce">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:block text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">
                    Carrito
                  </span>
                </div>
              </div>
            </Link>

            {/* Profile Button */}
            <Link href="/profile">
              <div className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 group">
                <User className="w-5 h-5" />
                <span className="text-sm font-semibold">Mi Perfil</span>
              </div>
            </Link>

            {/* Mobile Profile Icon */}
            <Link href="/profile" className="lg:hidden">
              <div className="p-2 rounded-xl hover:bg-gray-100 transition-all">
                <User className="w-5 h-5 text-gray-700" />
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-all"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-1">
              <Link href="/shop" onClick={() => setIsMobileOpen(false)}>
                <div className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all font-medium">
                  Tienda
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </div>
              </Link>
              <Link href="/about" onClick={() => setIsMobileOpen(false)}>
                <div className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all font-medium">
                  Sobre Nosotros
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </div>
              </Link>
              <Link href="/contact" onClick={() => setIsMobileOpen(false)}>
                <div className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all font-medium">
                  Contacto
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </div>
              </Link>
              
              <div className="pt-4 mt-4 border-t border-gray-100">
                <Link href="/profile" onClick={() => setIsMobileOpen(false)}>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold">
                    <User className="w-5 h-5" />
                    <span>Mi Perfil</span>
                  </div>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}