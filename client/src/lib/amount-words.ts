export function amountToWords(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '';

  const absNum = Math.abs(num);
  const sign = num < 0 ? 'Minus ' : '';

  if (absNum >= 10000000) {
    const crores = absNum / 10000000;
    const formatted = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}₹${formatted} Crore${crores >= 2 ? 's' : ''}`;
  }
  if (absNum >= 100000) {
    const lakhs = absNum / 100000;
    const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}₹${formatted} Lakh${lakhs >= 2 ? 's' : ''}`;
  }
  if (absNum >= 1000) {
    const thousands = absNum / 1000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1).replace(/\.?0+$/, '');
    return `${sign}₹${formatted} Thousand`;
  }
  return `${sign}₹${absNum.toLocaleString('en-IN')}`;
}
