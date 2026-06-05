import Image from "next/image";

export function BrandMark({ size = 22 }: { size?: number; color?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Debug Dojo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}
