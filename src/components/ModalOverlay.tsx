import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  fullHeight?: boolean;
}

export default function ModalOverlay({ isOpen, onClose, children, maxWidth = "max-w-md", fullHeight = false }: ModalOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
       <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className={`bg-card rounded-2xl shadow-2xl ${maxWidth} w-full relative ${fullHeight ? "h-[90vh] flex flex-col overflow-hidden" : "max-h-[90vh] overflow-y-auto"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
