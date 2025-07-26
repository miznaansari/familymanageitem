import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router"; // Correct if you're using react-router

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [denied, setDenied] = useState(false);
    const [ableNotification, setAbleNotification] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Sync user from localStorage
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

        syncUserFromLocalStorage();
        window.addEventListener("storage", syncUserFromLocalStorage);
        const interval = setInterval(syncUserFromLocalStorage, 1000);

        return () => {
            window.removeEventListener("storage", syncUserFromLocalStorage);
            clearInterval(interval);
        };
    }, []);

    // Auto-login and check subscription
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
                const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
                console.log("Is Push Enabled:", isPushEnabled);
                setAbleNotification(isPushEnabled);
            } catch (err) {
                console.error("OneSignal login failed:", err);
            }
        });
    }, [user]);

    const handleAllowNotification = async () => {
        try {
            if (!window.OneSignalDeferred) {
                console.warn("OneSignalDeferred not found.");
                return;
            }

            setLoading(true); // Show loader

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
                        setLoading(false);
                        return;
                    }
                }

                const uid = user?.uid;
                if (!uid) {
                    setLoading(false);
                    return;
                }

                await OneSignal.login(uid);
                const onesignalId = await OneSignal.User.getId();
                const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;

                if (!onesignalId || !isPushEnabled) {
                    console.warn("Not fully subscribed.");
                    setLoading(false);
                    return;
                }

                new Notification("Welcome to Family Manage!", {
                    body: "Thank you for subscribing to notifications.",
                    icon: "/icon196.png",
                });

                setAbleNotification(true);
                setLoading(false);
            });
        } catch (error) {
            console.error("Notification subscription error:", error);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.dispatchEvent(new Event("storage")); // Sync state across tabs
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
                        <li>
                            <button onClick={handleAllowNotification} className="btn btn-sm">
                                Subscribe
                            </button>
                        </li>
                    )}
                    {user?.uid && ableNotification && (
                        <li>
                            <span className="text-green-600 font-semibold">🔔 Subscribed</span>
                        </li>
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
                            <li><button onClick={handleAllowNotification} className="btn btn-sm w-full">Subscribe</button></li>
                        )}
                        {user?.uid && ableNotification && (
                            <li><span className="text-green-600 font-semibold">🔔 Subscribed</span></li>
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

            {/* Fullscreen Loader */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
                    <span className="loading loading-spinner text-white text-4xl"></span>
                </div>
            )}
        </div>
    );
};

export default Navbar;
