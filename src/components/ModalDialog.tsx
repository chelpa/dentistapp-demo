"use client";
import { useEffect, useRef, type ReactNode } from "react";

// Native modal dialogs provide focus containment, background inertness and Escape.
export default function ModalDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  return <dialog ref={dialog} aria-label={title} onCancel={event => { event.preventDefault(); close.current(); }}
    className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-[24px] bg-white p-6 text-ink shadow-2xl backdrop:bg-[#172739]/45 sm:p-8">
    {children}
  </dialog>;
}
