"use client";

import React, { useState, useEffect } from 'react';

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
      title: 'Where Style Meets Innovation',
      subtitle: 'Discover curated fashion and cutting-edge accessories.'
    },
    {
      image: '/images/banner2.jpg',
      title: 'Elevate Your Wardrobe',
      subtitle: 'Timeless pieces for the modern individual.'
    },
    {
      image: '/images/banner3.jpg',
      title: 'New Collection Arrives',
      subtitle: 'Explore the latest trends and exclusive designs.'
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
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
          </div>

          <div className="relative container mx-auto px-6 h-full flex items-center">
            <div className="max-w-3xl text-left text-white">
              <h2 className="text-4xl sm:text-6xl font-extrabold leading-tight animate-fade-in">
                {slide.title}
              </h2>
              <p className="mt-4 text-xl sm:text-2xl font-light animate-fade-in-delay">
                {slide.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-delay-2">
                <a
                  href="/about"
                  className="rounded-full bg-white/90 px-8 py-3 text-sm font-semibold text-gray-900 backdrop-blur-md hover:bg-white transition"
                >
                  Inicia Sesión
                </a>
                <a
                  href="/shop"
                  className="rounded-full border border-white px-8 py-3 text-sm font-semibold text-white hover:bg-white hover:text-gray-900 transition"
                >
                  Descubre nuestros catálogo
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-3 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.8s ease-out 0.4s both;
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel;