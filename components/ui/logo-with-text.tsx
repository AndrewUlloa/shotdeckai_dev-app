import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoWithTextProps {
    variant?: "default" | "large" | "small";
}

export function LogoWithText({ variant = "default" }: LogoWithTextProps) {
    const logoSize = {
        default: { width: 32, height: 32 },
        large: { width: 48, height: 48 },
        small: { width: 24, height: 24 },
    }[variant];

    const textSize = {
        default: "text-2xl",
        large: "text-3xl",
        small: "text-xl",
    }[variant];

    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center">
                <Image
                    src="/favicon.ico"
                    alt="Logo"
                    width={logoSize.width}
                    height={logoSize.height}
                    className="rounded-[2px] mr-2 lg:rounded-sm mr-[10px]"
                />
                <h3 className={cn(
                    textSize,
                    "text-black font-supremeLLBold leading-[1.2rem] tracking-[-0.08em]"
                )}>
                    ShotDeckAI
                </h3>
            </div>
        </div>
    );
}
