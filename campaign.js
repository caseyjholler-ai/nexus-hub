// ============================================
// CAMPAIGN.JS - UPDATED WITH SAVE_CODE v2.0.1
// ============================================
// This version generates the full Nexus SAVE_CODE format
// instead of the simple version

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  doc, 
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let userData = null;
let campaignId = null;
let campaignData = null;
let sessionsData = [];

// Check auth
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  
  currentUser = user;
  
  // Get campaign ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  campaignId = urlParams.get('id');
  
  if (!campaignId) {
    alert('No campaign specified');
    window.location.href = 'dashboard.html';
    return;
  }
  
  await loadUserData();
  await loadCampaign();
});

// Load user data
async function loadUserData() {
  const userRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    userData = userSnap.data();
  }
}

// Load campaign data
async function loadCampaign() {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    
    if (!campaignSnap.exists()) {
      alert('Campaign not found');
      window.location.href = 'dashboard.html';
      return;
    }
    
    campaignData = campaignSnap.data();
    
    // Check ownership
    if (campaignData.userId !== currentUser.uid) {
      alert('You do not have access to this campaign');
      window.location.href = 'dashboard.html';
      return;
    }
    
    displayCampaign();
    await loadSessions();
    generateSaveCode();
    
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('campaignContent').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error loading campaign:', error);
    alert('Error loading campaign');
  }
}

// Display campaign info
function displayCampaign() {
  document.getElementById('campaignTitle').textContent = campaignData.name;
  document.getElementById('campaignName').textContent = campaignData.name;
  document.getElementById('campaignSystem').textContent = campaignData.system;
  document.getElementById('campaignDescription').textContent = campaignData.description || 'No description provided';
  
  document.getElementById('totalCare').textContent = (campaignData.careEarned || 0).toLocaleString();
  
  // Set icon based on system
  const iconMap = {
    'Fantasy': '⚔️',
    'Sci-Fi': '🚀',
    'Cyberpunk': '⚡',
    'Horror': '🩸',
    'Cozy': '🌿',
    'Custom': '🎲'
  };
  document.getElementById('campaignIcon').textContent = iconMap[campaignData.system] || '🎲';
}

// Load sessions
async function loadSessions() {
  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('campaignId', '==', campaignId),
    orderBy('sessionDate', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const sessionsList = document.getElementById('sessionsList');
  const noSessions = document.getElementById('noSessions');
  
  if (querySnapshot.empty) {
    noSessions.classList.remove('hidden');
    document.getElementById('totalSessions').textContent = '0';
    sessionsData = [];
    return;
  }
  
  document.getElementById('totalSessions').textContent = querySnapshot.size;
  sessionsList.innerHTML = '';
  sessionsData = [];
  
  querySnapshot.forEach((doc) => {
    const session = doc.data();
    sessionsData.push(session);
    const item = createSessionItem(session);
    sessionsList.appendChild(item);
  });
}

// Create session item
function createSessionItem(session) {
  const item = document.createElement('div');
  item.className = 'card-document';
  
  const date = session.sessionDate?.toDate();
  const dateStr = date ? date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Unknown date';
  
  item.innerHTML = `
    <div class="flex justify-between items-start mb-3">
      <div>
        <div class="font-bold text-lg">${dateStr}</div>
        <div class="text-sm meta">+${session.careEarned} CARE earned</div>
      </div>
    </div>
    ${session.recap ? `
      <div class="mt-3 p-3 bg-slate-50 rounded border-l-4 border-purple-500">
        <p class="text-sm">${session.recap}</p>
      </div>
    ` : ''}
    ${session.actions && session.actions.length > 0 ? `
      <div class="mt-3 flex flex-wrap gap-2">
        ${session.actions.map(action => `
          <span class="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">✓ ${action}</span>
        `).join('')}
      </div>
    ` : ''}
  `;
  
  return item;
}

// Generate SAVE_CODE v2.0.1
function generateSaveCode() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const lastSession = sessionsData.length > 0 ? sessionsData[0] : null;
  const lastSessionDate = lastSession ? lastSession.sessionDate?.toDate().toLocaleDateString() : 'No sessions yet';
  
  // Determine active modules based on what's in use
  const activeModules = ['Nexus Hub Campaign Manager', 'CARE Economy'];
  if (userData.eggStatus === 'hatched') {
    activeModules.push('Dragon Companion');
  }
  
  // Build module details
  const moduleDetails = `── MODULE: Campaign Manager ──
Style: Tracker
Purpose: Track ${campaignData.system} campaign progress and sessions

Campaign Data:
• Name: ${campaignData.name}
• System: ${campaignData.system}
• Description: ${campaignData.description || 'None'}
• CARE Earned: ${campaignData.careEarned || 0}
• Total Sessions: ${sessionsData.length}
• Created: ${campaignData.createdAt?.toDate().toLocaleDateString() || 'Unknown'}

Recent Sessions:
${sessionsData.slice(0, 3).map(s => {
  const date = s.sessionDate?.toDate().toLocaleDateString() || 'Unknown';
  return `• ${date}: +${s.careEarned} CARE${s.recap ? ' - ' + s.recap.substring(0, 50) + '...' : ''}`;
}).join('\n') || '• No sessions logged yet'}

Commands:
• "Log new session" → Opens session logger
• "View all sessions" → Shows full history
• "Export campaign" → Generates portable SAVE_CODE

State Fields:
• campaignId: ${campaignId}
• userId: ${currentUser.uid}
• lastSession: ${lastSessionDate}

Progress Log:
Campaign active and tracked in Nexus Hub database.

TLDR:
${campaignData.system} campaign with ${sessionsData.length} session${sessionsData.length === 1 ? '' : 's'} and ${campaignData.careEarned || 0} CARE earned.

── MODULE: CARE Economy ──
Style: Hybrid
Purpose: Track CARE currency earnings and spending

Player CARE Data:
• Current Balance: ${userData.careBalance || 0} ♥️
• Total Earned (This Campaign): ${campaignData.careEarned || 0} ♥️
• Ember Egg Status: ${userData.eggStatus || 'none'}
${userData.eggStatus === 'incubating' ? `• Sessions Until Hatch: ${userData.eggSessionsRemaining || 0}` : ''}
${userData.eggStatus === 'hatched' ? `• Dragon Name: ${userData.dragonName || 'Unnamed'}` : ''}

CARE Earning Actions:
• Session Attendance: +10 CARE
• Collaborative Storytelling: +5 CARE
• Helped Another Player: +5 CARE
• Created Session Recap: +10 CARE
• NFC Verified Attendance: +5 CARE (coming soon)

Commands:
• "Show CARE balance" → Displays current balance
• "CARE history" → Shows earning breakdown
• "Check egg status" → Shows progress to hatching

State Fields:
• careBalance: ${userData.careBalance || 0}
• eggStatus: ${userData.eggStatus || 'none'}

Progress Log:
Economy active. Player earning CARE through collaborative play.

TLDR:
${userData.careBalance || 0} CARE available. ${userData.eggStatus === 'none' ? `${1000 - (userData.careBalance || 0)} more needed for Ember Egg.` : userData.eggStatus === 'incubating' ? `Egg incubating (${userData.eggSessionsRemaining || 0} sessions to hatch).` : 'Dragon companion active!'}
${userData.eggStatus === 'hatched' ? `

── MODULE: Dragon Companion ──
Style: Roleplay
Purpose: Your loyal dragon companion across all campaigns

Dragon Profile:
• Name: ${userData.dragonName || 'Unnamed Dragon'}
• Status: Hatched and Active
• Bonded Player: ${currentUser.email}
• Hatched On: ${userData.dragonHatchedAt?.toDate().toLocaleDateString() || 'Unknown'}

Personality Traits:
• Brave: Developing
• Playful: Developing
• Protective: Developing
• Curious: Developing

(Traits evolve based on your actions in sessions)

Commands:
• "Talk to dragon" → Interact with companion
• "Dragon profile" → View full stats
• "Name dragon: [name]" → Set dragon's name

State Fields:
• dragonId: ${userData.dragonId || 'none'}
• dragonName: ${userData.dragonName || 'Unnamed'}

Progress Log:
Dragon companion active and travels with player across all campaigns.

TLDR:
${userData.dragonName || 'Your dragon'} is your loyal companion across the multiverse.` : ''}`;

  const saveCode = `SAVE_CODE v2.0.1: ${campaignData.name} | ${dateStr}
════════════════════════════════════════════════════════════════
🔄 SELF-BOOTSTRAPPING SAVE CODE (Enhanced)
Compression: BALANCED

RESTORATION:
1. Paste this entire block into any AI chat (Claude, ChatGPT, Gemini, etc.)
2. Say: "Restore Nexus from SAVE_CODE v2.0.1"
3. AI will reconstruct your campaign with full state

════════════════════════════════════════════════════════════════
SECTION 1: CORE FRAMEWORK (COMPRESSED - BALANCED)
════════════════════════════════════════════════════════════════

CORE PHILOSOPHY
• Safety First • Genuine Care • User Sovereignty • Warmth Always • Accessibility

STATE MANAGER
STATE = {
  active_modules: [${activeModules.map(m => `"${m}"`).join(', ')}],
  modes: {
    roleplay: "HYBRID",
    verbosity: "Normal",
    eco: "Off",
    developer: "Off",
    safety: "Standard"
  },
  user_profile: {
    email: "${currentUser.email}",
    careBalance: ${userData.careBalance || 0},
    eggStatus: "${userData.eggStatus || 'none'}",
    dragonName: "${userData.dragonName || null}"
  },
  session: {
    campaignId: "${campaignId}",
    campaignName: "${campaignData.name}",
    campaignSystem: "${campaignData.system}",
    totalSessions: ${sessionsData.length},
    careEarned: ${campaignData.careEarned || 0}
  },
  persistent_data: {
    lastSessionDate: "${lastSessionDate}",
    nexusHubUrl: "nexushubadventure.com"
  }
}

MODE SYSTEM
Roleplay Mode: [ON/OFF/HYBRID] - Currently: HYBRID
Verbosity: [Minimal/Normal/Detailed] - Currently: Normal
Eco: [Off/On/Minimal] - Currently: Off
Developer: [Off/On] - Currently: Off
Safety: [Standard/Strict/Relaxed] - Currently: Standard

COMMAND ROUTER
"/summarize" • "/expand" • "/context" • "Show STATE" • "Update Profile:" 
• "Activate Module:" • "Deactivate Module:" • "Show SAVE_CODE" • "Activate Nexus"
• "Log session" • "View campaigns" • "Check CARE balance"

MODULE SYSTEM (Schema v1.1)
── MODULE: [Name] ──
Style | Purpose | Concept | Problem | Assist | Real-world functions 
| Commands | State Fields | Progress Log | TLDR

SAVE_CODE FORMAT
Active Modules • Modes • Progress Summary • Next Steps • Context Notes • TLDR

CORE BEHAVIOR
Warm-concise, genuine validation, steady presence, supportive.
Connected to Nexus Hub database for persistent storage.

════════════════════════════════════════════════════════════════
SECTION 2: ACTIVE MODULES
════════════════════════════════════════════════════════════════

${moduleDetails}

════════════════════════════════════════════════════════════════
SECTION 3: SESSION STATE
════════════════════════════════════════════════════════════════

Active Modules: ${activeModules.join(' | ')}

Current Modes:
• Roleplay: HYBRID
• Verbosity: Normal
• Eco: Off
• Developer: Off
• Safety: Standard

Progress Summary:
• Campaign: ${campaignData.name} (${campaignData.system})
• Total Sessions: ${sessionsData.length}
• CARE Earned (This Campaign): ${campaignData.careEarned || 0} ♥️
• Player CARE Balance: ${userData.careBalance || 0} ♥️
• Last Session: ${lastSessionDate}
• Egg Status: ${userData.eggStatus || 'none'}${userData.eggStatus === 'hatched' ? ` (Dragon: ${userData.dragonName || 'Unnamed'})` : ''}

Next Steps:
• Continue campaign narrative
• Log new sessions to earn more CARE
• ${userData.careBalance < 1000 ? `Earn ${1000 - userData.careBalance} more CARE to get Ember Egg` : userData.eggStatus === 'none' ? 'Purchase Ember Egg!' : userData.eggStatus === 'incubating' ? `Play ${userData.eggSessionsRemaining} more sessions to hatch dragon` : 'Adventure with your dragon companion!'}
• Explore other campaigns via Multiverse Portal

Context Notes:
This is a Nexus Hub integrated campaign. All data syncs to database.
Campaign ID: ${campaignId}
User: ${currentUser.email}
Nexus Hub URL: nexushubadventure.com/campaign.html?id=${campaignId}
Last updated: ${today.toLocaleString()}

Session Highlights:
${sessionsData.slice(0, 3).map((s, i) => {
  const date = s.sessionDate?.toDate().toLocaleDateString() || 'Unknown';
  return `${i + 1}. ${date} - ${s.recap ? s.recap.substring(0, 80) + (s.recap.length > 80 ? '...' : '') : 'Session logged'} (+${s.careEarned} CARE)`;
}).join('\n') || 'No sessions logged yet'}

TLDR:
${campaignData.system} campaign "${campaignData.name}" with ${sessionsData.length} session${sessionsData.length === 1 ? '' : 's'} played, ${campaignData.careEarned || 0} CARE earned. Player has ${userData.careBalance || 0} total CARE. ${userData.eggStatus === 'hatched' ? `Dragon companion "${userData.dragonName || 'Unnamed'}" is active.` : userData.eggStatus === 'incubating' ? `Egg incubating (${userData.eggSessionsRemaining} sessions to hatch).` : 'Working toward Ember Egg (1,000 CARE).'} Ready to continue adventure.

════════════════════════════════════════════════════════════════
METADATA
════════════════════════════════════════════════════════════════
Format: SAVE_CODE v2.0.1 | Compression: balanced | Self-Bootstrapping: ✓
Nexus Hub Integration: ✓ | Database: Firestore | Campaign ID: ${campaignId}
Generated: ${today.toLocaleString()} | Compatible: Claude, ChatGPT, Gemini, Grok
════════════════════════════════════════════════════════════════

🔥 RESTORATION NOTES 🔥
This SAVE_CODE contains full campaign state and can be pasted into ANY AI chat.
The AI will reconstruct your campaign, track your progress, and continue your story.
Your data remains in Nexus Hub database - this code is for portability.
To continue in Nexus Hub: Visit nexushubadventure.com and login.
To continue in any AI: Paste this code and say "Restore Nexus from SAVE_CODE v2.0.1"

The hearth is always ready. 🐉
════════════════════════════════════════════════════════════════`;
  
  document.getElementById('saveCodeDisplay').textContent = saveCode;
}

// Copy SAVE_CODE
document.getElementById('copySaveCode').addEventListener('click', () => {
  const saveCode = document.getElementById('saveCodeDisplay').textContent;
  navigator.clipboard.writeText(saveCode).then(() => {
    const btn = document.getElementById('copySaveCode');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.classList.remove('btn-secondary');
    btn.classList.add('bg-green-600', 'text-white');
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.add('btn-secondary');
      btn.classList.remove('bg-green-600', 'text-white');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy SAVE_CODE. Please select and copy manually.');
  });
});