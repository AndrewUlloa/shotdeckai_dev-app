import React from "react";
import Image from "next/image";

export function LogoWithText() {
    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center">
                <Image
                    src="/favicon.ico"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="mr-2"
                />
                <h3 className="text-2xl text-black font-supremeLLBold tracking-[-0.08em]">
                    ShotDeckAI
                </h3>
            </div>
        </div>
    );
}
