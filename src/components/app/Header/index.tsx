"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, SunDim } from "lucide-react";

const Header = () => {
  const { setTheme, theme } = useTheme();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header className="bg-neutral-100 dark:bg-neutral-900 sticky top-0 z-50 w-full border-b max-h-[64px]">
      <div className="container flex justify-between items-center h-16 max-w-screen-2xl">
        <Link
          className="flex items-center space-x-2"
          href={"/"}
          prefetch={false}
        >
          <Avatar className="border m-r-1 bg-white" style={{ scale: 1.1 }}>
            <AvatarImage src={"/images/logo.png"} />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="relative">
            GitHub Actions Dashboard
            <div
              className="absolute top-3/4 left-0 text-[11px] text-gray-400"
              style={{ transform: "translateY(2px)" }}
            >
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </div>
          </div>
        </Link>
        <span
          className="cursor-pointer text-primary p-1 rounded border"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <SunDim className="scale-75" />
          ) : (
            <Moon className="scale-75" />
          )}
        </span>
      </div>
    </header>
  );
};

export default Header;
