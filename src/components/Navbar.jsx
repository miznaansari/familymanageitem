import React, { useEffect, useState } from "react";
import { Link } from "react-router";

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
                const storedUser = JSON.parse(localStorage.getItem("user"));
                const uid = storedUser?.uid;
                await OneSignal.login(uid);
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
                if (isSubscribed) {

                    console.log("Logged in again:", uid);
                }
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
    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/signup"; // Redirect to login page
    };

    const hardresetonesignal = async () => {
        try {
            console.log("🧹 Starting full client-side reset...");

            // 🗑️ Clear Local Storage
            localStorage.clear();
            console.log("✅ Local Storage cleared.");

            // 🗑️ Clear Session Storage
            sessionStorage.clear();
            console.log("✅ Session Storage cleared.");

            // 🍪 Delete all cookies
            document.cookie.split(";").forEach((cookie) => {
                const name = cookie.split("=")[0].trim();
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
            });
            console.log("✅ Cookies cleared.");

            // 🧠 Delete IndexedDBs
            const deleteIndexedDB = async (name) => {
                return new Promise((resolve) => {
                    const req = indexedDB.deleteDatabase(name);
                    req.onsuccess = () => {
                        console.log(`✅ IndexedDB "${name}" deleted.`);
                        resolve();
                    };
                    req.onerror = () => {
                        console.warn(`⚠️ Failed to delete IndexedDB "${name}".`);
                        resolve();
                    };
                    req.onblocked = () => {
                        console.warn(`⚠️ Delete blocked for IndexedDB "${name}".`);
                        resolve();
                    };
                });
            };

            if (indexedDB.databases) {
                const dbs = await indexedDB.databases();
                for (const db of dbs) {
                    if (db.name) {
                        await deleteIndexedDB(db.name);
                    }
                }
            } else {
                // Fallback: manually delete known DBs
                const knownDBs = [
                    'ONE_SIGNAL_SDK_DB',
                    'OneSignalApp',
                    'OneSignalSDKStore',
                    'OneSignalNotifications',
                    'OneSignalIndexedDB',
                ];
                for (const name of knownDBs) {
                    await deleteIndexedDB(name);
                }
                console.warn("⚠️ indexedDB.databases() not supported — used fallback list.");
            }

            console.log("🎉 Hard reset complete.");
            alert("All local data has been cleared. Please refresh the page.");
        } catch (err) {
            console.error("❌ Hard reset failed:", err?.message || err);
        }
    };



    return (
        <>
            <div className="navbar bg-base-200 shadow-md px-4 sticky top-0 z-50">
                <div className="flex-1 left-align" style={{ display: 'flex' }}>
                    <Link to="/" className="text-xl font-bold text-primary left-align">MyApp</Link>
                </div>

                <div className="hidden md:flex">
                    <ul className="menu menu-horizontal px-1 space-x-4 text-sm items-center">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/signup">Signup</Link></li>
                        <li><Link to="/add">Add</Link></li>
                        <li><Link to="/request">Request</Link></li>
                        <li>
                            <button
                                className="btn btn-sm btn-outline-success"
                                onClick={hardresetonesignal}
                            >
                                Hard reset
                            </button>
                        </li>
                        <li>
                            <button
                                className="btn btn-sm btn-outline-success"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </li>
                        {!ableNotification && !denied && (
                            <li>
                                <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={handleAllowNotification}
                                >
                                    Enable Notifications
                                </button>
                            </li>
                        )}
                        {ableNotification && (
                            <li>
                                <span className="badge badge-success text-xs">Subscribed</span>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Mobile Hamburger */}
                <div className="dropdown dropdown-end md:hidden">
                    <label tabIndex={0} className="btn btn-ghost btn-circle">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </label>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
                    >
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/signup">Signup</Link></li>
                        <li><Link to="/add">Add</Link></li>
                        <li><Link to="/request">Request</Link></li>
                        <li>
                            <button
                                className="btn btn-sm btn-outline-success"
                                onClick={hardresetonesignal}
                            >
                                Hard reset
                            </button>
                        </li>
                        <li>
                            <button
                                className="btn btn-sm btn-outline-success mb-1"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </li>
                        {!ableNotification && !denied && (
                            <li>
                                <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={handleAllowNotification}
                                >
                                    Enable Notifications
                                </button>
                            </li>
                        )}
                        {ableNotification && (
                            <li>
                                <span className="badge badge-success text-xs">Subscribed</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Toasts */}
            {denied && (
                <div className="toast toast-top toast-center z-50">
                    <div className="alert alert-error text-sm">
                        Notifications denied. Please allow them in browser settings.
                    </div>
                </div>
            )}
            {identityError && (
                <div className="toast toast-top toast-center z-50">
                    <div className="alert alert-warning text-sm">{identityError}</div>
                </div>
            )}
        </>
    );
};

export default Navbar;
