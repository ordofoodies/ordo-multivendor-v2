import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

// How long the device must stay offline before screens show the error view.
// Right after launch (and when switching Wi-Fi <-> cellular) NetInfo briefly
// reports "unknown" or "offline", which used to flash "Something went wrong".
const OFFLINE_GRACE_MS = 2000;

const isOffline = (state) => state.isConnected === false || state.isInternetReachable === false;

const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let timer;
    const unsubscribe = NetInfo.addEventListener((state) => {
      clearTimeout(timer);
      // null means "not determined yet": treat as online until proven otherwise
      if (!isOffline(state)) {
        setIsConnected(true);
        return;
      }
      timer = setTimeout(async () => {
        const latest = await NetInfo.fetch();
        if (isOffline(latest)) setIsConnected(false);
      }, OFFLINE_GRACE_MS);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return { isConnected, setIsConnected };
};

export default useNetworkStatus;
