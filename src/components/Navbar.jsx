import React, { useEffect, useState } from "react";
import { Link } from "react-router"; // ✅ Correct package

const Navbar = () => {
    const [denied, setDenied] = useState(false);
    const [ableNotification, setAbleNotification] = useState(false);

    useEffect(() => {
        // Check initial permission
        if (window?.OneSignalDeferred) {
            window.OneSignalDeferred.push(async (OneSignal) => {
                const permission = await OneSignal.Notifications.permission;
                if (permission === "granted") {
                    setAbleNotification(true);
                } else if (permission === "denied") {
                    setDenied(true);
                }
            });
        }
    }, []);


    const handleAllowNotification = async () => {
        try {
            console.log("Initializing OneSignal");

            window.OneSignalDeferred.push(async (OneSignal) => {
                await OneSignal.init({
                    appId: '63837d95-a8d2-456f-b95e-31be1d64c10b',
                    allowLocalhostAsSecureOrigin: true,
                });
                const storedUser = JSON.parse(localStorage.getItem("user"));
                const uid = storedUser?.uid;

                if (!uid) {
                    console.warn("User UID not found in localStorage.");
                    return;
                }

                const currentPermission = await  OneSignal.Notifications.permission;
                await OneSignal.login(String(uid));



                if (currentPermission !== "granted") {
                    const result = await OneSignal.Notifications.requestPermission();
                    if (result !== "granted") {
                        setDenied(true);
                        console.warn("User denied notification permission.");
                        return;
                    }
                }

                // Now safe to login
                // await OneSignal.login(String(user_admin_id));

                // const extId = await OneSignal.User.getExternalId();
                // const onesignalId = await OneSignal.User.getId();
                // console.log("External ID set to:", extId);
                // console.log("OneSignal ID:", onesignalId);

                if (!onesignalId) {
                    console.warn("OneSignal ID not ready yet.");
                    return;
                }

                new Notification("Welcome to EKMC Platform!", {
                    body: "Thank you for allowing notifications.",
                    icon: "/icon196.png",
                });

                setableNotification(true);
            });
        } catch (error) {
            console.error("Error setting up OneSignal:", error);
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

    return (
        <div className="navbar bg-base-100 shadow-md">
            <div className="navbar-start">
                <Link to="/" className="btn btn-ghost text-xl">Family Management</Link>
            </div>

            <div className="navbar-center hidden md:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/signup">Signup</Link></li>
                    {!ableNotification && (
                        <li>
                            <button onClick={handleAllowNotification} className="btn btn-sm">
                                Allow Notification
                            </button>
                        </li>
                    )}
                </ul>
            </div>

            <div className="navbar-end md:hidden">
                <div className="dropdown">
                    <label tabIndex={0} className="btn btn-ghost">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        {!ableNotification && (
                            <li>
                                <button onClick={handleAllowNotification}>
                                    Allow Notification
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

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
