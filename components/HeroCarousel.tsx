"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

const HeroCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      image: '/images/banner.jpg',
      title: 'Nuevos Vehiculos!',
      subtitle: 'Descubre un gran catalogo de vehículos.'
    },
    {
      image: '/images/banner2.jpg',
      title: 'Ofertas Exclusivas!',
      subtitle: 'Encuentra las mejores ofertas del mercado.'
    },
    {
      image: '/images/banner3.jpg',
      title: 'Vende tu Auto!',
      subtitle: 'Publica tu vehículo de forma rápida y sencilla.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
          </div>

          <div className="relative container mx-auto px-6 h-full flex items-center z-20">
            <div className="max-w-3xl text-left text-white">
              <h2 className="text-4xl sm:text-6xl font-extrabold leading-tight animate-fade-in">
                {slide.title}
              </h2>
              <p className="mt-4 text-xl sm:text-2xl font-light animate-fade-in-delay">
                {slide.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-delay-2">
                <a
                  href="/login"
                  className="inline-block rounded-full bg-white/90 px-8 py-3 text-sm font-semibold text-gray-900 backdrop-blur-md hover:bg-white hover:scale-105 transition-all shadow-lg"
                >
                  Inicia Sesión
                </a>
                <a
                  href="/shop"
                  className="inline-block rounded-full border-2 border-white px-8 py-3 text-sm font-semibold text-white hover:bg-white hover:text-gray-900 transition-all"
                >
                  Descubre nuestro catálogo
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - Mejorados */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white p-3 lg:p-4 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white p-3 lg:p-4 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
      </button>

      {/* Dots Indicator - Mejorado */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all focus:outline-none ${
              index === currentSlide
                ? 'w-8 bg-white shadow-lg'
                : 'w-3 bg-white/50 hover:bg-white/75 hover:scale-110'
            }`}
            aria-label={`Ir a diapositiva ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;