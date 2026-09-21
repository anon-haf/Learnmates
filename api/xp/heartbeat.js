import { createServerClient } from '../lib/supabase-server.js';
import { awardCappedXP } from '../lib/award-xp.js';

// Constants for XP rules
const XP_RULES = {
  active_time: {
    amountPerTenMinutes: 25,
    dailyCap: 100,
  },
  question_view: {
    amountPerView: 5,
    dailyCap: 100,
    minViewDuration: 25,
  },
  streak_visit: {
    baseAmount: 10,
    dailyCap: 100
  }
};

function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

export default async function handler(req, res) {
  applyCors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServerClient();
    
    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action, duration, tabVisible, mouseMoving, sawQuestion, sawMS, refId, streak, subject } = req.body;
    
    let xpAmount = 0;
    let dailyCap = 0;
    let conditionsMet = false;
    
    if (action === 'active_time') {
      conditionsMet = tabVisible && (mouseMoving || duration >= 600);
      if (conditionsMet && duration >= 600) {
        // 25 XP per 10 minutes
        xpAmount = Math.floor(duration / 600) * XP_RULES.active_time.amountPerTenMinutes;
      }
      dailyCap = XP_RULES.active_time.dailyCap;
    } 
    else if (action === 'question_view') {
      conditionsMet = sawQuestion && sawMS && duration >= XP_RULES.question_view.minViewDuration;
      if (conditionsMet) {
        xpAmount = XP_RULES.question_view.amountPerView;
      }
      dailyCap = XP_RULES.question_view.dailyCap;
    } 
    else if (action === 'streak_visit') {
      conditionsMet = Boolean(streak && streak > 0);
      if (conditionsMet) {
        xpAmount = streak * XP_RULES.streak_visit.baseAmount;
      }
      dailyCap = XP_RULES.streak_visit.dailyCap;
    }
    else {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    if (!conditionsMet || xpAmount <= 0) {
      return res.status(200).json({ 
        awarded: 0, 
        message: 'Conditions not met or insufficient duration',
        conditionsMet: { action, duration, tabVisible, mouseMoving, sawQuestion, sawMS }
      });
    }

    const awarded = await awardCappedXP(supabase, {
      userId: user.id,
      action,
      refId: refId || null,
      amount: xpAmount,
      dailyCap,
      metadata: {
        duration,
        tabVisible,
        mouseMoving,
        sawQuestion,
        sawMS,
        streak,
        subject,
      },
    });

    return res.status(200).json({
      awarded,
      message: `Successfully processed ${action}`,
      conditionsMet: { action, duration }
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
