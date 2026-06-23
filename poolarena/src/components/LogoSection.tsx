import Image from "next/image";

export const LogoSection = () => {
  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-64 h-16">
          <Image
            src="/images/logo-white.png"
            alt="Pool Arena Logo"
            fill
            sizes="256px"
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
};
