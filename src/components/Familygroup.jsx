import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const Familygroup = () => {
  const [user, setUser] = useState(null);
  const [joinedHomes, setJoinedHomes] = useState([]);
  const [selectedHome, setSelectedHome] = useState(null);
  const [message, setMessage] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [status, setStatus] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (usr) => {
      if (usr) {
        setUser(usr);
        await fetchJoinedHomes(usr.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchJoinedHomes = async (uid) => {
    const q = query(
      collection(db, "homeRequests"),
      where("from", "==", uid),
      where("status", "==", "accepted")
    );
    const snapshot = await getDocs(q);

    const homeIds = snapshot.docs.map((doc) => doc.data().to);
    const homesQuery = query(
      collection(db, "homes"),
      where("createdBy", "in", homeIds)
    );
    const homeSnapshot = await getDocs(homesQuery);

    const homes = homeSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setJoinedHomes(homes);
  };

  // 🔁 Fetch chat messages when a home is selected
  useEffect(() => {
    if (!selectedHome) return;

   const q = query(
  collection(db, "houseChat"),
  where("homeId", "==", selectedHome.id)
);


    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('msgs',msgs)
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedHome]);

  const handleSend = async () => {
    if (!message || !selectedHome) return;
    if (!user || !user.uid) {
      console.error("User is not authenticated properly");
      return;
    }

    try {
      await addDoc(collection(db, "houseChat"), {
        homeId: selectedHome.id,
        sender: user.uid,
        text: message,
        createdAt: serverTimestamp(),
      });

      // Notify all members
      const membersQuery = query(
        collection(db, "homeRequests"),
        where("to", "==", selectedHome.createdBy),
        where("status", "==", "accepted")
      );
      const membersSnap = await getDocs(membersQuery);

      const memberUIDs = membersSnap.docs.map((doc) => doc.data().from);
      memberUIDs.push(selectedHome.createdBy);

      for (const toUID of memberUIDs) {
        try {
          await fetch(`${import.meta.env.VITE_BACKEND_API}/send-notification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toUID,
              fromUID: user.uid,
              message: `New message in home "${selectedHome.name}"`,
            }),
          });
        } catch (err) {
          console.error(`Notification failed for ${toUID}`, err);
        }
      }

      setStatus("Message sent and notification delivered");
      setMessage("");
      setShowInput(false);
    } catch (err) {
      console.error(err);
      setStatus("Error sending message");
    }
  };

  return (
  <div className="p-4 max-w-xl mx-auto space-y-4 bg-base-100 text-base-content">
    <h2 className="text-xl font-bold mb-2">My Homes</h2>

    <ul className="space-y-2">
      {joinedHomes.map((home) => (
        <li
          key={home.id}
          className={`p-3 border rounded cursor-pointer transition hover:bg-base-200 ${
            selectedHome?.id === home.id ? "bg-base-200 shadow-md" : ""
          }`}
          onClick={() => setSelectedHome(home)}
        >
          <div className="flex justify-between items-center">
            <span>🏠 {home.name}</span>
            {home.premium && (
              <span className="badge badge-warning text-xs">Premium</span>
            )}
          </div>
        </li>
      ))}
    </ul>

    {selectedHome && (
      <div className="mt-4 border-t pt-4 space-y-4">
        <h3 className="text-lg font-semibold">
          Home: {selectedHome.name}{" "}
          {selectedHome.premium && (
            <span className="badge badge-warning text-xs ml-2">Premium</span>
          )}
        </h3>

        <div className="max-h-64 overflow-y-auto border p-3 rounded bg-base-200 space-y-2">
          {messages.length === 0 && (
            <p className="text-gray-500 text-sm">No messages yet.</p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat ${
                msg.sender === user.uid ? "chat-end" : "chat-start"
              }`}
            >
              <div className="chat-header text-sm font-semibold mb-1">
                {msg.sender === user.uid ? "You" : msg.sender}
                {msg.createdAt?.toDate && (
                  <time className="text-xs text-gray-400 ml-2">
                    {msg.createdAt.toDate().toLocaleString()}
                  </time>
                )}
              </div>
              <div className="chat-bubble bg-base-100 text-base-content shadow">
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {!showInput ? (
          <button
            className="btn btn-primary"
            onClick={() => setShowInput(true)}
          >
            ➕ Add Message
          </button>
        ) : (
          <div className="space-y-2">
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="btn btn-success" onClick={handleSend}>
              Send
            </button>
          </div>
        )}
      </div>
    )}

    {status && <p className="text-sm text-center text-blue-500">{status}</p>}
  </div>
);

};

export default Familygroup;
