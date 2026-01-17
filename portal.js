import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;

// Check auth
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  
  currentUser = user;
  await loadPortals();
});

// Load all campaigns as portals
async function loadPortals() {
  try {
    const campaignsRef = collection(db, 'campaigns');
    const q = query(
      campaignsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const portalGrid = document.getElementById('portalGrid');
    const noPortals = document.getElementById('noPortals');
    
    document.getElementById('loading').classList.add('hidden');
    
    if (querySnapshot.empty) {
      noPortals.classList.remove('hidden');
      return;
    }
    
    portalGrid.classList.remove('hidden');
    portalGrid.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
      const campaign = doc.data();
      const portal = createPortalDoor(doc.id, campaign);
      portalGrid.appendChild(portal);
    });
    
  } catch (error) {
    console.error('Error loading portals:', error);
    alert('Error loading portals');
  }
}

// Create portal door
function createPortalDoor(id, campaign) {
  const portal = document.createElement('a');
  portal.href = `campaign.html?id=${id}`;
  portal.className = 'portal-door block relative';
  
  // Color map based on campaign system
  const colorMap = {
    'Fantasy': 'from-purple-600 to-purple-800',
    'Sci-Fi': 'from-blue-600 to-blue-800',
    'Cyberpunk': 'from-cyan-600 to-cyan-800',
    'Horror': 'from-red-600 to-red-800',
    'Cozy': 'from-green-600 to-green-800',
    'Custom': 'from-amber-600 to-amber-800'
  };
  
  const iconMap = {
    'Fantasy': '⚔️',
    'Sci-Fi': '🚀',
    'Cyberpunk': '⚡',
    'Horror': '🩸',
    'Cozy': '🌿',
    'Custom': '🎲'
  };
  
  const gradient = colorMap[campaign.system] || 'from-amber-600 to-amber-800';
  const icon = iconMap[campaign.system] || '🎲';
  
  portal.innerHTML = `
    <div class="bg-gradient-to-br ${gradient} rounded-2xl p-8 h-64 flex flex-col items-center justify-center text-center border-4 border-white/20 relative overflow-hidden">
      
      <!-- Portal ring effect -->
      <div class="absolute inset-0 rounded-2xl border-4 border-white/10 portal-active"></div>
      
      <!-- Content -->
      <div class="relative z-10">
        <div class="text-6xl mb-4">${icon}</div>
        <h3 class="text-2xl font-bold text-white mb-2">${campaign.name}</h3>
        <p class="text-white/80 text-sm mb-4">${campaign.system}</p>
        
        <div class="flex gap-4 justify-center text-xs text-white/70">
          <span>${campaign.careEarned || 0} CARE</span>
          <span>•</span>
          <span>Portal Active</span>
        </div>
      </div>
      
      <!-- Glow effect on hover -->
      <div class="absolute inset-0 bg-white/0 hover:bg-white/10 transition-all duration-300 rounded-2xl"></div>
    </div>
  `;
  
  return portal;
}