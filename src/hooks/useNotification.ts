import { useState } from 'react';

import type { Notification } from '~/types/notification';

const blankNotification: Notification = {
  title: '',
  description: '',
  duration: 0,
  type: 'success', // 'warning', 'info', 'error'
  link: 'https://bscscan.com', // optional link
  actions: [], // optional actions
}

const useNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState<Notification>(blankNotification);
  const NOTIFICATION_DURATION_MS = 6000; // close after 6s

  const dismissNotification = () => {
    setShowNotification(false);
    setNotification(blankNotification)
  }

  const popNotification = (noti: Notification) => {
    setNotification(noti);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, noti.duration || NOTIFICATION_DURATION_MS);
  }

  return {
    dismissNotification,
    notification,
    popNotification,
    showNotification,
  }
}

export default useNotification;