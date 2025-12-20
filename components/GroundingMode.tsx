import React, { useState, useEffect } from 'react';
import { X, Eye, Hand, Ear, Coffee, Wind, CheckCircle, ArrowRight } from 'lucide-react';

interface GroundingModeProps {
  onClose: () => void;
}

const STEPS = [
  { id: 'breathe', title: "Let's Pause.", subtitle: "Match your breath to the circle.", color: "bg-blue-500", icon: Wind },
  { id: 'sight', count: 5, title: "5 Things You See", subtitle: "Look around. Tap the button for each item you identify.", color: "bg-indigo-500", icon: Eye },
  { id: 'touch', count: 4, title: "4 Things You Feel", subtitle: "The fabric of your chair, your feet on the floor...", color: "bg-purple-500", icon: Hand },
  { id: 'sound', count: 3, title: "3 Things You Hear", subtitle: "A car outside, a fan, your own breath...", color: "bg-pink-500", icon: Ear },
  { id: 'smell', count: 2, title: "2 Things You Smell", subtitle: "Or your favorite scents you can imagine.", color: "bg-orange-500", icon: Coffee },
  { id: 'taste', count: 1, title: "1 Good Thing", subtitle: "Name one thing you like about yourself.", color: "bg-green-500", icon: Heart },
  { id: 'complete', title: "You Are Here.", subtitle: "You are safe. You are grounded.", color: "bg-teal-600", icon: CheckCircle }
];

import { Heart } from 'lucide-react'; // Late import fix

const GroundingMode: React.FC<GroundingModeProps> = ({ onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [counter, setCounter] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100;

  const handleTap = () => {
    if (currentStep.count) {
      if (counter + 1 >= currentStep.count) {
        nextStep();
      } else {
        setCounter(c => c + 1);
      }
    }
  };

  const nextStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStepIndex(i => i + 1);
      setCounter(0);
      setIsTransitioning(false);
    }, 500);
  };

  // Breathing Timer for first step
  useEffect(() => {
    if (currentStep.id === 'breathe') {
      const timer = setTimeout(() => {
        nextStep();
      }, 10000); // 10s breathing intro
      return () => clearTimeout(timer);
    }
  }, [stepIndex]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center text-white transition-colors duration-1000 ${currentStep.color}`}>
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 pointer-events-none"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-white/5 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all z-20">
        <X className="w-6 h-6" />
      </button>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-2 bg-black/20 w-full">
        <div className="h-full bg-white/50 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      <div className={`relative z-10 max-w-md w-full px-8 text-center transition-all duration-500 transform ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        
        {/* Icon Header */}
        <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-lg shadow-2xl border border-white/20">
                <currentStep.icon className="w-10 h-10 text-white" />
            </div>
        </div>

        <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">{currentStep.title}</h2>
        <p className="text-lg md:text-xl text-white/80 font-medium mb-10 leading-relaxed">{currentStep.subtitle}</p>

        {/* Dynamic Content Area */}
        {currentStep.id === 'breathe' && (
           <div className="relative w-32 h-32 mx-auto mb-8">
               <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
               <div className="absolute inset-4 bg-white/40 rounded-full animate-pulse"></div>
               <div className="absolute inset-0 flex items-center justify-center font-bold tracking-widest text-sm uppercase">Inhale</div>
           </div>
        )}

        {currentStep.count && (
            <div className="space-y-6">
                <div className="flex justify-center gap-3 mb-8">
                    {Array.from({ length: currentStep.count }).map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < counter ? 'bg-white scale-125' : 'bg-white/20'}`}></div>
                    ))}
                </div>
                <button 
                    onClick={handleTap}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                    {counter + 1 >= currentStep.count ? <span className="flex items-center gap-2">Complete Section <ArrowRight className="w-5 h-5"/></span> : "I Found One"}
                </button>
            </div>
        )}

        {currentStep.id === 'complete' && (
            <button onClick={onClose} className="px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all shadow-lg hover:scale-105">
                Return to Dashboard
            </button>
        )}

      </div>
    </div>
  );
};

export default GroundingMode;