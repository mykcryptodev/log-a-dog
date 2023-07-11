import { Transition } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { type FC, Fragment, useContext } from 'react';

import NotificationContext from '~/context/Notification';

export const Notification: FC = () => {
  const { dismissNotification, showNotification, notification } = useContext(NotificationContext);

  return (
    <Transition
      show={showNotification}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={`fixed top-8 sm:right-12 right-0 mx-2 pointer-events-auto bg-base-100 w-full max-w-xs sm:max-w-sm rounded-lg z-50 shadow-xl ring-1 ring-${notification?.type || ""}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {notification?.type === "success" ? (
                <CheckCircleIcon className="h-6 w-6 stroke-2 text-success" aria-hidden="true" />
              ) : (
                <XCircleIcon className="h-6 w-6 stroke-2 text-error" aria-hidden="true" />
              )}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-lg font-bold">{notification?.title}</p>
              <p className="mt-1 prose">{notification?.description}</p>
              <div className="mt-4 flex justify-end gap-2">
                {notification?.actions?.map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`btn ${action.type === "primary" ? "btn-primary" : ""}}`}
                    onClick={() => {
                      void action.onClick?.();
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  void dismissNotification();
                }}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  )
}

export default Notification;