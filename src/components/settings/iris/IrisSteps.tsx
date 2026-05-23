/*
 * Numbered step list for Iriscord settings
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ReactNode } from "react";

export interface IrisStepItem {
    title: string;
    description: ReactNode;
}

export function IrisSteps({ steps }: { steps: IrisStepItem[] }) {
    return (
        <ol className="iris-steps">
            {steps.map((step, i) => (
                <li key={i} className="iris-step">
                    <span className="iris-step-num">{i + 1}</span>
                    <div className="iris-step-body">
                        <strong>{step.title}</strong>
                        <span>{step.description}</span>
                    </div>
                </li>
            ))}
        </ol>
    );
}
