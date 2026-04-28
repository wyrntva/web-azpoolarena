

import Logo from "/src/assets/images/logos/azpoolarena-logo.png";
import { Link } from "react-router";
const FullLogo = () => {
  return (
    <Link to={"/"}>
      <img src={Logo} alt="logo" className="block max-h-[40px] w-auto" />
    </Link>
  );
};

export default FullLogo;
