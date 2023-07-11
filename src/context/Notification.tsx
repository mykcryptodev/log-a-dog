import React from "react";

import { type INotificationContext } from "~/types/notification";

const defaultState = {
  notification: null,
  showNotification: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dismissNotification: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  popNotification: () => {},
}

const NotificationContext = React.createContext<INotificationContext>(defaultState);

export default NotificationContext;