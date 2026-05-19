"use client";

export default function Logo({ size = "default" }: { size?: "default" | "large" }) {
  const isLarge = size === "large";

  return (
    <div className={`flex items-center ${isLarge ? "gap-3" : "gap-2"}`}>
      {/* Icon Mark */}
      <div className={`relative ${isLarge ? "w-10 h-10" : "w-8 h-8"}`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Rounded square background */}
          <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
          {/* Signal/OTA waves */}
          <path d="M20 28a2 2 0 100-4 2 2 0 000 4z" fill="white" />
          <path d="M14.5 21.5a7.5 7.5 0 0111 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 18a12 12 0 0118 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 14.5a16 16 0 0124 0" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#444CE7" />
              <stop offset="1" stopColor="#6172F3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {/* Text */}
      <div className="flex items-baseline">
        <span className={`font-bold tracking-tight text-gray-900 ${isLarge ? "text-2xl" : "text-lg"}`}>
          OTA
        </span>
        <span className={`font-medium text-primary-600 ${isLarge ? "text-2xl" : "text-lg"}`}>
          知识库
        </span>
      </div>
    </div>
  );
}
