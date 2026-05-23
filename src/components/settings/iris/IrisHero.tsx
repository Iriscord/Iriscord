/*
 * Iriscord settings hero banner
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PRODUCT_NAME, PRODUCT_SHORT_NAME } from "@shared/branding";
import type { ReactNode } from "react";

import { IrisMark } from "./IrisMark";

export interface IrisHeroProps {
    title: string;
    subtitle: ReactNode;
    badge?: string;
}

export function IrisHero({ title, subtitle, badge }: IrisHeroProps) {
    return (
        <header className="iris-hero">
            <div className="iris-hero-inner">
                <div className="iris-hero-icon">
                    <IrisMark />
                </div>
                <div>
                    <h2 className="iris-hero-title">{title}</h2>
                    <p className="iris-hero-sub">{subtitle}</p>
                    {badge !== false && (
                        <span className="iris-badge">
                            {badge ?? `${PRODUCT_SHORT_NAME} · ${PRODUCT_NAME}`}
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}
