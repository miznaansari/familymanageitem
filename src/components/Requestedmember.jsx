import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

export default function RequestedMember() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) return;

      const getUserInfo = async (uid) => {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            return userDoc.data();
          } else {
            return null;
          }
        } catch {
          return null;
        }
      };

      let fromLoaded = false;
      let toLoaded = false;

      const checkIfAllLoaded = () => {
        if (fromLoaded && toLoaded) {
          setLoading(false);
        }
      };

      const unsubscribeFrom = onSnapshot(
        query(collection(db, "friendRequests"), where("from", "==", firebaseUser.uid)),
        async (snapshot) => {
          const sent = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              const toUser = await getUserInfo(data.to);
              if (!toUser) return null;

              return {
                id: docSnap.id,
                direction: "sent",
                ...data,
                userInfo: toUser,
              };
            })
          );
          setRequests((prev) => [
            ...prev.filter((r) => r.direction !== "sent"),
            ...sent.filter(Boolean),
          ]);
          fromLoaded = true;
          checkIfAllLoaded();
        }
      );

      const unsubscribeTo = onSnapshot(
        query(collection(db, "friendRequests"), where("to", "==", firebaseUser.uid)),
        async (snapshot) => {
          const received = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              const fromUser = await getUserInfo(data.from);
              if (!fromUser) return null;

              return {
                id: docSnap.id,
                direction: "received",
                ...data,
                userInfo: fromUser,
              };
            })
          );
          setRequests((prev) => [
            ...prev.filter((r) => r.direction !== "received"),
            ...received.filter(Boolean),
          ]);
          toLoaded = true;
          checkIfAllLoaded();
        }
      );

      return () => {
        unsubscribeFrom();
        unsubscribeTo();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const handleAccept = async (req) => {
    const ref = doc(db, "friendRequests", req.id);
    await updateDoc(ref, { status: "accepted" });

    await fetch(`${import.meta.env.VITE_BACKEND_API}/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUID: req.from,
        fromUID: user.uid,
        message: `${user.email} accepted your friend request.`,
      }),
    });
  };

  const handleReject = async (req) => {
    const ref = doc(db, "friendRequests", req.id);
    await updateDoc(ref, { status: "rejected" });
  };

  const renderActions = (req) => {
    if (req.direction === "sent") {
      return <span className="badge badge-info">Sent</span>;
    }

    if (req.status === "pending") {
      return (
        <div className="flex gap-2">
          <button className="btn btn-success btn-sm" onClick={() => handleAccept(req)}>
            Accept
          </button>
          <button className="btn btn-error btn-sm" onClick={() => handleReject(req)}>
            Reject
          </button>
        </div>
      );
    }

    if (req.status === "accepted") {
      return <span className="badge badge-success">Accepted</span>;
    }

    if (req.status === "rejected") {
      return <span className="badge badge-error">Rejected</span>;
    }

    return null;
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-base-content">Friend Requests</h2>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center text-secondary-content">No friend requests found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="card bg-base-100 shadow-md border border-base-200"
            >
              <div className="card-body">
                <h2 className="card-title text-base-content">
                  {req.userInfo?.name || "Unknown Name"}
                </h2>
                <p className="text-sm text-secondary-content">
                  {req.userInfo?.email || "Unknown Email"}
                </p>
                <p className="text-sm mt-2 text-base-content">
                  {req.direction === "sent"
                    ? "You sent a friend request"
                    : "Sent you a friend request"}
                </p>

                <div className="card-actions justify-end mt-4">
                  {renderActions(req)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
