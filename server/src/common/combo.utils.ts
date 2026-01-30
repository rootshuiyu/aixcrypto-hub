/**
 * 连击倍率计算工具
 * 统一管理连击（combo）和倍率（multiplier）的计算逻辑
 */

// 系统配置常量
export const COMBO_CONFIG = {
  /** 每增加一次连击，倍率增加的数值 */
  MULTIPLIER_INCREMENT: 0.1,
  
  /** 最大连击倍率 */
  MAX_MULTIPLIER: 3.0,
  
  /** 最小倍率（基础值） */
  BASE_MULTIPLIER: 1.0,
  
  /** 最大连击次数（仅用于 Round 系统，可选限制） */
  MAX_COMBO_COUNT: 20,
  
  /** 连击重置后的倍率 */
  RESET_MULTIPLIER: 1.0,
  
  /** 连击重置后的连击数 */
  RESET_COMBO: 0,
};

/**
 * 计算连击倍率
 * @param combo 当前连击次数
 * @param config 配置对象（可选，不传则使用默认）
 * @returns 计算后的倍率
 */
export function calculateComboMultiplier(
  combo: number,
  config: any = COMBO_CONFIG
): number {
  // 🔧 修复：确保从多种可能的配置来源中读取倍率参数
  const increment = config.MULTIPLIER_INCREMENT || config.multiplierIncrement || 0.1;
  const base = config.BASE_MULTIPLIER || config.baseMultiplier || 1.0;
  const maxMultiplierLimit = config.MAX_MULTIPLIER || config.maxMultiplier || 3.0;
  
  const calculatedMultiplier = base + combo * increment;
  return Math.min(calculatedMultiplier, maxMultiplierLimit);
}

/**
 * 获取胜利后的新连击状态
 * @param currentCombo 当前连击次数
 * @param currentMaxCombo 历史最高连击
 * @param config 配置对象（可选）
 * @returns 新的连击状态
 */
export function getWinComboState(
  currentCombo: number,
  currentMaxCombo: number,
  config: any = COMBO_CONFIG
): { newCombo: number; newMaxCombo: number; newMultiplier: number } {
  // 🔧 修复：确保从多种可能的配置来源中读取上限
  const maxComboLimit = config.MAX_COMBO_COUNT || config.maxComboCount || 20;
  
  const newCombo = Math.min(currentCombo + 1, maxComboLimit);
  const newMaxCombo = Math.max(currentMaxCombo, newCombo);
  const newMultiplier = calculateComboMultiplier(newCombo, config);
  
  return { newCombo, newMaxCombo, newMultiplier };
}

/**
 * 获取失败后的连击状态（重置）
 * @param config 配置对象（可选）
 * @returns 重置后的连击状态
 */
export function getLoseComboState(
  config: typeof COMBO_CONFIG = COMBO_CONFIG
): { newCombo: number; newMultiplier: number } {
  return {
    newCombo: config.RESET_COMBO,
    newMultiplier: config.RESET_MULTIPLIER,
  };
}

/**
 * 获取平局后的连击状态（保持不变）
 * @param currentCombo 当前连击次数
 * @param currentMultiplier 当前倍率
 * @returns 原始连击状态
 */
export function getDrawComboState(
  currentCombo: number,
  currentMultiplier: number
): { newCombo: number; newMultiplier: number } {
  return {
    newCombo: currentCombo,
    newMultiplier: currentMultiplier,
  };
}

/**
 * 根据结算结果获取新的连击状态
 * @param result 结算结果 'WIN' | 'LOSE' | 'DRAW' | 'REFUND'
 * @param currentCombo 当前连击次数
 * @param currentMaxCombo 历史最高连击
 * @param currentMultiplier 当前倍率
 * @param config 配置对象（可选）
 * @returns 新的连击状态
 */
export function getComboStateByResult(
  result: 'WIN' | 'LOSE' | 'DRAW' | 'REFUND' | 'BREAKEVEN',
  currentCombo: number,
  currentMaxCombo: number,
  currentMultiplier: number = 1.0,
  config: typeof COMBO_CONFIG = COMBO_CONFIG
): { newCombo: number; newMaxCombo: number; newMultiplier: number } {
  switch (result) {
    case 'WIN':
      return getWinComboState(currentCombo, currentMaxCombo, config);
    
    case 'LOSE':
      const loseState = getLoseComboState(config);
      return { ...loseState, newMaxCombo: currentMaxCombo };
    
    case 'DRAW':
    case 'REFUND':
    case 'BREAKEVEN':
      const drawState = getDrawComboState(currentCombo, currentMultiplier);
      return { ...drawState, newMaxCombo: currentMaxCombo };
    
    default:
      return { newCombo: currentCombo, newMaxCombo: currentMaxCombo, newMultiplier: currentMultiplier };
  }
}
