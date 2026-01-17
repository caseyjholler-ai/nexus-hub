import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, redirect to dashboard
    window.location.href = 'dashboard.html';
  }
});

// Show message helper
function showMessage(text, type = 'error') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'bg-green-100', 'text-green-800');
  
  if (type === 'error') {
    messageEl.classList.add('bg-red-100', 'text-red-800');
  } else {
    messageEl.classList.add('bg-green-100', 'text-green-800');
  }
  
  // Hide after 5 seconds
  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 5000);
}

// SIGNUP
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
  
  // Validate passwords match
  if (password !== passwordConfirm) {
    showMessage('Passwords do not match', 'error');
    return;
  }
  
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      careBalance: 0,
      eggStatus: 'none',
      eggSessionsRemaining: 0,
      dragonId: null,
      dragonName: null,
      createdAt: serverTimestamp()
    });
    
    showMessage('Account created! Redirecting...', 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    
  } catch (error) {
    console.error('Signup error:', error);
    showMessage(error.message, 'error');
  }
});

// LOGIN
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage('Login successful! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    
  } catch (error) {
    console.error('Login error:', error);
    showMessage('Invalid email or password', 'error');
  }
});