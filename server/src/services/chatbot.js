const db = require('../store');

const INTENTS = [
  { name: 'find_donor', keywords: ['find donor', 'need donor', 'looking for', 'available donor', 'donor available', 'who can donate', 'find blood'] },
  { name: 'check_inventory', keywords: ['inventory', 'stock', 'available units', 'blood bank', 'how many units', 'blood available', 'supply'] },
  { name: 'request_help', keywords: ['emergency', 'urgent', 'need blood', 'request blood', 'need help', 'help me', 'critical'] },
  { name: 'blood_info', keywords: ['blood type', 'blood group', 'compatible', 'universal', 'donate', 'can donate', 'can receive', 'about blood'] },
  { name: 'eligibility', keywords: ['eligible', 'eligibility', 'who can donate', 'requirements', 'conditions', 'age', 'weight'] },
  { name: 'stats', keywords: ['statistics', 'stats', 'how many donors', 'total', 'overview', 'dashboard', 'numbers'] },
  { name: 'greeting', keywords: ['hello', 'hi', 'hey', 'salam', 'assalam', 'good morning', 'good evening'] },
  { name: 'thanks', keywords: ['thank', 'thanks', 'shukriya', 'appreciate', 'helpful'] },
];

const BLOOD_COMPATIBILITY = {
  'O-': { canDonateTo: 'everyone (universal donor)', canReceiveFrom: 'O- only' },
  'O+': { canDonateTo: 'O+, A+, B+, AB+', canReceiveFrom: 'O+, O-' },
  'A-': { canDonateTo: 'A-, A+, AB-, AB+', canReceiveFrom: 'A-, O-' },
  'A+': { canDonateTo: 'A+, AB+', canReceiveFrom: 'A+, A-, O+, O-' },
  'B-': { canDonateTo: 'B-, B+, AB-, AB+', canReceiveFrom: 'B-, O-' },
  'B+': { canDonateTo: 'B+, AB+', canReceiveFrom: 'B+, B-, O+, O-' },
  'AB-': { canDonateTo: 'AB-, AB+', canReceiveFrom: 'AB-, A-, B-, O-' },
  'AB+': { canDonateTo: 'AB+ only', canReceiveFrom: 'everyone (universal recipient)' },
};

function detectIntent(message) {
  const lower = message.toLowerCase();
  // Token-based matching: check if all words of a keyword appear in the message
  const tokens = lower.split(/\s+/);
  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      const kwTokens = kw.split(/\s+/);
      // Check if all keyword tokens appear somewhere in the message
      if (kwTokens.every(kt => tokens.some(t => t.startsWith(kt) || t.endsWith(kt) || t.includes(kt)))) {
        return intent.name;
      }
    }
    // Also check full substring match as fallback
    if (intent.keywords.some(kw => lower.includes(kw))) return intent.name;
  }
  return 'unknown';
}

function extractBloodGroup(message) {
  const upper = message.toUpperCase();
  return ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'].find(bg => upper.includes(bg)) || null;
}

function extractCity(message) {
  return ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'].find(c => message.toLowerCase().includes(c.toLowerCase())) || null;
}

function processMessage(message) {
  const intent = detectIntent(message);
  const bloodGroup = extractBloodGroup(message);
  const city = extractCity(message);

  switch (intent) {
    case 'greeting':
      return {
        text: "Assalamu Alaikum! I'm BloodBridge AI assistant. I can help you:\n\n- Find blood donors in your area\n- Check blood bank inventory\n- Submit emergency blood requests\n- Learn about blood compatibility\n\nHow can I help you today?",
        suggestions: ['Find a donor', 'Check blood inventory', 'Emergency request', 'Blood type info'],
      };

    case 'thanks':
      return {
        text: "You're welcome! Saving lives is what we do. If you need anything else, I'm here to help!",
        suggestions: ['Find a donor', 'Check inventory'],
      };

    case 'find_donor': {
      let donors = db.donors.data.filter(d => d.isAvailable);
      if (bloodGroup) donors = donors.filter(d => d.bloodGroup === bloodGroup);
      if (city) donors = donors.filter(d => d.city === city);

      const top5 = donors.sort((a, b) => b.rating - a.rating).slice(0, 5);

      if (top5.length === 0) {
        return {
          text: `No available donors found${bloodGroup ? ` for ${bloodGroup}` : ''}${city ? ` in ${city}` : ''}. Try broadening your search.`,
          suggestions: ['Check blood banks', 'Submit emergency request'],
        };
      }

      const list = top5.map((d, i) => `${i + 1}. ${d.name} (${d.bloodGroup}) - ${d.area}, ${d.city} | Rating: ${d.rating}/5`).join('\n');
      return {
        text: `Found ${donors.length} available donors${bloodGroup ? ` for ${bloodGroup}` : ''}${city ? ` in ${city}` : ''}:\n\n${list}${donors.length > 5 ? `\n\n...and ${donors.length - 5} more.` : ''}`,
        suggestions: ['Submit request', 'Check inventory', 'Search another city'],
      };
    }

    case 'check_inventory': {
      let hospitals = db.hospitals.data;
      if (city) hospitals = hospitals.filter(h => h.city === city);
      const top8 = hospitals.slice(0, 8);

      if (bloodGroup) {
        const withStock = top8.map(h => ({
          name: h.name, stock: h.bloodInventory[bloodGroup] || 0, city: h.city,
        })).sort((a, b) => b.stock - a.stock);
        const list = withStock.map((h, i) => `${i + 1}. ${h.name} (${h.city}): ${h.stock} units`).join('\n');
        return {
          text: `Blood inventory for ${bloodGroup}:\n\n${list}`,
          suggestions: ['Find donors', 'Submit request', 'Check another blood group'],
        };
      }

      const list = top8.map((h, i) => {
        const total = Object.values(h.bloodInventory).reduce((s, v) => s + v, 0);
        return `${i + 1}. ${h.name} (${h.city}): ${total} total units`;
      }).join('\n');

      return {
        text: `Blood bank inventory${city ? ` in ${city}` : ''}:\n\n${list}\n\nAsk about a specific blood group for details.`,
        suggestions: ['O+ stock', 'A+ stock', 'Find donors'],
      };
    }

    case 'request_help':
      return {
        text: "I understand this is urgent. Blood requests can only be posted by verified hospital staff. If you are a registered staff member, please use the Emergency Request form on the dashboard.\n\nYou'll need:\n1. Patient name\n2. Blood group needed\n3. Number of units\n4. Hospital name\n5. Urgency level\n\nOur AI will instantly match you with the best available donors nearby.\n\nNote: NL quick-post parsing is planned as a future feature for verified staff only.\n\nFor immediate assistance, call Alkhidmat Helpline: 111-254-547",
        suggestions: ['Go to request form', 'Find donors now', 'Check inventory'],
      };

    case 'blood_info': {
      if (bloodGroup && BLOOD_COMPATIBILITY[bloodGroup]) {
        const info = BLOOD_COMPATIBILITY[bloodGroup];
        return {
          text: `Blood Group ${bloodGroup}:\n\nCan donate to: ${info.canDonateTo}\nCan receive from: ${info.canReceiveFrom}`,
          suggestions: ['Find donors', 'Check another blood type', 'Eligibility info'],
        };
      }
      const bgList = Object.entries(BLOOD_COMPATIBILITY).map(([bg, info]) => `${bg}: Donates to ${info.canDonateTo}`).join('\n');
      return {
        text: `Blood compatibility info:\n\n${bgList}\n\nAsk about a specific blood group for more details.`,
        suggestions: ['O+ info', 'A+ info', 'B+ info', 'O- info'],
      };
    }

    case 'eligibility':
      return {
        text: "Blood Donation Eligibility (Pakistan Blood Transfusion Authority guidelines):\n\n1. Age: 18-65 years\n2. Weight: Minimum 50 kg\n3. Hemoglobin: Minimum 12.5 g/dL\n4. Resting gap: At least 90 days between donations (120 days for women)\n5. Health: No fever, cold, or infection\n6. Not eligible if: pregnant, breastfeeding, recent surgery\n\nBloodBridge AI automatically excludes donors still inside their resting window from every match.",
        suggestions: ['Find donation centers', 'Blood type info'],
      };

    case 'stats':
      return {
        text: `BloodBridge AI Statistics:\n\nTotal Donors: ${db.donors.data.length}\nAvailable Donors: ${db.donors.data.filter(d => d.isAvailable).length}\nHospitals & Blood Banks: ${db.hospitals.data.length}\nActive Requests: ${db.bloodRequests.data.filter(r => r.status === 'pending' || r.status === 'matched').length}\n\nOur AI has processed thousands of matches across Pakistan!`,
        suggestions: ['Find donors', 'Check inventory', 'View dashboard'],
      };

    default:
      return {
        text: "I'm not sure I understood that. Here are some things I can help with:\n\n- Find blood donors (e.g., 'Find O+ donors in Lahore')\n- Check blood bank inventory\n- Emergency blood requests\n- Blood type compatibility info\n- Donation eligibility\n\nFor emergencies, call Alkhidmat Helpline: 111-254-547",
        suggestions: ['Find a donor', 'Check inventory', 'Emergency help', 'Blood type info'],
      };
  }
}

module.exports = { processMessage };
