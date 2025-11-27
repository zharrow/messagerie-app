interface OvOLogoProps {
  className?: string;
  size?: number;
}

const OvOLogo = ({ className = '', size = 32 }: OvOLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Owl head shape (heart-like) */}
      <path
        d="M128 220C128 220 50 180 50 110C50 70 70 50 90 50C110 50 128 70 128 70C128 70 146 50 166 50C186 50 206 70 206 110C206 180 128 220 128 220Z"
        fill="currentColor"
      />

      {/* Left eye outer */}
      <circle cx="90" cy="100" r="35" fill="white" />

      {/* Right eye outer */}
      <circle cx="166" cy="100" r="35" fill="white" />

      {/* Left pupil */}
      <circle cx="90" cy="100" r="18" fill="currentColor" />

      {/* Right pupil */}
      <circle cx="166" cy="100" r="18" fill="currentColor" />

      {/* Left eyebrow */}
      <path
        d="M60 65C60 65 70 45 95 50"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right eyebrow */}
      <path
        d="M196 65C196 65 186 45 161 50"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />

      {/* Small beak */}
      <path
        d="M128 120L120 135L128 140L136 135Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default OvOLogo;
