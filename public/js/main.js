const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
        try {
            let registration = await navigator.serviceWorker.register('/sw.js')
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          } catch(err) {
            console.log('ServiceWorker registration failed: ', err);
          }
    }
  };
  
  
registerServiceWorker();
