export function numberToWords(num) {
  const a = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ];
  const b = [
    '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
  ];

  if (num === 0) return 'zero';

  function inWords(n) {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str.trim();
  }

  const numStr = num.toString();
  const [integerPart, decimalPart] = numStr.split('.');
  
  let words = inWords(Number(integerPart));

  if (decimalPart) {
    words += ' and ' + inWords(Number(decimalPart.substring(0, 2))) + ' paise';
  }
  
  return words.replace(/\s+/g, ' ').trim().split(' ').map((word, i) => i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(' ');
}