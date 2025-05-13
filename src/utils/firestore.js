import { collection, addDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

export const addTransaction = async (data) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const txRef = collection(db, "users", user.uid, "transactions");
  await addDoc(txRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
};

export const getTransactions = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const txRef = collection(db, "users", user.uid, "transactions");
  const snap = await getDocs(txRef);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

