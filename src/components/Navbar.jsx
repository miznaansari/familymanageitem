import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router"; // Correct if you're using react-router

const Navbar = () => {
    const [user, setUser] = useState(null); // user state
    const [denied, setDenied] = useState(false);
    const [ableNotification, setAbleNotification] = useState(false);
    const navigate = useNavigate();

    // ✅ Update user state in real-time
    useEffect(() => {
        const syncUserFromLocalStorage = () => {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            setUser((prev) => {
                if (JSON.stringify(prev) !== JSON.stringify(storedUser)) {
                    return storedUser;
                }
                return prev;
            });
        };

        // On initial load
        syncUserFromLocalStorage();

        // Listen for cross-tab changes
        window.addEventListener("storage", syncUserFromLocalStorage);

        // Poll every second for same-tab changes
        const interval = setInterval(syncUserFromLocalStorage, 1000);

        return () => {
            window.removeEventListener("storage", syncUserFromLocalStorage);
            clearInterval(interval);
        };
    }, []);

    // ✅ OneSignal auto-login if already granted
    useEffect(() => {
        const uid = user?.uid;
        if (!uid || !window.OneSignalDeferred) return;

        window.OneSignalDeferred.push(async (OneSignal) => {
            try {
                await OneSignal.init({
                    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
                    allowLocalhostAsSecureOrigin: true,
                    notifyButton: { enable: false },
                });

                await OneSignal.login(uid);
                const isPushEnabled = await OneSignal.User.PushSubscription.optedIn; //v16 new version
                console.log('Is Push Enabled:', isPushEnabled);
            } catch (err) {
                console.error("OneSignal login failed:", err);
            }
        });
    }, [user]);

    // ✅ Request notification permission
    const handleAllowNotification = async () => {
        try {
            if (!window.OneSignalDeferred) {
                console.warn("OneSignalDeferred not found.");
                return;
            }

            window.OneSignalDeferred.push(async (OneSignal) => {
                await OneSignal.init({
                    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
                    allowLocalhostAsSecureOrigin: true,
                    notifyButton: { enable: false },
                });

                const permission = await OneSignal.Notifications.permission;
                if (permission !== "granted") {
                    const result = await OneSignal.Notifications.requestPermission();
                    if (result !== "granted") {
                        setDenied(true);
                        return;
                    }
                }

                const uid = user?.uid;
                if (!uid) return;

                await OneSignal.login(uid);
                const onesignalId = await OneSignal.User.getId();
                const isSubscribed = await OneSignal.Notifications.isSubscribed();

                if (!onesignalId || !isSubscribed) {
                    console.warn("Not fully subscribed.");
                    return;
                }

                new Notification("Welcome to EKMC Platform!", {
                    body: "Thank you for allowing notifications.",
                    icon: "/icon196.png",
                });

                setAbleNotification(true);
            });
        } catch (error) {
            console.error("Notification permission error:", error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.dispatchEvent(new Event("storage")); // 🔁 trigger update in same tab
        console.log("Logged out");
        navigate("/signup");
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
                    {user?.uid && <li><button onClick={handleLogout} className="btn btn-sm">Logout</button></li>}
                    {user?.uid && !ableNotification && (
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
                        {user?.uid && <li><button onClick={handleLogout} className="btn btn-sm w-full">Logout</button></li>}
                        {user?.uid && !ableNotification && (
                            <li><button onClick={handleAllowNotification} className="btn btn-sm w-full">Allow Notification</button></li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Toast for denied permission */}
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
