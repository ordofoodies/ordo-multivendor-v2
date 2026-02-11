import Image from "next/image";

export function AppLogo() {
  return (
    <div className="flex items-center justify-center relative p-2">
   <Image src="/assets/images/png/logo.png" alt="Logo" width={80} height={80} />

    
    </div>
  );
}
