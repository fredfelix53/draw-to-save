/* ===== Draw to Save — Full Progression System ===== */
(function() {
  'use strict';

  const SAVE_KEY = 'dts_progress';
  const DAILY_KEY = 'dts_daily_bonus';

  const UPGRADE_TIERS = {
    weapon: {
      name: 'Pencil',
      icon: '✏️',
      maxLevel: 5,
      levels: [
        { level: 0, name: 'Basic Pencil',    bonus: { lineStrength: 1, lineWidth: 3 },  gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'HB Pencil',       bonus: { lineStrength: 2, lineWidth: 4 },  gemReq: 50,  coinsReq: 1000 },
        { level: 2, name: 'Mechanical Pencil', bonus: { lineStrength: 3, lineWidth: 5 }, gemReq: 80,  coinsReq: 2000 },
        { level: 3, name: 'Marker Pen',      bonus: { lineStrength: 5, lineWidth: 6 },  gemReq: 120, coinsReq: 4000 },
        { level: 4, name: 'Paint Brush',     bonus: { lineStrength: 8, lineWidth: 8 },  gemReq: 200, coinsReq: 8000 },
        { level: 5, name: '✨ Magic Wand',   bonus: { lineStrength: 12, lineWidth: 10 }, gemReq: 500, coinsReq: 20000 },
      ]
    },
    case: {
      name: 'Eraser',
      icon: '🧽',
      maxLevel: 5,
      levels: [
        { level: 0, name: 'Tiny Eraser',   bonus: { inkBonus: 0 },      gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Small Eraser',  bonus: { inkBonus: 1 },      gemReq: 40,  coinsReq: 800 },
        { level: 2, name: 'Block Eraser',  bonus: { inkBonus: 2 },      gemReq: 70,  coinsReq: 1600 },
        { level: 3, name: 'Electric Eraser', bonus: { inkBonus: 3 },   gemReq: 100, coinsReq: 3200 },
        { level: 4, name: 'Mega Eraser',   bonus: { inkBonus: 5 },      gemReq: 180, coinsReq: 6400 },
        { level: 5, name: '💎 Ultimate Eraser', bonus: { inkBonus: 8 }, gemReq: 400, coinsReq: 16000 },
      ]
    },
    outfit: {
      name: 'Shield',
      icon: '🛡️',
      maxLevel: 5,
      levels: [
        { level: 0, name: 'Paper Shield',      bonus: { hpBonus: 0 },      gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Wood Shield',       bonus: { hpBonus: 1 },      gemReq: 30,  coinsReq: 600 },
        { level: 2, name: 'Iron Shield',       bonus: { hpBonus: 1 },      gemReq: 60,  coinsReq: 1200 },
        { level: 3, name: 'Steel Shield',      bonus: { hpBonus: 2 },      gemReq: 90,  coinsReq: 2400 },
        { level: 4, name: 'Crystal Shield',    bonus: { hpBonus: 2 },      gemReq: 150, coinsReq: 4800 },
        { level: 5, name: '🔥 Aegis Barrier',  bonus: { hpBonus: 3 },      gemReq: 350, coinsReq: 12000 },
      ]
    }
  };

  const PREMIUM_ITEMS = {
    legendarySkins: [
      { id: 'lg_neon',       name: 'Neon Drawer',   desc: 'Neon green drawing style',        price: 4.99,  gemPrice: 0, tier: 'legendary', type: 'weapon_skin' },
      { id: 'lg_rainbow',    name: 'Rainbow Trail', desc: 'Rainbow-colored lines',            price: 6.99,  gemPrice: 0, tier: 'legendary', type: 'weapon_skin' },
    ],
    premiumCases: [
      { id: 'pc_royal',     name: 'Royal Pass',    desc: '7 days: 2x coins + 50 gems/day',    price: 4.99,  gemPrice: 0, type: 'subscription', duration: '7d' },
    ],
    bundles: [
      { id: 'bundle_starter', name: 'Starter Bundle', desc: '200 gems + 3 lives + exclusive skin', price: 2.99,  gemPrice: 0, type: 'one_time' },
      { id: 'bundle_mega',    name: 'Mega Pack',     desc: '500 gems + 10 lives + neon theme',     price: 7.99,  gemPrice: 0, type: 'one_time' },
    ],
    removeAds: { id: 'remove_ads', name: 'Remove Ads', desc: 'Permanently remove all ads', price: 2.99, gemPrice: 0, type: 'one_time' },
  };

  const GEM_PACKS = [
    { id: 'gems_small',  name: 'Small Gem Pack',   gems: 100,  price: 0.99,  bonus: 0,    popular: false },
    { id: 'gems_medium', name: 'Standard Gem Pack', gems: 500,  price: 3.99,  bonus: 50,   popular: true  },
    { id: 'gems_large',  name: 'Large Gem Pack',   gems: 1200, price: 7.99,  bonus: 200,  popular: false },
    { id: 'gems_mega',   name: 'Mega Gem Pack',    gems: 4000, price: 19.99, bonus: 1000, popular: false },
  ];

  const CATALOG = {
    themes: [
      { id: 'default',   name: 'Classic Dark',   price: 0,    desc: 'Original dark theme',         colors: { bg: '#0f1020', accent: '#1a1a2e' } },
      { id: 'paper',     name: 'Sketch Paper',   price: 500,  desc: 'Light notebook style',        colors: { bg: '#f0ead6', accent: '#d4c9a8' } },
      { id: 'ocean',     name: 'Ocean Blue',     price: 800,  desc: 'Calming ocean blues',         colors: { bg: '#023047', accent: '#0a4a6e' } },
      { id: 'sunset',    name: 'Sunset Glow',    price: 1000, desc: 'Warm sunset orange & pink',  colors: { bg: '#2d1b3d', accent: '#4a1a3a' } },
      { id: 'forest',    name: 'Forest Green',   price: 1500, desc: 'Lush forest greens',         colors: { bg: '#1a3a2a', accent: '#2a4a3a' } },
      { id: 'neon',      name: 'Neon Nights',    price: 2000, desc: 'Bright neon on dark purple', colors: { bg: '#1a0030', accent: '#2a0050' } },
    ],
    stickmanSkins: [
      { id: 'classic',    name: 'Classic Stickman', price: 0,    desc: 'Original stick figure',   color: '#ffffff' },
      { id: 'warrior',    name: 'Warrior',          price: 600,  desc: 'Armored stickman',         color: '#ff6b6b' },
      { id: 'ninja',      name: 'Ninja',            price: 1200, desc: 'Sneaky ninja outfit',     color: '#2d3436' },
      { id: 'knight',     name: 'Knight',           price: 2000, desc: 'Knight in shining armor', color: '#dfe6e9' },
      { id: 'cyber',      name: 'Cyberpunk',        price: 3500, desc: 'Neon cyber warrior',      color: '#00ffff' },
    ],
    drawingStyles: [
      { id: 'solid',      name: 'Solid Line',       price: 0,    desc: 'Standard solid line' },
      { id: 'glow',       name: 'Glow Line',        price: 800,  desc: 'Line with glow effect' },
      { id: 'dashed',     name: 'Dashed Line',      price: 1200, desc: 'Dashed drawing style' },
      { id: 'glitter',    name: 'Glitter Trail',    price: 2500, desc: 'Sparkling glitter line' },
    ],
    powerupPacks: [
      { id: 'lives',      name: 'Extra Lives',      price: 300,  items: { lives: 5 },             desc: '5 extra lives' },
      { id: 'slow',       name: 'Slow Motion',      price: 400,  items: { slowMo: 3 },           desc: '3 slow-motion power-ups' },
      { id: 'mega',       name: 'Mega Bundle',      price: 1000, items: { lives: 10, slowMo: 5 }, desc: '10 lives + 5 slow-mo' },
    ],
  };

  const ACHIEVEMENTS = [
    { id: 'first_win',      name: 'First Save',       desc: 'Save the stickman for the first time',   reward: { coins: 50, gems: 0 },  icon: '🎮', check: p => p.totalWins >= 1 },
    { id: 'win_10',         name: 'Hero',             desc: 'Win 10 levels',                          reward: { coins: 200, gems: 5 }, icon: '🦸', check: p => p.totalWins >= 10 },
    { id: 'win_50',         name: 'Legendary Savior', desc: 'Win 50 levels',                         reward: { coins: 1000, gems: 20 },icon: '🏆', check: p => p.totalWins >= 50 },
    { id: 'no_draw',        name: 'Minimalist',       desc: 'Complete a level without drawing',       reward: { coins: 300, gems: 10 },icon: '📏', check: p => p.ach_noDraw },
    { id: 'perfect',        name: 'Perfect Defense',  desc: 'Complete a level without stickman hit',   reward: { coins: 500, gems: 15 },icon: '🛡️', check: p => p.perfectLevels >= 1 },
    { id: 'perfect_10',     name: 'Perfect Hero',     desc: 'Get 10 perfect levels',                  reward: { coins: 2000, gems: 50 },icon: '💎', check: p => p.perfectLevels >= 10 },
  ];

  function defaultState() {
    return {
      coins: 200,
      gems: 0,
      totalGems: 0,
      xp: 0,
      level: 1,
      highestLevel: 1,
      totalWins: 0,
      totalPlays: 0,
      perfectLevels: 0,
      ach_noDraw: false,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedThemes: ['default'],
      ownedStickmanSkins: ['classic'],
      ownedDrawingStyles: ['solid'],
      activeTheme: 'default',
      activeSkin: 'classic',
      activeDrawing: 'solid',
      powerups: { lives: 5, slowMo: 2 },
      inventory: {},
      achievements: {},
      lastSaveDate: null,
      adFree: false,
      subscriptions: {},
      completedLevels: [],
    };
  }

  let state = null;

  function save() { state.lastSaveDate = new Date().toISOString(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { state = { ...defaultState(), ...JSON.parse(raw) }; save(); return true; }
    } catch(e) {}
    reset(); return false;
  }
  function reset() { state = defaultState(); save(); }

  function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.2, lvl - 1)); }
  function addXp(amount) {
    if (!state) return false;
    state.xp += amount;
    let leveled = false;
    while (state.xp >= xpForLevel(state.level)) { state.xp -= xpForLevel(state.level); state.level++; leveled = true; }
    save(); return leveled;
  }
  function addCoins(amount) { if (!state) return 0; state.coins += amount; save(); return state.coins; }
  function spendCoins(amount) { if (!state || state.coins < amount) return false; state.coins -= amount; save(); return true; }
  function addGems(amount) { if (!state) return 0; state.gems += amount; state.totalGems += amount; save(); return state.gems; }
  function spendGems(amount) { if (!state || state.gems < amount) return false; state.gems -= amount; save(); return true; }

  function getUpgradeCost(category, currentLevel) {
    const tier = UPGRADE_TIERS[category];
    if (!tier) return null;
    const nextLevel = currentLevel + 1;
    const levelData = tier.levels.find(l => l.level === nextLevel);
    if (!levelData) return null;
    return { coins: levelData.coinsReq, gems: levelData.gemReq };
  }

  function upgradeItem(category, useGems = false) {
    if (!state) return { success: false, reason: 'no_state' };
    const tier = UPGRADE_TIERS[category];
    if (!tier) return { success: false, reason: 'invalid_category' };
    const current = state.upgrades[category] || 0;
    if (current >= tier.maxLevel) return { success: false, reason: 'max_level' };
    const costs = getUpgradeCost(category, current);
    if (!costs) return { success: false, reason: 'no_level_data' };
    if (useGems) { if (state.gems < costs.gems) return { success: false, reason: 'not_enough_gems' }; spendGems(costs.gems); }
    else { if (state.coins < costs.coins) return { success: false, reason: 'not_enough_coins' }; spendCoins(costs.coins); }
    state.upgrades[category]++; save(); return { success: true, newLevel: state.upgrades[category] };
  }

  function getActiveBonuses() {
    if (!state) return { lineStrength: 1, lineWidth: 3, inkBonus: 0, hpBonus: 0 };
    const b = { lineStrength: 1, lineWidth: 3, inkBonus: 0, hpBonus: 0 };
    const wData = UPGRADE_TIERS.weapon.levels[state.upgrades.weapon || 0];
    if (wData) { b.lineStrength = wData.bonus.lineStrength; b.lineWidth = wData.bonus.lineWidth; }
    const cData = UPGRADE_TIERS.case.levels[state.upgrades.case || 0];
    if (cData) b.inkBonus = cData.bonus.inkBonus;
    const oData = UPGRADE_TIERS.outfit.levels[state.upgrades.outfit || 0];
    if (oData) b.hpBonus = oData.bonus.hpBonus;
    return b;
  }

  function ownsPremiumItem(itemId) { return state && state.inventory && state.inventory[itemId] === true; }
  function purchasePremiumItem(itemId) {
    if (!state) return false;
    state.inventory[itemId] = true;
    if (itemId === 'remove_ads') { state.adFree = true; if (window.AdsManager) AdsManager.onAdsRemoved(); }
    const bundleGems = { bundle_starter: 200, bundle_mega: 500 };
    if (bundleGems[itemId]) addGems(bundleGems[itemId]);
    save(); return true;
  }

  function checkAchievements() {
    if (!state) return []; const unlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (state.achievements[ach.id]) continue;
      if (ach.check(state)) { state.achievements[ach.id] = true; addCoins(ach.reward.coins); if (ach.reward.gems) addGems(ach.reward.gems); unlocked.push(ach); }
    }
    if (unlocked.length > 0) save(); return unlocked;
  }

  function claimDailyBonus() {
    if (!state) return null;
    const now = new Date(); const today = now.toDateString();
    try {
      const lastClaim = localStorage.getItem(DAILY_KEY);
      if (lastClaim === today) return null;
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      let streak = (lastClaim === yesterday.toDateString()) ? (state.dailyStreak || 0) + 1 : 1;
      state.dailyStreak = streak;
      const coins = Math.min(100 + (streak - 1) * 20, 1000);
      const gems = streak >= 7 ? 5 : streak >= 3 ? 2 : 0;
      addCoins(coins); if (gems) addGems(gems);
      localStorage.setItem(DAILY_KEY, today); save(); return { streak, coins, gems };
    } catch(e) { return null; }
  }

  function endOfGame(result) {
    if (!state) return;
    state.totalPlays++;
    if (result.won) state.totalWins++;
    if (result.won && result.level > state.highestLevel) state.highestLevel = result.level;
    if (result.won && !state.completedLevels.includes(result.level)) state.completedLevels.push(result.level);
    if (result.perfect) state.perfectLevels++;
    if (result.noDraw) state.ach_noDraw = true;
    const xpGain = (result.won ? 100 : 20) + (result.perfect ? 50 : 0);
    addXp(xpGain);
    if (result.won) addCoins(50 + Math.floor(result.level * 10));
    save();
  }

  function getState() { return state; }
  function getUpgradeTiers() { return UPGRADE_TIERS; }
  function getPremiumItems() { return PREMIUM_ITEMS; }
  function getGemPacks() { return GEM_PACKS; }
  function getCatalog() { return CATALOG; }
  function getAchievements() { return ACHIEVEMENTS; }
  function getCoinBalance() { return state ? state.coins : 0; }
  function getGemBalance() { return state ? state.gems : 0; }

  window.ProgressionSystem = {
    load, save, reset, addCoins, spendCoins, getCoinBalance, addGems, spendGems, getGemBalance,
    addXp, xpForLevel, upgradeItem, getUpgradeCost, getActiveBonuses, getUpgradeTiers, UPGRADE_TIERS,
    getPremiumItems, PREMIUM_ITEMS, getGemPacks, GEM_PACKS, ownsPremiumItem, purchasePremiumItem,
    getCatalog, CATALOG, getAchievements, ACHIEVEMENTS, checkAchievements, endOfGame,
    claimDailyBonus, getState, defaultState,
  };
})();
