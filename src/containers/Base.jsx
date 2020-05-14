import React, { useState, useEffect } from 'react';

import App from './App';
import Offline from '../components/Offline';

import CommonError from '../components/CommonError';
import GameError from '../components/GameError';

import useGlobal from '../hooks/use-global';
import { interpretResponse } from '../utils/data';

const Base = () => {
  const [loaded, updateLoadState] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const global = useGlobal();

  useEffect(() => {
    const handleOnlineStatus = () => {
      global.store.isOffline =
        !window.navigator.onLine;

      window.requestAnimationFrame(() => {
        setShowOffline(global.store.isOffline);
      });
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    global.socket.on('connect', handleOnlineStatus);
    global.socket.on('disconnect', handleOnlineStatus);

    const handleError = (error = window.event, source, lineno, colno, raw) => {
      global.bus.once('modal:closed', () => {
        if (raw) {
          error = raw;
        }

        if (error instanceof Event) {
          error = error.reason;
        }

        if (error && 'code' in error) {
          global.store.modal.content = (
            <GameError code={error.code} />
          );
        } else {
          global.store.modal.content = (
            <CommonError />
          );
        }

        global.bus.once('modal:updated', () => {
          global.bus.emit('modal:open');
        });
        global.bus.emit('modal:update');
      });
      global.bus.emit('modal:close');

      return true;
    };

    window.addEventListener('error', handleError);
    window.addEventListener('abort', handleError);
    window.addEventListener('unhandledrejection', handleError);
    global.socket.on('error', handleError);
  }, []);

  useEffect(() => {
    const fetchUser = () => {
      return global.axios.post('/vk-user/auth').then((response) => {
        const user = interpretResponse(response);
        user.created = response.status === 200;

        global.store.user = {
          ...global.store.user,
          ...user
        };
        global.bus.emit('app:auth', global.store.user);
      });
    };

    global.bus.on('app:update', fetchUser);

    const windowLoad = new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        // event
        window.onload = resolve;

        // fallback
        setTimeout(resolve, 1E4); // 10s
      }
    });

    const fontLoad = 'fonts' in document &&
      new Promise((resolve) => {
        if (document.fonts.status === 'loaded') {
          resolve();
        } else {
        // event
          document.fonts.onloadingdone = resolve;
          document.fonts.onloadingerror = resolve;

          // promise
          let { ready } = document.fonts;
          if (typeof ready === 'function') {
            ready = ready(); // vendor/old specific
          }
          Promise.resolve(ready).then(() => {
            const { status = 'error' } = document.fonts;
            if (status === 'loaded' || status === 'error') {
              resolve();
            } else {
              setTimeout(resolve, 1E3); // 1s
            }
          });

          // fallback
          setTimeout(resolve, 1E4);  // 10s
        }
      });

    const storageLoad = global.storage.get().then((persist) => {
      global.store.persist = {
        ...global.store.persist,
        ...persist
      };
    });

    const updateView = () => {
      if (global.bridge.supports('VKWebAppSetViewSettings')) {
        global.bridge.send('VKWebAppSetViewSettings', {
          status_bar_style: 'light',
          action_bar_color: '#355FDE',
          navigation_bar_color: '#537EF9'
        }).catch(() => {
          // See: https://github.com/VKCOM/vk-bridge/issues/103
        });
      }
    };

    global.bridge.subscribe((event) => {
      if (!event || !event.detail) {
        return;
      }

      switch (event.detail.type) {
        case 'VKWebAppInitResult':
        case 'VKWebAppViewRestore':
        case 'VKWebAppLocationChanged':
        case 'VKWebAppOpenCodeReaderResult':
        case 'VKWebAppOpenCodeReaderFailed':
          updateView();
          break;
      }
    });

    Promise.all([
      fetchUser(),
      storageLoad,
      fontLoad,
      windowLoad
    ]).then(() => {
      global.socket.open();
      updateLoadState(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      setTimeout(() => {
        window.requestAnimationFrame(() => {
          // app seems ready
          global.bridge.send('VKWebAppInit');
        });
      }, 600);
    }
  }, [loaded]);

  return (
    <React.StrictMode>
      {
        loaded ? (
          <App />
        ): (
          <div className="Root" />
        )
      }
      <Offline visible={showOffline} />
    </React.StrictMode>
  );
};

export default Base;
