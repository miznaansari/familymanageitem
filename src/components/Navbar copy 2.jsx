import React, { useEffect, useState } from "react";

const Navbar = () => {
    const [denied, setDenied] = useState(false);
    const [ableNotification, setAbleNotification] = useState(false);
    const [identityInfo, setIdentityInfo] = useState(null);
    const [identityError, setIdentityError] = useState(null);

    // Check OneSignal permission and subscription status
    useEffect(() => {
        if (!window?.Notification || !window?.OneSignalDeferred) return;

        window.OneSignalDeferred.push(async (OneSignal) => {
            const permission = await OneSignal.Notifications.permission;

            if (permission === "denied") {
                setDenied(true);
                setAbleNotification(false);
                return;
            }

            const isPushSupported = await OneSignal.Notifications.isPushSupported();
            const isSubscribed = OneSignal.User.PushSubscription.optedIn;

            setAbleNotification(isPushSupported && isSubscribed);
        });
    }, []);

    // Allow notification request
const handleAllowNotification = () => {
  // Prevent re-init if already done
  if (!window._oneSignalInitialized) {
    window.OneSignal = window.OneSignal || [];
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    OneSignal.push(function () {
      OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      });
    });

    window._oneSignalInitialized = true;
  }

  console.log("1");

  if (!window.OneSignalDeferred) {
    console.warn("OneSignalDeferred not available.");
    return;
  }

  console.log("2");

  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      const isSupported = await OneSignal.Notifications.isPushSupported();
      if (!isSupported) {
        console.warn("Push notifications not supported on this browser.");
        return;
      }

      console.log("3");

      const permission = OneSignal.Notifications.permission; // ❗ Fix here
      console.log("4 — Current permission:", permission);

      if (typeof permission !== "string") {
        console.error("🚫 Invalid permission response. SDK may not be ready.");
        return;
      }

      if (permission === "granted") {
        await OneSignal.Notifications.subscribe();
        console.log("6 — Subscribed immediately.");
      } else if (permission === "default") {
        await OneSignal.Notifications.requestPermission();
        console.log("5 — Requested permission.");
        await OneSignal.Notifications.subscribe();
        console.log("6 — Subscribed.");
      } else {
        console.warn("Permission denied.");
        setDenied(true);
        return;
      }

      const isSubscribed = OneSignal.User.PushSubscription.optedIn;
      setAbleNotification(isSubscribed);
      console.log("🔔 Subscribed successfully.");
    } catch (error) {
      console.error("❌ Error subscribing:", error);
    }
  });
};


    // Fetch identity info based on OneSignal user ID
    useEffect(() => {
        if (!ableNotification || !window.OneSignalDeferred) return;

       

        window.OneSignalDeferred.push(async (OneSignal) => {
            try {
                const userId = OneSignal.User.PushSubscription.id;
                if (!userId) {
                    console.warn("⚠️ No OneSignal user ID found.");
                    return;
                }

                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_API}/onesignal/user-identity/${userId}`
                );
                const data = await res.json();

                if (data.success) {
                    console.log("✅ Identity found:", data.identity);
                    setIdentityInfo(data.identity);
                } else {
                    console.warn("❌ Identity fetch failed:", data.error);
                    setIdentityError("This device is not registered in OneSignal.");
                }
            } catch (err) {
                console.error("❌ Identity request failed:", err);
                setIdentityError("Error checking subscription identity.");
            }
        });
    }, [ableNotification]);

    return (
        <div className="navbar bg-base-100 px-4 shadow">
            <div className="flex-1">
                <a className="btn btn-ghost text-xl">MyApp</a>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1 space-x-3">
                    {!ableNotification && !denied && (
                        <li>
                            <button
                                className="btn btn-sm btn-success"
                                onClick={handleAllowNotification}
                            >
                                Allow Notifications
                            </button>
                        </li>
                    )}
                    {ableNotification && (
                        <li>
                            <span className="badge badge-success text-xs">Subscribed</span>
                        </li>
                    )}
                    {identityInfo?.identity?.external_id && (
                        <li>
                            <span className="text-xs text-blue-600">
                                Linked as: {identityInfo.identity.external_id}
                            </span>
                        </li>
                    )}
                </ul>
            </div>

            {/* Toasts */}
            {denied && (
                <div className="toast toast-top toast-center z-50">
                    <div className="alert alert-error text-sm">
                        You have denied notifications. Please enable them in browser settings.
                    </div>
                </div>
            )}
            {identityError && (
                <div className="toast toast-top toast-center z-50">
                    <div className="alert alert-warning text-sm">{identityError}</div>
                </div>
            )}
        </div>
    );
};

export default Navbar;
