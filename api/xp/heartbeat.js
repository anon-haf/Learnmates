import { createServerClient } from '../lib/supabase-server.js';

// Constants for XP rules
const XP_RULES = {
  active_time: {
    amountPerMinute: 2,
    dailyCap: 40,
  },
  scrolling: {
    amountPerMinute: 15,
    dailyCap: 50,
    maxScrollSpeed: 150,
  },
  question_view: {
    amountPerView: 5,
    mcqAnswerAmount: 5,
    dailyCap: 100,
    minViewDuration: 15,
  },
  topical_paper_generation: {
    amount: 15,
    dailyCap: 30,
    maxPerSubjectPerDay: 2
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

    const { action, duration, tabVisible, mouseMoving, scrollSpeed, reachedBottom, sawQuestion, sawMS, refId, streak, mcqAnswer, subject } = req.body;
    
    let xpAmount = 0;
    let dailyCap = 0;
    let conditionsMet = false;
    
    if (action === 'active_time') {
      // tabVisible is required; mouseMoving is validated by client tracking
      conditionsMet = tabVisible && (mouseMoving || duration >= 30);
      if (conditionsMet && duration >= 30) {
        // 1 XP per 30s (2 XP per 60s)
        xpAmount = Math.floor(duration / 30);
      }
      dailyCap = XP_RULES.active_time.dailyCap;
    } 
    else if (action === 'scrolling') {
      conditionsMet = scrollSpeed > 0 && scrollSpeed < XP_RULES.scrolling.maxScrollSpeed && reachedBottom;
      if (conditionsMet && duration >= 5) {
        xpAmount = Math.max(15, Math.floor(duration / 60) * XP_RULES.scrolling.amountPerMinute);
      }
      dailyCap = XP_RULES.scrolling.dailyCap;
    }
    else if (action === 'question_view') {
      conditionsMet = sawQuestion && sawMS && duration >= XP_RULES.question_view.minViewDuration;
      if (conditionsMet) {
        xpAmount = mcqAnswer ? XP_RULES.question_view.mcqAnswerAmount : XP_RULES.question_view.amountPerView;
      }
      dailyCap = XP_RULES.question_view.dailyCap;
    } 
    else if (action === 'topical_paper_generation') {
      conditionsMet = true; // Generation is already validated on client
      xpAmount = XP_RULES.topical_paper_generation.amount;
      dailyCap = XP_RULES.topical_paper_generation.dailyCap;
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
        conditionsMet: { action, duration, tabVisible, mouseMoving, scrollSpeed, reachedBottom, sawQuestion, sawMS }
      });
    }

    // Call RPC to award XP
    const { data: awarded, error: rpcError } = await supabase.rpc('fn_award_capped_xp', {
      p_user_id: user.id,
      p_action: action,
      p_ref_id: refId || null,
      p_amount: xpAmount,
      p_daily_cap: dailyCap,
      p_metadata: {
        duration,
        tabVisible,
        mouseMoving,
        scrollSpeed,
        reachedBottom,
        sawQuestion,
        sawMS,
        streak,
        mcqAnswer,
        subject
      }
    });

    if (rpcError) {
      throw rpcError;
    }

    return res.status(200).json({
      awarded: awarded || 0,
      message: `Successfully processed ${action}`,
      conditionsMet: { action, duration }
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
