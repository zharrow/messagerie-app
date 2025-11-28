interface OvOLogoProps {
  className?: string;
  size?: number;
}

const OvOLogo = ({ className = '', size = 32 }: OvOLogoProps) => {
  return (
    <img
      src="/logo.png"
      alt="OvO Logo"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default OvOLogo;
