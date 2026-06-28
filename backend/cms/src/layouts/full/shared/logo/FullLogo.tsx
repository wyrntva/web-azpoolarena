

import LogoDark from "/src/assets/images/logos/azpoolarena-logo.png";
import LogoLight from "/src/assets/images/logos/azpoolarena-logo-white.png";
import { Link } from "react-router";

interface FullLogoProps {
  theme?: 'light' | 'dark';
}

const FullLogo = ({ theme = 'dark' }: FullLogoProps) => {
  const Logo = theme === 'light' ? LogoLight : LogoDark;
  return (
    <Link to={"/"} className="logo-link !bg-transparent !p-0 !rounded-none !shadow-none">
      <img src={Logo} alt="logo" className="block max-h-[28px] w-auto" />
    </Link>
  );
};

export default FullLogo;
