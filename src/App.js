// src/App.js
import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import Login from "./components/Login";
import { getTransactions, addTransaction } from "./utils/firestore";

const App = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const txs = await getTransactions();
        setTransactions(txs);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    await addTransaction({
      amount: 10.5,
      category: "Dining",
      description: "Coffee shop",
      date: new Date().toISOString(),
    });
    const updated = await getTransactions();
    setTransactions(updated);
  };

  const handleLogout = () => {
    auth.signOut();
  };

  if (!user) return <Login />;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Welcome, {user.displayName}</h2>
      <button onClick={handleLogout}>Log out</button>
      <h3>Transactions</h3>
      <button onClick={handleAdd}>Add Test Transaction</button>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id}>
            {tx.category} - ${tx.amount} - {tx.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;

