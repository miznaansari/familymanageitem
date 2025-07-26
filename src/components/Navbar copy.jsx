import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router"; // ✅ Correct package

const Navbar = () => {
    const [denied, setDenied] = useState(false);
    const [ableNotification, setAbleNotification] = useState(false);


    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const uid = storedUser?.uid;
        setUser(storedUser);


        if (!uid || !window.OneSignalDeferred) return;

        window.OneSignalDeferred.push(async (OneSignal) => {
            try {
                console.log("Initializing OneSignal...");

                // ✅ Wait for proper initializationimport React, { useEffect, useState } from "react";
                
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
                
                await OneSignal.init({
                    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
                    allowLocalhostAsSecureOrigin: true,
                    notifyButton: { enable: false },
                });

                // ✅ Now it's safe to login
                await OneSignal.login(uid);
                console.log("Logged in again:", uid);

                // const isSubscribed = await OneSignal.Notifications.isSubscribed();
                console.log("Subscribed:", isSubscribed);
            } catch (err) {
                console.error("Login failed on revisit", err);
            }
        });
    }, []);

    const [user, setUser] = useState(null); // ✅ NEW: user state

    const handleAllowNotification = async () => {
        try {
            console.log("Initializing OneSignal...");

            if (!window.OneSignalDeferred) {
                console.warn("OneSignalDeferred not available.");
                return;
            }

            window.OneSignalDeferred.push(async (OneSignal) => {
                await OneSignal.init({
                    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
                    allowLocalhostAsSecureOrigin: true,
                    notifyButton: { enable: false },
                });

                const storedUser = JSON.parse(localStorage.getItem("user"));
                const uid = storedUser?.uid;
                if (!uid) {
                    console.warn("User UID not found in localStorage.");
                    return;
                }

                // Check current permission
                const permission = await OneSignal.Notifications.permission;
                console.log("Current permission:", permission);

                if (permission !== "granted") {
                    const result = await OneSignal.Notifications.requestPermission();
                    console.log("User permission result:", result);

                    if (result !== "granted") {
                        setDenied(true);
                        console.warn("User denied notification permission.");
                        return;
                    }
                }

                // Permission granted - proceed to login
                await OneSignal.login(String(uid));
                console.log("Logged into OneSignal as:", uid);

                // Wait a bit for the ID to become available
                const onesignalId = await OneSignal.User.getId();
                console.log("OneSignal User ID:", onesignalId);

                const isSubscribed = await OneSignal.Notifications.isSubscribed();
                console.log("Is user subscribed?", isSubscribed);

                if (!isSubscribed || !onesignalId) {
                    console.warn("User is not properly subscribed or OneSignal ID not ready.");
                    return;
                }

                // Show welcome notification
                new Notification("Welcome to EKMC Platform!", {
                    body: "Thank you for allowing notifications.",
                    icon: "/icon196.png",
                });

                setAbleNotification(true); // ✅ fixed typo: was setableNotification
            });
        } catch (error) {
            console.error("Error during OneSignal setup:", error);
        }
    };


    // const handleAllowNotification = () => {
    //     if (window?.OneSignalDeferred) {
    //         window.OneSignalDeferred.push(async (OneSignal) => {
    //             try {
    //                 await OneSignal.init({
    //                     appId: "63837d95-a8d2-456f-b95e-31be1d64c10b", // ✅ Your real app ID
    //                     allowLocalhostAsSecureOrigin: true,
    //                     notifyButton: { enable: false },
    //                 });

    //                 const storedUser = JSON.parse(localStorage.getItem("user"));
    //                 const uid = storedUser?.uid;

    //                 if (!uid) {
    //                     console.warn("User UID not found in localStorage.");
    //                     return;
    //                 }

    //                 const permission = await OneSignal.Notifications.permission;

    //                 if (permission !== "granted") {
    //                     const result = await OneSignal.Notifications.requestPermission();
    //                     if (result !== "granted") {
    //                         setDenied(true);
    //                         return;
    //                     }
    //                 }

    //                 await OneSignal.login(String(uid));

    //                 const oneSignalId = await OneSignal.User.getId();
    //                 if (!oneSignalId) {
    //                     console.warn("OneSignal ID not ready.");
    //                     return;
    //                 }

    //                 new Notification("Welcome!", {
    //                     body: "Thanks for enabling notifications.",
    //                     icon: "/icon196.png",
    //                 });

    //                 setAbleNotification(true);
    //             } catch (err) {
    //                 console.error("OneSignal error:", err);
    //             }
    //         });
    //     }
    // };
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear(); // or localStorage.removeItem("user");
        console.log("User logged out and localStorage cleared");
        navigate("/signup"); // Redirect to login page (or homepage)
    };

    return (
        <div className="navbar bg-base-100 shadow-md sticky top-0 left-0 right-0 z-50">
            <div className="navbar-start">
                <Link to="/" className="btn btn-ghost text-xl">Family Management</Link>
            </div>

            {/* Desktop Menu */}
            <div className="navbar-center hidden md:flex">
                <ul className="menu menu-horizontal px-1 gap-2">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/request">Request</Link></li>
                    <li><Link to="/add">Add</Link></li>
                    {!user?.uid && <li><Link to="/signup">Signup</Link></li>}
                    {user?.uid && (
                        <li><button onClick={handleLogout} className="btn btn-sm">Logout</button></li>
                    )}
                    {!ableNotification && (
                        <li><button onClick={handleAllowNotification} className="btn btn-sm">Allow Notification</button></li>
                    )}
                </ul>
            </div>

            {/* Mobile Menu */}
            <div className="navbar-end md:hidden">
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </label>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content mt-3 p-4 shadow bg-base-100 rounded-box w-60 space-y-2"
                    >
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/request">Request</Link></li>

                        <li><Link to="/add">Add</Link></li>
                        {!user?.uid && <li><Link to="/signup">Signup</Link></li>}
                        {user?.uid && (
                            <li><button onClick={handleLogout} className="btn btn-sm w-full">Logout</button></li>
                        )}
                        {!ableNotification && (
                            <li><button onClick={handleAllowNotification} className="btn btn-sm w-full">Allow Notification</button></li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Notification Blocked Toast */}
            {denied && (
                <div className="toast toast-top toast-center z-50">
                    <div className="alert alert-error text-sm">
                        Notifications are blocked. Please allow them in your browser settings.
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;
