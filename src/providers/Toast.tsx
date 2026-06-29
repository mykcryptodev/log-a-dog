"use client";

import { ToastContainer, type ToastClassName } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Portal } from '~/components/utils/Portal';

// Match the app's "Sticker Brutalism" look: thick ink border + hard offset
// shadow (no blur), opaque surface, display font. Type styling (the left
// accent bar + icon colour) is handled in globals.css via the Toastify__toast
// data-type selectors so VALID/SUS/info read at a glance.
const toastClassName: ToastClassName = (ctx) =>
  `pop-toast pop-toast--${ctx?.type ?? 'default'}`;

export function ToastProvider() {
  return (
    <Portal>
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        icon={false}
        style={{ zIndex: 9999 }}
        toastClassName={toastClassName}
      />
    </Portal>
  );
}
