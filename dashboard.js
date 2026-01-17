import { auth, db } from './firebase-config.js';
import { 
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  doc, 
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let userData = null;

// Check authentication state
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  
  currentUser = user;
  document.getElementById('userEmail').textContent = user.email;
  await loadDashboard();
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Load dashboard data
async function loadDashboard() {
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('User document not found');
      return;
    }
    
    userData = userSnap.data();
    displayCareBalance(userData.careBalance || 0);
    displayEmberEgg();
    await loadCampaigns();
    await loadRecentSessions();
    
    if (userData.eggStatus === 'hatched') {
      await loadDragon();
    }
    
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    alert('Error loading dashboard. Please refresh.');
  }
}

// Display CARE balance with count-up animation
function displayCareBalance(balance) {
  const balanceEl = document.getElementById('careBalance');
  const duration = 1000;
  const start = 0;
  const end = balance;
  const startTime = performance.now();
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * easeOut);
    
    balanceEl.textContent = current.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

// Display Ember Egg status
function displayEmberEgg() {
  const eggSection = document.getElementById('emberEggSection');
  const careBalance = userData.careBalance || 0;
  const eggStatus = userData.eggStatus || 'none';
  const sessionsRemaining = userData.eggSessionsRemaining || 0;
  
  if (eggStatus === 'none') {
    const progress = Math.min((careBalance / 1000) * 100, 100);
    const canBuy = careBalance >= 1000;
    
    eggSection.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4 ${canBuy ? 'egg-pulse' : ''}">🥚</div>
        <h3 class="text-2xl font-bold mb-2">Ember Egg</h3>
        <p class="mb-4">Collect 1,000 CARE to hatch your dragon companion</p>
        
        <div class="bg-slate-300 rounded-full h-6 mb-4 overflow-hidden">
          <div class="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-1000 flex items-center justify-center"
               style="width: ${progress}%">
            <span class="text-white text-xs font-bold">${careBalance}/1,000</span>
          </div>
        </div>
        
        ${canBuy ? `
          <button id="buyEggBtn" class="btn-primary">
            Hatch Your Egg! 🔥
          </button>
        ` : `
          <p class="text-sm">Keep logging sessions to earn more CARE</p>
        `}
      </div>
    `;
    
    if (canBuy) {
      document.getElementById('buyEggBtn').addEventListener('click', buyEmberEgg);
    }
    
  } else if (eggStatus === 'incubating') {
    const totalSessions = 10;
    const completedSessions = totalSessions - sessionsRemaining;
    const progress = (completedSessions / totalSessions) * 100;
    
    eggSection.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4 egg-pulse">🥚✨</div>
        <h3 class="text-2xl font-bold mb-2">Egg Incubating</h3>
        <p class="mb-4">Your dragon is growing! ${sessionsRemaining} more sessions until it hatches.</p>
        
        <div class="bg-slate-300 rounded-full h-6 mb-4 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-1000 flex items-center justify-center"
               style="width: ${progress}%">
            <span class="text-white text-xs font-bold">${completedSessions}/${totalSessions} sessions</span>
          </div>
        </div>
        
        <p class="text-sm">The egg pulses with warmth...</p>
      </div>
    `;
    
  } else if (eggStatus === 'hatched') {
    eggSection.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4">🐉</div>
        <h3 class="text-2xl font-bold mb-2">Your Dragon Has Hatched!</h3>
        <p>See your companion's profile below</p>
      </div>
    `;
  }
}

// Buy Ember Egg
async function buyEmberEgg() {
  if (!confirm('Spend 1,000 CARE to get your Ember Egg?\n\nIt will hatch after 10 logged sessions.')) {
    return;
  }
  
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      careBalance: userData.careBalance - 1000,
      eggStatus: 'incubating',
      eggSessionsRemaining: 10
    });
    
    alert('🥚 Your Ember Egg is now incubating! Log 10 sessions to hatch your dragon.');
    window.location.reload();
    
  } catch (error) {
    console.error('Error buying egg:', error);
    alert('Error purchasing egg. Please try again.');
  }
}

// Load campaigns
async function loadCampaigns() {
  const campaignsRef = collection(db, 'campaigns');
  const q = query(
    campaignsRef,
    where('userId', '==', currentUser.uid),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  
  const querySnapshot = await getDocs(q);
  const campaignsList = document.getElementById('campaignsList');
  const noCampaigns = document.getElementById('noCampaigns');
  const campaignCount = document.getElementById('campaignCount');
  
  if (querySnapshot.empty) {
    noCampaigns.classList.remove('hidden');
    campaignCount.textContent = '0 active';
    return;
  }
  
  campaignCount.textContent = `${querySnapshot.size} active`;
  campaignsList.innerHTML = '';
  
  querySnapshot.forEach((doc) => {
    const campaign = doc.data();
    const card = createCampaignCard(doc.id, campaign);
    campaignsList.appendChild(card);
  });
}

// Create campaign card
function createCampaignCard(id, campaign) {
  const card = document.createElement('a');
  card.href = `campaign.html?id=${id}`;
  card.className = 'card-document block';
  
  card.innerHTML = `
    <div class="flex justify-between items-start mb-3">
      <h3 class="text-xl font-bold">${campaign.name}</h3>
      <span class="text-sm font-semibold">${campaign.system}</span>
    </div>
    
    ${campaign.description ? `<p class="text-sm mb-3">${campaign.description}</p>` : ''}
    
    <div class="flex justify-between items-center text-sm">
      <span>CARE earned: ${campaign.careEarned || 0} ♥️</span>
      <span class="font-semibold">Continue →</span>
    </div>
  `;
  
  return card;
}

// Load recent sessions
async function loadRecentSessions() {
  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('userId', '==', currentUser.uid),
    orderBy('sessionDate', 'desc'),
    limit(5)
  );
  
  const querySnapshot = await getDocs(q);
  const sessionsList = document.getElementById('sessionsList');
  const noSessions = document.getElementById('noSessions');
  
  if (querySnapshot.empty) {
    noSessions.classList.remove('hidden');
    return;
  }
  
  sessionsList.innerHTML = '';
  
  querySnapshot.forEach((doc) => {
    const session = doc.data();
    const item = createSessionItem(session);
    sessionsList.appendChild(item);
  });
}

// Create session item
function createSessionItem(session) {
  const item = document.createElement('div');
  item.className = 'card-document';
  
  const date = session.sessionDate?.toDate();
  const dateStr = date ? date.toLocaleDateString() : 'Unknown date';
  
  item.innerHTML = `
    <div class="flex justify-between items-start mb-2">
      <span class="text-sm meta">${dateStr}</span>
      <span class="font-semibold text-emerald-600">+${session.careEarned} CARE</span>
    </div>
    ${session.recap ? `<p class="text-sm">${session.recap.substring(0, 100)}${session.recap.length > 100 ? '...' : ''}</p>` : ''}
  `;
  
  return item;
}

// Load dragon
async function loadDragon() {
  const dragonSection = document.getElementById('dragonSection');
  dragonSection.classList.remove('hidden');
  
  dragonSection.innerHTML = `
    <div class="bg-gradient-to-r from-red-900 to-orange-900 rounded-2xl p-8 border border-amber-500">
      <div class="text-center">
        <div class="text-8xl mb-4">🐉</div>
        <h3 class="text-3xl font-bold text-white mb-2">${userData.dragonName || 'Your Dragon'}</h3>
        <p class="text-amber-200">Your loyal companion across all campaigns</p>
      </div>
    </div>
  `;
}

// New Campaign Modal
document.getElementById('newCampaignBtn').addEventListener('click', () => {
  document.getElementById('newCampaignModal').classList.remove('hidden');
});

document.getElementById('cancelCampaignBtn').addEventListener('click', () => {
  document.getElementById('newCampaignModal').classList.add('hidden');
});

// Create new campaign
document.getElementById('newCampaignForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('campaignName').value;
  const system = document.getElementById('campaignSystem').value;
  const description = document.getElementById('campaignDescription').value;
  
  try {
    await addDoc(collection(db, 'campaigns'), {
      userId: currentUser.uid,
      name: name,
      system: system,
      description: description,
      careEarned: 0,
      createdAt: serverTimestamp()
    });
    
    document.getElementById('newCampaignModal').classList.add('hidden');
    document.getElementById('newCampaignForm').reset();
    await loadCampaigns();
    
  } catch (error) {
    console.error('Error creating campaign:', error);
    alert('Error creating campaign. Please try again.');
  }
});