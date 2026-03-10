import React, { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
  isBlocking?: boolean;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  isBlocking = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBlocking && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isBlocking, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = () => {
    if (!isBlocking && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-brand-navy">{title}</h2>
          {!isBlocking && onClose && (
            <button
              onClick={onClose}
              className="-mt-2 -mr-2 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};
