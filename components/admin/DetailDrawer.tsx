"use client";

import React, { useState } from 'react';

export default function DetailDrawer({ isOpen, onClose, title, children, actions }: any) {
    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#0c0c0c] border-l border-[#1a1a1a] p-8 z-[101] shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
                <header className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight uppercase italic text-[#ffb400]">Detail View</h3>
                        <p className="text-[#666] text-sm font-bold uppercase tracking-wider">{title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#1a1a1a] transition-all"
                    >
                        ✕
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                    {children}
                </div>

                {actions && (
                    <footer className="mt-8 pt-6 border-t border-[#1a1a1a] flex gap-3">
                        {actions}
                    </footer>
                )}
            </div>
        </>
    );
}
