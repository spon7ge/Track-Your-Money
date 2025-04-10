import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Charts = ({ transactions, categories }) => {
  const [chartView, setChartView] = useState('expenses'); // 'expenses' or 'income'
  
  // Define income categories - should match what's in App.js
  const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'];
  
  // Prepare data for pie chart (category breakdown)
  const preparePieChartData = () => {
    // Determine which type of transactions to show
    const filterType = chartView === 'expenses' ? 'expense' : 'income';
    const relevantCategories = chartView === 'expenses' ? categories : incomeCategories;
    
    // Initialize totals with 0 for each category
    const categoryTotals = {};
    relevantCategories.forEach(cat => {
      categoryTotals[cat] = 0;
    });

    // Calculate totals for each category
    transactions.forEach(transaction => {
      if (transaction.type === filterType) {
        const cat = transaction.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(transaction.amount);
      }
    });

    // Prepare data for chart.js
    return {
      labels: Object.keys(categoryTotals).filter(cat => categoryTotals[cat] > 0),
      datasets: [
        {
          data: Object.values(categoryTotals).filter(total => total > 0),
          backgroundColor: [
            '#4ade80', // green
            '#cf6679', // pink-red
            '#03dac6', // teal
            '#ffb74d', // orange
            '#64b5f6', // blue
            '#ba68c8', // purple
            '#4db6ac', // jade
            '#fff176', // yellow
          ],
          borderColor: '#1e1e1e',
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare data for monthly spending/income trends
  const prepareBarChartData = () => {
    // Determine which type of transactions to show
    const filterType = chartView === 'expenses' ? 'expense' : 'income';
    
    // Get the last 6 months
    const monthsData = {};
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${month.getMonth() + 1}/${month.getFullYear()}`;
      monthsData[monthKey] = 0;
    }

    // Calculate spending/income for each month
    transactions.forEach(transaction => {
      if (transaction.type === filterType) {
        // Use fullDate if available, otherwise fallback to regular date
        const transDate = transaction.fullDate 
          ? new Date(transaction.fullDate) 
          : new Date(transaction.date);
        
        const monthKey = `${transDate.getMonth() + 1}/${transDate.getFullYear()}`;
        
        if (monthsData[monthKey] !== undefined) {
          monthsData[monthKey] += parseFloat(transaction.amount);
        }
      }
    });

    // Format month names for display
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = Object.keys(monthsData).map(key => {
      const [month, year] = key.split('/');
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    });

    return {
      labels,
      datasets: [
        {
          label: chartView === 'expenses' ? 'Monthly Expenses' : 'Monthly Income',
          data: Object.values(monthsData),
          backgroundColor: chartView === 'expenses' ? '#cf6679' : '#4ade80',
          borderColor: chartView === 'expenses' ? '#bd5565' : '#3cbe6d',
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#e0e0e0',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: chartView === 'expenses' ? 'Monthly Spending Trends' : 'Monthly Income Trends',
        color: '#e0e0e0',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#333',
        },
        ticks: {
          color: '#e0e0e0',
          callback: function(value) {
            return '$' + value;
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#e0e0e0'
        }
      }
    }
  };

  // Check if we have transactions of the selected type
  const hasTransactionsOfType = (type) => {
    return transactions.some(t => t.type === (type === 'expenses' ? 'expense' : 'income'));
  };

  // Only render charts if we have transaction data
  if (transactions.length === 0) {
    return (
      <div className="charts-no-data">
        <p>Add some transactions to see spending analytics</p>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <div className="chart-toggle">
        <button 
          className={`chart-toggle-btn ${chartView === 'expenses' ? 'active' : ''}`}
          onClick={() => setChartView('expenses')}
        >
          Expenses
        </button>
        <button 
          className={`chart-toggle-btn ${chartView === 'income' ? 'active' : ''}`}
          onClick={() => setChartView('income')}
        >
          Income
        </button>
      </div>
      
      {!hasTransactionsOfType(chartView) ? (
        <div className="charts-no-data">
          <p>No {chartView} transactions yet</p>
        </div>
      ) : (
        <div className="chart-row">
          <div className="chart-card pie-chart">
            <h3>{chartView === 'expenses' ? 'Expenses' : 'Income'} by Category</h3>
            <div className="chart-wrapper">
              <Pie data={preparePieChartData()} options={pieOptions} />
            </div>
          </div>
          
          <div className="chart-card bar-chart">
            <h3>Monthly {chartView === 'expenses' ? 'Expenses' : 'Income'}</h3>
            <div className="chart-wrapper">
              <Bar data={prepareBarChartData()} options={barOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts; 