import React, { type ReactNode, useEffect } from 'react';
import { X, Trash } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onDelete?: () => void;
  children: ReactNode;
  isBlocking?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onDelete,
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
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-3 left-3 z-10 rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            <Trash size={20} />
          </button>
        )}
        {!isBlocking && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
