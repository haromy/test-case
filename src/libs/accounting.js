// Round to 2 decimal places
const roundTo2Decimal = (number) => {
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate EMI (Equated Monthly Installment) for reducing balance
 * @param {number} principal - Principal amount
 * @param {number} annualRate - Annual interest rate (in percentage)
 * @param {number} tenorMonths - Loan tenure in months
 * @returns {number} - Monthly EMI amount
 */
const calculateEMI = (principal, annualRate, tenorMonths) => {
  const monthlyRate = (annualRate / 100) / 12;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenorMonths) / (Math.pow(1 + monthlyRate, tenorMonths) - 1);
  return roundTo2Decimal(emi);
}

/**
 * Calculate reducing balance schedule
 * @param {number} principal - Principal amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} tenorMonths - Loan tenure in months
 * @returns {{principal: number[], interest: number[]}} - Arrays of principal and interest amounts
 */
const calculateReducingSchedule = (principal, annualRate, tenorMonths) => {
  const monthlyRate = (annualRate / 100) / 12;
  const emi = calculateEMI(principal, annualRate, tenorMonths);
  
  let remainingPrincipal = principal;
  const principalAmounts = [];
  const interestAmounts = [];

  for (let i = 0; i < tenorMonths; i++) {
    const interestAmount = roundTo2Decimal(remainingPrincipal * monthlyRate);
    let principalAmount = roundTo2Decimal(emi - interestAmount);

    // Adjust last payment to handle any rounding differences
    if (i === tenorMonths - 1) {
      principalAmount = roundTo2Decimal(remainingPrincipal);
    }

    principalAmounts.push(principalAmount);
    interestAmounts.push(interestAmount);
    remainingPrincipal = roundTo2Decimal(remainingPrincipal - principalAmount);
  }

  return {
    principal: principalAmounts,
    interest: interestAmounts,
    emi
  };
}

/**
 * Distribute amount into n parts ensuring sum equals total
 * @param {number} total - Total amount to distribute
 * @param {number} parts - Number of parts to distribute into
 * @param {string} strategy - Distribution strategy ('FLAT-FIRST', 'FLAT-LAST', or 'REDUCING')
 * @param {Object} [options] - Additional options for REDUCING calculation
 * @param {number} options.annualRate - Annual interest rate (required for REDUCING)
 * @returns {{principal: number[], interest: number[], emi?: number}} Arrays of distributed amounts
 */
const distributeAmount = (total, parts, strategy = 'FLAT-LAST', options = {}) => {
  if (strategy === 'REDUCING') {
    if (!options.annualRate) {
      throw new Error('Annual rate is required for REDUCING strategy');
    }
    return calculateReducingSchedule(total, options.annualRate, parts);
  }

  // For FLAT distribution
  const baseAmount = roundTo2Decimal(total / parts);
  const amounts = new Array(parts).fill(baseAmount);

  // Calculate the difference due to rounding
  const actualTotal = roundTo2Decimal(baseAmount * parts);
  let difference = roundTo2Decimal(total - actualTotal);

  // If there's any difference, adjust based on strategy
  if (difference !== 0) {
    switch (strategy) {
      case 'FLAT-FIRST':
        amounts[0] = roundTo2Decimal(amounts[0] + difference);
        break;
      case 'FLAT-LAST':
      default:
        amounts[amounts.length - 1] = roundTo2Decimal(amounts[amounts.length - 1] + difference);
        break;
    }
  }

  return {
    principal: amounts,
    interest: amounts.map(() => 0), // For flat rate, interest is distributed separately
  };
}

module.exports = {
  roundTo2Decimal,
  distributeAmount,
  calculateEMI
};