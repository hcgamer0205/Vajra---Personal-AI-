import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';

export interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'tall' | 'full';
  showCloseButton?: boolean;
  headerActions?: React.ReactNode;
  className?: string;
  preventBackdropClose?: boolean;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  height = 'tall',
  showCloseButton = true,
  headerActions,
  className = '',
  preventBackdropClose = false,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number>(0);
  const currentTranslateY = useRef<number>(0);

  // Close on ESC key for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when sheet is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Drag-to-dismiss gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    // Only allow dragging downward to dismiss
    if (deltaY > 0) {
      setDragY(deltaY);
      currentTranslateY.current = deltaY;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Dismiss threshold: dragged down > 90px
    if (currentTranslateY.current > 90) {
      onClose();
    }
    setDragY(0);
    currentTranslateY.current = 0;
  };

  if (!isOpen) return null;

  const heightClasses = {
    auto: 'max-h-[85dvh]',
    half: 'h-[58dvh] max-h-[58dvh]',
    tall: 'h-[85dvh] max-h-[85dvh]',
    full: 'h-[94dvh] max-h-[94dvh]',
  }[height];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto"
    >
      {/* 1. Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        onClick={() => {
          if (!preventBackdropClose) onClose();
        }}
        aria-hidden="true"
      />

      {/* 2. Draggable Bottom Sheet Surface */}
      <div
        ref={sheetRef}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative z-10 w-full ${heightClasses} bg-[#080205]/98 border-t border-amber-500/40 rounded-t-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.85),0_-2px_16px_rgba(220,38,38,0.2)] flex flex-col text-[#fef3c7] overflow-hidden ${className}`}
      >
        {/* Drag Handle Zone */}
        <div
          ref={dragHandleRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-amber-500/40 hover:bg-amber-400 transition-colors" />
        </div>

        {/* Sheet Header */}
        <div className="px-4 py-2.5 border-b border-amber-900/40 flex items-center justify-between gap-2 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="font-hud font-bold text-base text-amber-200 tracking-wider truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-[11px] font-mono text-amber-400/60 truncate">
                {subtitle}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {headerActions}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-300 hover:text-white bg-[#1a040b] border border-amber-900/60 active:scale-90 transition-all cursor-pointer"
                title="Close sheet"
                aria-label="Close sheet"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sheet Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};
