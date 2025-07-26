import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const GroupAdd = () => {
  const [homeName, setHomeName] = useState("");
  const [status, setStatus] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) fetchRequests(user.uid);
    });

    // Initialize OneSignal (once)
    // OneSignal.init({ appId: import.meta.env.VITE_ONESIGNAL_APP_ID });
  }, []);

  const createHome = async () => {
    if (!homeName || !user) return setStatus("Enter a home name");

    try {
      await addDoc(collection(db, "homes"), {
        name: homeName,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setStatus("Home created successfully");
      setHomeName("");
    } catch (err) {
      console.error(err);
      setStatus("Error creating home");
    }
  };

  const fetchRequests = async (uid) => {
    const q = query(
      collection(db, "homeRequests"),
      where("to", "==", uid),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    setRequests(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const respondToRequest = async (id, accept) => {
    const requestRef = doc(db, "homeRequests", id);
    await updateDoc(requestRef, {
      status: accept ? "accepted" : "rejected",
    });
    fetchRequests(user.uid);
  };

  const sendJoinRequest = async () => {
    if (!joinEmail || !user) return setStatus("Enter an email");

    try {
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", joinEmail)
      );
      const snapshot = await getDocs(userQuery);

      if (snapshot.empty) {
        setStatus("Home owner not found");
        return;
      }

      const receiver = snapshot.docs[0];
      const receiverUID = receiver.id;
      const senderUID = user.uid;

      if (receiverUID === senderUID) {
        setStatus("You cannot send a request to yourself");
        return;
      }

      const checkQuery = query(
        collection(db, "homeRequests"),
        where("from", "==", senderUID),
        where("to", "==", receiverUID),
        where("status", "in", ["pending", "accepted"])
      );
      const checkSnap = await getDocs(checkQuery);

      if (!checkSnap.empty) {
        setStatus("You already have a request with this home");
        return;
      }

      await addDoc(collection(db, "homeRequests"), {
        from: senderUID,
        to: receiverUID,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Send notification via OneSignal
      await fetch(`${import.meta.env.VITE_BACKEND_API}/send-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUID: receiverUID,
          fromUID: senderUID,
          message: `You have a new join request from ${user.email}`,
        }),
      });

      setStatus("Request sent successfully");
      setJoinEmail("");
    } catch (err) {
      console.error(err);
      setStatus("Error sending request");
    }
  };

  return (
    <div className="p-4 space-y-8 max-w-xl mx-auto">
      {/* Admin Section */}
      <div className="border rounded p-4 shadow">
        <h2 className="text-xl font-bold mb-2">Create Home (Admin)</h2>
        <input
          type="text"
          placeholder="Enter Home Name"
          value={homeName}
          onChange={(e) => setHomeName(e.target.value)}
          className="input input-bordered w-full mb-2"
        />
        <button onClick={createHome} className="btn btn-primary w-full">
          Create Home
        </button>

        <h3 className="text-lg mt-4 font-semibold">Join Requests</h3>
        <ul className="space-y-2">
          {requests.map((req) => (
            <li key={req.id} className="flex justify-between items-center">
              <span>{req.from}</span>
              <div className="space-x-2">
                <button
                  onClick={() => respondToRequest(req.id, true)}
                  className="btn btn-success btn-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => respondToRequest(req.id, false)}
                  className="btn btn-error btn-sm"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* User Section */}
      <div className="border rounded p-4 shadow">
        <h2 className="text-xl font-bold mb-2">Join Home (User)</h2>
        <input
          type="email"
          placeholder="Enter Home Owner Email"
          value={joinEmail}
          onChange={(e) => setJoinEmail(e.target.value)}
          className="input input-bordered w-full mb-2"
        />
        <button onClick={sendJoinRequest} className="btn btn-secondary w-full">
          Send Join Request
        </button>
      </div>

      {/* Status message */}
      {status && <p className="text-center text-sm text-blue-600">{status}</p>}
    </div>
  );
};

export default GroupAdd;
