import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const slides = [
  {
    title: 'Download Anywhere',
    description: 'Save videos and audio from YouTube, TikTok, Instagram, and more with just one tap.',
    image: '/images/hero-mascot.png',
  },
  {
    title: 'Choose Your Format',
    description: 'Download as high-quality video up to 4K or extract audio-only MP3 files.',
    image: '/images/empty-mascot.png',
  },
  {
    title: 'Fast & Free',
    description: 'Lightning-fast downloads with no hidden fees. Your content, your way.',
    image: '/images/celebrate-mascot.png',
  },
];

export default function Onboarding() {
  const { dispatch } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      dispatch({ type: 'COMPLETE_ONBOARDING' });
    }
  };

  const goSkip = () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  };

  const slide = slides[currentSlide];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        backgroundImage: 'url(/images/onboarding-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Skip Button */}
      <div className="flex justify-end p-5 pt-12">
        <button
          onClick={goSkip}
          className="text-[14px] font-semibold text-[#6B7FA3] active:opacity-60 transition-opacity"
        >
          Skip
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            initial={{ x: direction * 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col items-center"
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-56 h-56 object-contain mb-8"
            />
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 mb-6">
              <span className="text-[12px] font-semibold text-[#F26B3A]">
                STEP {currentSlide + 1} OF {slides.length}
              </span>
            </div>
            <h2 className="text-[28px] font-bold text-[#1B2A4A] text-center leading-tight">
              {slide.title}
            </h2>
            <p className="text-[15px] text-[#6B7FA3] text-center mt-3 leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="px-8 pb-12">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-6 bg-[#F26B3A]' : 'w-2 bg-[#E2E8F0]'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={goNext}
          className="w-full h-14 bg-[#F26B3A] text-white text-base font-semibold rounded-2xl shadow-button flex items-center justify-center gap-2"
        >
          {currentSlide < slides.length - 1 ? (
            <>
              Next <span className="text-lg">→</span>
            </>
          ) : (
            'Get Started'
          )}
        </motion.button>
      </div>
    </div>
  );
}
