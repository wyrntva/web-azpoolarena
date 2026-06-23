"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

export default function SafeImage({ src, fallbackSrc = "/images/logo.png", alt, className, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const isFallback = imgSrc === fallbackSrc;

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  // Adjust className if fallback is active to prevent ugly zooming of the logo
  let finalClassName = className;
  if (isFallback && className) {
    finalClassName = className
      .replace(/\bobject-cover\b/, "object-contain bg-[#172339] p-6")
      .replace(/\bobject-fill\b/, "object-contain bg-[#172339] p-6");
    if (!finalClassName.includes("object-contain")) {
      finalClassName += " object-contain bg-[#172339] p-6";
    }
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      className={finalClassName}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}
