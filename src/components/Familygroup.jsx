import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const Familygroup = () => {
  const [user, setUser] = useState(null);
  const [joinedHomes, setJoinedHomes] = useState([]);
  const [selectedHome, setSelectedHome] = useState(null);
  const [message, setMessage] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [status, setStatus] = useState("");

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

  const handleSend = async () => {
    if (!message || !selectedHome) return;
if (!user || !user.uid) {
  console.error("User is not authenticated properly");
  return;
}
    try {
      // Add chat message to houseChat
      console.log('user.uid',user.uid)
      await addDoc(collection(db, "houseChat"), {
        homeId: selectedHome.id,
        sender: user.uid,
        text: message,
        createdAt: serverTimestamp(),
      });

      // Notify all members (assuming OneSignal external_id = Firebase UID)
      const membersQuery = query(
        collection(db, "homeRequests"),
        where("to", "==", selectedHome.createdBy),
        where("status", "==", "accepted")
      );
      const membersSnap = await getDocs(membersQuery);

      const memberUIDs = membersSnap.docs.map((doc) => doc.data().from);
memberUIDs.push(selectedHome.createdBy); // Include home owner too

for (const toUID of memberUIDs) {
  try {
    await fetch(`${import.meta.env.VITE_BACKEND_API}/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUID: toUID, // send to just this user
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
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-2">My Homes</h2>

      <ul className="space-y-2">
        {joinedHomes.map((home) => (
          <li
            key={home.id}
            className={`p-2 border rounded cursor-pointer hover:bg-gray-100 ${
              selectedHome?.id === home.id ? "bg-gray-200" : ""
            }`}
            onClick={() => setSelectedHome(home)}
          >
            🏠 {home.name}
          </li>
        ))}
      </ul>

      {selectedHome && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-lg font-semibold">Home: {selectedHome.name}</h3>

          {!showInput ? (
            <button
              className="btn btn-primary mt-2"
              onClick={() => setShowInput(true)}
            >
              ➕ Add Message
            </button>
          ) : (
            <div className="mt-2 space-y-2">
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
