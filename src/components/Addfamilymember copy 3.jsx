import React, { useState } from "react";
import { db, auth } from "../firebase";
import axios from 'axios';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const AddFamilyMember = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");

  const handleRequest = async () => {
    if (!email) return setStatus("Please enter an email");

    try {
      // 1. Find user by email
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const snapshot = await getDocs(userQuery);

      if (snapshot.empty) {
        setStatus("User not found");
        return;
      }

      const receiver = snapshot.docs[0];
      const receiverUID = receiver.id;
      const senderUID = auth.currentUser.uid;

      // 2. Check if a request already exists
      const requestQuery = query(
        collection(db, "friendRequests"),
        where("from", "==", senderUID),
        where("to", "==", receiverUID),
        where("status", "==", "pending")
      );
      const requestSnap = await getDocs(requestQuery);

      if (!requestSnap.empty) {
        // ✅ Only notify, but do not store again
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_API}/send-notification`,
          {
            toUID: receiverUID,
            fromUID: senderUID,
            message: `Reminder: You have a pending family request from ${auth.currentUser.email}`,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        // console.log('res', res.data.response.errors[0] )
        const errorMessage = res?.data?.response?.errors?.[0];
        setMessage(errorMessage || "Notification sent successfully");

        setStatus("You already sent a request. We reminded them again.");
        return; // 🔁 Skip storing duplicate
      }

      // 3. Add new request (if not duplicate)
      await addDoc(collection(db, "friendRequests"), {
        from: senderUID,
        to: receiverUID,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // 4. Send notification
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_API}/send-notification`, {
        toUID: receiverUID,
        fromUID: senderUID,
        message: `You have a new family request from ${auth.currentUser.email}`,
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      const errorMessage = res?.data?.response?.errors?.[0];
      setMessage(errorMessage || "Notification sent successfully");

      setStatus("Request sent");
    } catch (error) {
      console.error("Error sending request:", error);
      setStatus("Error sending request");
    }
  };



  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Add Family Member</h2>
      <input
        type="email"
        placeholder="Enter Gmail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input input-bordered w-full max-w-xs"
      />
      <button onClick={handleRequest} className="btn btn-primary mt-2">
        Send Request
      </button>
      {status && <p className="mt-2 text-sm text-info">{status}</p>}
      {message && <p className="mt-2 text-sm text-info">{message}</p>}
    </div>
  );
};

export default AddFamilyMember;
