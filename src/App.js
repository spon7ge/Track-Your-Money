import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Header from './components/Header';
import Charts from './components/Charts';
import SignUp from './components/SignUp';
import { 
  trackAddTransaction, 
  trackDeleteTransaction, 
  trackUpdateDebtBalance, 
  trackUpdateSavingsBalance,
  trackViewCharts,
  trackHideCharts
} from './analytics';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [debtBalance, setDebtBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Other');
  const [categoryTotals, setCategoryTotals] = useState({});
  const [showCharts, setShowCharts] = useState(true);
  const [editingDebt, setEditingDebt] = useState(false);
  const [editingSavings, setEditingSavings] = useState(false);
  const [manualDebtBalance, setManualDebtBalance] = useState(0);
  const [manualSavingsBalance, setManualSavingsBalance] = useState(0);
  const [hasManualDebt, setHasManualDebt] = useState(false);
  const [hasManualSavings, setHasManualSavings] = useState(false);

  // Define categories using useMemo to fix ESLint warnings
  const expenseCategories = useMemo(() => ['Bills/Utilities', 'Groceries', 'Subscriptions', 'Misc', 'Other'], []);
  const incomeCategories = useMemo(() => ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'], []);
  
  // Define subcategories for additional tracking
  const savingsCategories = useMemo(() => ['Savings', 'Retirement', 'Emergency Fund'], []);
  const debtCategories = useMemo(() => ['Debt Payment', 'Loan Payment', 'Credit Card Payment'], []);
  
  // Get current categories based on type
  const getCurrentCategories = () => {
    return type === 'expense' ? expenseCategories : incomeCategories;
  };

  // Update category when type changes
  useEffect(() => {
    // Default to the first category of the selected type
    setCategory(type === 'expense' ? expenseCategories[0] : incomeCategories[0]);
  }, [type, expenseCategories, incomeCategories]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Add a small delay to ensure Firebase is fully initialized
      setTimeout(() => {
        setUser(currentUser);
        setLoading(false);
      }, 500);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Calculate general balance based on transactions
    const newBalance = transactions.reduce((total, transaction) => {
      return transaction.type === 'income' 
        ? total + parseFloat(transaction.amount) 
        : total - parseFloat(transaction.amount);
    }, 0);
    
    setBalance(newBalance);

    // Calculate debt and savings balances
    let totalDebt = 0;
    let totalSavings = 0;
    
    transactions.forEach(transaction => {
      // Add to debt balance if it's a debt payment
      if (transaction.type === 'expense' && debtCategories.includes(transaction.category)) {
        totalDebt += parseFloat(transaction.amount);
      }
      
      // Add to savings balance if it's savings-related
      if (transaction.type === 'expense' && savingsCategories.includes(transaction.category)) {
        totalSavings += parseFloat(transaction.amount);
      }
    });
    
    // Use manual balances if set, otherwise use calculated ones
    setDebtBalance(hasManualDebt ? manualDebtBalance : totalDebt);
    setSavingsBalance(hasManualSavings ? manualSavingsBalance : totalSavings);

    // Calculate totals by category for expenses
    const totals = {};
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const cat = transaction.category || 'Other';
        totals[cat] = (totals[cat] || 0) + parseFloat(transaction.amount);
      }
    });
    
    setCategoryTotals(totals);
  }, [transactions, debtCategories, savingsCategories, hasManualDebt, manualDebtBalance, hasManualSavings, manualSavingsBalance]);

  // Load data from localStorage when component mounts
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    
    // Load manual balances if they exist
    const savedManualDebt = localStorage.getItem('manualDebtBalance');
    const savedManualSavings = localStorage.getItem('manualSavingsBalance');
    const savedHasManualDebt = localStorage.getItem('hasManualDebt');
    const savedHasManualSavings = localStorage.getItem('hasManualSavings');
    
    if (savedManualDebt) setManualDebtBalance(parseFloat(savedManualDebt));
    if (savedManualSavings) setManualSavingsBalance(parseFloat(savedManualSavings));
    if (savedHasManualDebt) setHasManualDebt(savedHasManualDebt === 'true');
    if (savedHasManualSavings) setHasManualSavings(savedHasManualSavings === 'true');
  }, []);

  // Save data to localStorage whenever relevant states change
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);
  
  useEffect(() => {
    localStorage.setItem('manualDebtBalance', manualDebtBalance.toString());
    localStorage.setItem('hasManualDebt', hasManualDebt.toString());
  }, [manualDebtBalance, hasManualDebt]);
  
  useEffect(() => {
    localStorage.setItem('manualSavingsBalance', manualSavingsBalance.toString());
    localStorage.setItem('hasManualSavings', hasManualSavings.toString());
  }, [manualSavingsBalance, hasManualSavings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!description || !amount) return;
    
    const today = new Date();
    const amountNum = parseFloat(amount);
    
    const newTransaction = {
      id: Date.now(),
      description,
      amount: amountNum,
      type,
      category,
      date: today.toLocaleDateString(),
      fullDate: today.toISOString()
    };
    
    // Update balances immediately based on the new transaction
    if (type === 'expense') {
      if (debtCategories.includes(category)) {
        if (hasManualDebt) {
          // When in manual mode, update the manual balance
          setManualDebtBalance(prev => Math.max(0, prev - amountNum));
          setDebtBalance(prev => Math.max(0, prev - amountNum));
        } else {
          // When in automatic mode, just update the debt balance
          setDebtBalance(prev => Math.max(0, prev - amountNum));
        }
      }
      if (savingsCategories.includes(category)) {
        if (hasManualSavings) {
          // When in manual mode, update the manual balance
          setManualSavingsBalance(prev => prev + amountNum);
          setSavingsBalance(prev => prev + amountNum);
        } else {
          // When in automatic mode, just update the savings balance
          setSavingsBalance(prev => prev + amountNum);
        }
      }
    }
    
    // Track transaction added
    trackAddTransaction(type, category, amountNum);
    
    setTransactions([...transactions, newTransaction]);
    setDescription('');
    setAmount('');
  };

  const deleteTransaction = (id) => {
    // Find the transaction to be deleted first
    const transactionToDelete = transactions.find(t => t.id === id);
    
    if (transactionToDelete) {
      // Track transaction deleted
      trackDeleteTransaction(
        transactionToDelete.type, 
        transactionToDelete.category, 
        transactionToDelete.amount
      );
    }
    
    setTransactions(transactions.filter(transaction => transaction.id !== id));
  };

  // Function to get total expenses
  const getTotalExpenses = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === 'expense' 
        ? total + parseFloat(transaction.amount) 
        : total;
    }, 0);
  };

  // Toggle charts visibility
  const toggleCharts = () => {
    const newShowCharts = !showCharts;
    setShowCharts(newShowCharts);
    
    // Track chart visibility change
    if (newShowCharts) {
      trackViewCharts();
    } else {
      trackHideCharts();
    }
  };
  
  // Handle the debt balance form submission
  const handleDebtBalanceSubmit = (e) => {
    e.preventDefault();
    setEditingDebt(false);
    setHasManualDebt(true); // Switch to manual mode
    
    // Track debt balance update
    trackUpdateDebtBalance(manualDebtBalance, true);
  };
  
  // Handle the savings balance form submission
  const handleSavingsBalanceSubmit = (e) => {
    e.preventDefault();
    setEditingSavings(false);
    setHasManualSavings(true); // Switch to manual mode
    
    // Track savings balance update
    trackUpdateSavingsBalance(manualSavingsBalance, true);
  };
  
  // Reset to automatic tracking
  const resetDebtBalance = () => {
    setHasManualDebt(false);
    setManualDebtBalance(0);
    // Recalculate debt balance from transactions
    const calculatedDebt = transactions.reduce((total, transaction) => {
      if (transaction.type === 'expense' && debtCategories.includes(transaction.category)) {
        return total - parseFloat(transaction.amount);
      }
      return total;
    }, 0);
    setDebtBalance(Math.max(0, calculatedDebt));
    setEditingDebt(false);
  };
  
  // Reset to automatic tracking
  const resetSavingsBalance = () => {
    setHasManualSavings(false);
    setManualSavingsBalance(0);
    // Recalculate savings balance from transactions
    const calculatedSavings = transactions.reduce((total, transaction) => {
      if (transaction.type === 'expense' && savingsCategories.includes(transaction.category)) {
        return total + parseFloat(transaction.amount);
      }
      return total;
    }, 0);
    setSavingsBalance(calculatedSavings);
    setEditingSavings(false);
  };

  // Update expense categories to include debt and savings
  const allExpenseCategories = useMemo(() => [
    ...expenseCategories,
    ...debtCategories.filter(cat => !expenseCategories.includes(cat)),
    ...savingsCategories.filter(cat => !expenseCategories.includes(cat))
  ], [expenseCategories, debtCategories, savingsCategories]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Header user={user} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route 
            path="/" 
            element={
              user ? (
                <div className="main-content">
                  <div className="balances-container">
                    <div className="balance-card">
                      <h2>Current Balance</h2>
                      <div className={`balance ${balance < 0 ? 'negative' : 'positive'}`}>
                        ${balance.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="balance-card">
                      <h2>Debt</h2>
                      {editingDebt ? (
                        <form onSubmit={handleDebtBalanceSubmit} className="balance-edit-form">
                          <div className="form-group">
                            <input
                              type="number"
                              value={manualDebtBalance}
                              onChange={(e) => setManualDebtBalance(parseFloat(e.target.value) || 0)}
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div className="balance-edit-actions">
                            <button type="submit" className="edit-btn save">Save</button>
                            <button type="button" className="edit-btn cancel" onClick={() => setEditingDebt(false)}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="balance debt">
                            ${debtBalance.toFixed(2)}
                          </div>
                          <div className="balance-actions">
                            <button onClick={() => setEditingDebt(true)} className="action-btn edit-btn">
                              Edit
                            </button>
                            {hasManualDebt && (
                              <button onClick={resetDebtBalance} className="action-btn reset-btn">
                                Reset
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="balance-card">
                      <h2>Savings</h2>
                      {editingSavings ? (
                        <form onSubmit={handleSavingsBalanceSubmit} className="balance-edit-form">
                          <div className="form-group">
                            <input
                              type="number"
                              value={manualSavingsBalance}
                              onChange={(e) => setManualSavingsBalance(parseFloat(e.target.value) || 0)}
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div className="balance-edit-actions">
                            <button type="submit" className="edit-btn save">Save</button>
                            <button type="button" className="edit-btn cancel" onClick={() => setEditingSavings(false)}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="balance savings">
                            ${savingsBalance.toFixed(2)}
                          </div>
                          <div className="balance-actions">
                            <button onClick={() => setEditingSavings(true)} className="action-btn edit-btn">
                              Edit
                            </button>
                            {hasManualSavings && (
                              <button onClick={resetSavingsBalance} className="action-btn reset-btn">
                                Reset
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="toggle-container">
                    <button 
                      className={`toggle-button ${showCharts ? 'active' : ''}`} 
                      onClick={toggleCharts}
                    >
                      {showCharts ? 'Hide Charts' : 'Show Charts'}
                    </button>
                  </div>
                  
                  {showCharts && <Charts transactions={transactions} categories={allExpenseCategories} />}
                  
                  <div className="form-container">
                    <h2>Add Transaction</h2>
                    <form onSubmit={handleSubmit}>
                      <div className="form-group">
                        <label>Description</label>
                        <input 
                          type="text" 
                          value={description} 
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Enter description"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Amount</label>
                        <input 
                          type="number" 
                          value={amount} 
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter amount"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Type</label>
                          <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value)}
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Category</label>
                          <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                          >
                            {getCurrentCategories().map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            
                            {/* Add debt categories when expense is selected */}
                            {type === 'expense' && (
                              <optgroup label="Debt">
                                {debtCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </optgroup>
                            )}
                            
                            {/* Add savings categories when expense is selected */}
                            {type === 'expense' && (
                              <optgroup label="Savings">
                                {savingsCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      </div>
                      
                      <button type="submit" className="btn">Add Transaction</button>
                    </form>
                  </div>
                  
                  {Object.keys(categoryTotals).length > 0 && (
                    <div className="category-summary-container">
                      <h2>Expenses by Category</h2>
                      <div className="category-list">
                        {allExpenseCategories.map(cat => (
                          categoryTotals[cat] ? (
                            <div key={cat} className="category-item">
                              <div className="category-name">{cat}</div>
                              <div className="category-amount">${categoryTotals[cat].toFixed(2)}</div>
                              <div className="category-percentage">
                                {((categoryTotals[cat] / getTotalExpenses()) * 100).toFixed(1)}%
                              </div>
                              <div className="category-bar">
                                <div 
                                  className="category-bar-fill" 
                                  style={{ width: `${(categoryTotals[cat] / getTotalExpenses()) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : null
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="transaction-container">
                    <h2>Transaction History</h2>
                    {transactions.length === 0 ? (
                      <p className="no-transactions">No transactions yet</p>
                    ) : (
                      <ul className="transaction-list">
                        {transactions.map((transaction) => (
                          <li 
                            key={transaction.id} 
                            className={`transaction-item ${transaction.type}`}
                          >
                            <div className="transaction-details">
                              <div className="transaction-info">
                                <div className="transaction-description">{transaction.description}</div>
                                <div className="transaction-category">{transaction.category}</div>
                              </div>
                              <div className="transaction-amount">
                                {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                              </div>
                              <div className="transaction-date">{transaction.date}</div>
                            </div>
                            <button 
                              className="delete-btn" 
                              onClick={() => deleteTransaction(transaction.id)}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
