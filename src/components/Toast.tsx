import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';

export default function Toast() {
  const { state } = useApp();

  return (
    <AnimatePresence>
      {state.toast?.visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 left-0 right-0 z-[70] flex justify-center px-4"
        >
          <div className="bg-[#1B2A4A] text-white text-[13px] font-medium px-5 py-3 rounded-xl shadow-floating max-w-[90%] text-center">
            {state.toast.message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
