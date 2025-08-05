// Debug script to check localStorage contents
// Open browser console and run this to see what's stored

console.log('=== DEBUGGING ACCOUNT STORAGE ===');

// Check accounts
const accounts = localStorage.getItem('accounts');
console.log('Accounts:', accounts ? JSON.parse(accounts) : 'None');

// Check active account
const activeAccount = localStorage.getItem('activeAccount');
console.log('Active Account:', activeAccount ? JSON.parse(activeAccount) : 'None');

// Check all localStorage keys
const allKeys = Object.keys(localStorage);
console.log('All localStorage keys:', allKeys);

// Check transaction keys
const transactionKeys = allKeys.filter(key => key.startsWith('transactions_'));
console.log('Transaction keys found:', transactionKeys);

transactionKeys.forEach(key => {
  const data = localStorage.getItem(key);
  const parsed = data ? JSON.parse(data) : null;
  console.log(`${key}:`, parsed ? `${parsed.length} transactions` : 'empty');
});

// Check bill keys
const billKeys = allKeys.filter(key => key.startsWith('bills_'));
console.log('Bill keys found:', billKeys);

billKeys.forEach(key => {
  const data = localStorage.getItem(key);
  const parsed = data ? JSON.parse(data) : null;
  console.log(`${key}:`, parsed ? `${parsed.length} bills` : 'empty');
});
