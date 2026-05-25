/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { BaseText } from "@components/BaseText";
import { Tooltip } from "@webpack/common";

export function StockPluginsCard({ totalStockPlugins, enabledStockPlugins }) {
    const percentage = totalStockPlugins > 0 ? Math.round((enabledStockPlugins / totalStockPlugins) * 100) : 0;
    
    return (
        <div className="vc-plugin-stats vc-stockplugins-stats-card">
            <div className="vc-plugin-stats-header">
                <BaseText size="sm" weight="medium" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Plugin Statistics
                </BaseText>
                <div className="vc-plugin-stats-badge">
                    {percentage}% Active
                </div>
            </div>
            <div className="vc-plugin-stats-card-container">
                <div className="vc-plugin-stats-card-section">
                    <div className="vc-plugin-stats-icon vc-plugin-stats-icon-enabled">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div className="vc-plugin-stats-content">
                        <BaseText size="xs" weight="medium" style={{ color: "var(--text-muted)" }}>Enabled</BaseText>
                        <BaseText size="xxl" weight="bold" style={{ color: "var(--text-brand)" }}>{enabledStockPlugins}</BaseText>
                    </div>
                </div>
                <div className="vc-plugin-stats-card-divider"></div>
                <div className="vc-plugin-stats-card-section">
                    <div className="vc-plugin-stats-icon vc-plugin-stats-icon-total">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                    </div>
                    <div className="vc-plugin-stats-content">
                        <BaseText size="xs" weight="medium" style={{ color: "var(--text-muted)" }}>Total</BaseText>
                        <BaseText size="xxl" weight="bold">{totalStockPlugins}</BaseText>
                    </div>
                </div>
            </div>
            <div className="vc-plugin-stats-progress">
                <div className="vc-plugin-stats-progress-bar" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}

export function UserPluginsCard({ totalUserPlugins, enabledUserPlugins }) {
    if (totalUserPlugins === 0)
        return (
            <div className="vc-plugin-stats vc-stockplugins-stats-card vc-userplugins-empty">
                <div className="vc-plugin-stats-empty-content">
                    <div className="vc-plugin-stats-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <BaseText size="md" weight="semibold" style={{ color: "var(--text-muted)" }}>
                        No Userplugins Installed
                    </BaseText>
                    <BaseText size="sm" style={{ color: "var(--text-muted)", textAlign: "center" }}>
                        Install custom plugins to extend Luacord's functionality
                    </BaseText>
                </div>
            </div>
        );
    
    const percentage = totalUserPlugins > 0 ? Math.round((enabledUserPlugins / totalUserPlugins) * 100) : 0;
    
    return (
        <div className="vc-plugin-stats vc-stockplugins-stats-card vc-userplugins-card">
            <div className="vc-plugin-stats-header">
                <BaseText size="sm" weight="medium" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Userplugins
                </BaseText>
                <div className="vc-plugin-stats-badge vc-plugin-stats-badge-user">
                    {percentage}% Active
                </div>
            </div>
            <div className="vc-plugin-stats-card-container">
                <div className="vc-plugin-stats-card-section">
                    <div className="vc-plugin-stats-icon vc-plugin-stats-icon-enabled">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div className="vc-plugin-stats-content">
                        <BaseText size="xs" weight="medium" style={{ color: "var(--text-muted)" }}>Enabled</BaseText>
                        <BaseText size="xxl" weight="bold" style={{ color: "var(--text-brand)" }}>{enabledUserPlugins}</BaseText>
                    </div>
                </div>
                <div className="vc-plugin-stats-card-divider"></div>
                <div className="vc-plugin-stats-card-section">
                    <div className="vc-plugin-stats-icon vc-plugin-stats-icon-total">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                    </div>
                    <div className="vc-plugin-stats-content">
                        <BaseText size="xs" weight="medium" style={{ color: "var(--text-muted)" }}>Total</BaseText>
                        <BaseText size="xxl" weight="bold">{totalUserPlugins}</BaseText>
                    </div>
                </div>
            </div>
            <div className="vc-plugin-stats-progress">
                <div className="vc-plugin-stats-progress-bar vc-plugin-stats-progress-bar-user" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}
