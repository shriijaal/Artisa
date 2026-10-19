const COMMON_PASSWORDS = new Set([
  '123456', '123456789', '12345678', '1234567890', 'password', 'password1',
  'password123', 'qwerty', 'qwerty123', 'qwertyuiop', 'abc123', 'abcd1234',
  'iloveyou', 'admin', 'admin123', 'welcome', 'welcome1', 'welcome123',
  'monkey', 'dragon', 'sunshine', 'princess', 'football', 'baseball',
  'letmein', 'master', 'hello', 'freedom', 'whatever', 'trustno1',
  'starwars', 'hello123', 'donald', 'batman', 'superman', 'passw0rd',
  'p@ssword', 'p@ssw0rd', 'pass@word1', 'zaq12wsx', '1q2w3e4r', '1qaz2wsx',
  'qazwsx', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm', 'poiuytrewq',
  '111111', '000000', '121212', '654321', '666666', '888888', '987654321',
  '112233', '123123', '123321', '12344321', '11111111', '00000000',
  'aa123456', 'a123456', 'a1234567', '123qwe', 'qwe123', 'qweasd',
  'abc12345', 'abcd123', 'test123', 'test1234', 'guest', 'root',
  'login', 'pass', 'changeme', 'secret', 'summer2024', 'summer2025',
  'winter2024', 'winter2025', 'spring2024', 'autumn2024', 'january',
  'february', 'march', 'april', 'june', 'july', 'august',
  'september', 'october', 'november', 'december', 'monday', 'friday',
  'sunday', 'tuesday', 'thursday', 'saturday', 'iloveu', 'love',
  'lovely', 'forever', 'angel', 'killer', 'shadow', 'michael',
  'jordan', 'harley', 'ranger', 'hockey', 'soccer', 'cricket',
  'nepal', 'nepal123', 'kathmandu', 'artisa', 'artisa123', 'artist',
  'artist123', 'gallery', 'canvas', 'painting', 'creator',
  'store', 'market', 'business', 'company', 'system', 'oracle',
  'computer', 'internet', 'server', 'access', 'flower', 'butterfly',
  'chocolate', 'cookie', 'pepper',
]);

const KEYBOARD_ROWS = [
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  '1234567890',
  'qwertzuiop',
  'azertyuiop',
];

const LEVELS = [
  { label: 'Too weak', color: 'bg-red-500', text: 'text-red-600' },
  { label: 'Too weak', color: 'bg-red-500', text: 'text-red-600' },
  { label: 'Weak', color: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Fair', color: 'bg-blue-500', text: 'text-blue-600' },
  { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
];

const hasSequence = (password) => {
  const lower = password.toLowerCase();
  let run = 1;
  for (let i = 1; i < lower.length; i++) {
    const delta = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    if (delta === 1 || delta === -1) {
      run += 1;
      if (run >= 4) return true;
    } else {
      run = 1;
    }
  }
  return false;
};

const hasKeyboardRun = (password) => {
  const lower = password.toLowerCase();
  for (const row of KEYBOARD_ROWS) {
    const reversed = [...row].reverse().join('');
    for (const source of [row, reversed]) {
      for (let i = 0; i + 4 <= source.length; i++) {
        if (lower.includes(source.slice(i, i + 4))) return true;
      }
    }
  }
  if (lower.includes('qaz') || lower.includes('wsx') || lower.includes('edc')) return true;
  return false;
};

const hasRepeat = (password) => {
  return /(.)\1{2,}/.test(password) || /(..)\1{1,}/.test(password);
};

const hasYear = (password) => /(19|20)\d{2}/.test(password);

const hasDateLike = (password) =>
  password.replace(/\D/g, '').length >= 6 && /\d{6,}/.test(password);

const normalizeForBlocklist = (password) =>
  password
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/0/g, 'o')
    .replace(/[1!|]/g, 'l')
    .replace(/3/g, 'e')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/[^a-z0-9]/g, '');

const isCommonPassword = (password) => {
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return true;
  const normalized = normalizeForBlocklist(password);
  if (normalized && COMMON_PASSWORDS.has(normalized)) return true;
  if (normalized && COMMON_PASSWORDS.has(normalized.replace(/o/g, '0'))) return true;
  return false;
};

const lengthScore = (length) => {
  if (length < 8) return 0;
  if (length < 12) return 1;
  if (length < 15) return 2;
  if (length < 20) return 3;
  return 4;
};

const detectWeakPattern = (password) => {
  if (isCommonPassword(password)) {
    return { cap: 0, feedback: 'This is a commonly used password.' };
  }
  if (hasSequence(password)) {
    return { cap: 1, feedback: 'Avoid sequences like 1234 or abcd.' };
  }
  if (hasKeyboardRun(password)) {
    return { cap: 1, feedback: 'Avoid keyboard runs like qwerty.' };
  }
  if (hasRepeat(password) && password.length < 14) {
    return { cap: 2, feedback: 'Avoid repeating characters or blocks.' };
  }
  if (hasYear(password)) {
    return { cap: 2, feedback: 'Avoid years — they are easy to guess.' };
  }
  if (hasDateLike(password)) {
    return { cap: 2, feedback: 'Avoid long digit runs that look like dates.' };
  }
  return null;
};

export const getPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      label: '',
      color: '',
      text: '',
      feedback: '',
      segments: [false, false, false, false],
    };
  }

  let score = lengthScore(password.length);
  const weak = detectWeakPattern(password);
  let feedback = weak ? weak.feedback : '';

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  const unique = new Set(password).size;

  if (!weak) {
    // Optional upgrades when no weak pattern is present (NIST + variety)
    if (password.length >= 15 && classes >= 3) score = Math.max(score, 3);
    if (password.length >= 16 && classes >= 3 && unique >= 8) score = 4;
    if (password.length >= 20 && unique >= 10) score = 4;
    if (password.length >= 12 && classes === 4 && unique >= 8) score = 4;
    if (password.length < 8) score = Math.min(score, 1);
    if (password.length < 6) score = 1;

    if (password.length < 8) {
      feedback = 'Use at least 8 characters.';
    } else if (score >= 4) {
      feedback = 'Looks good.';
    } else if (classes <= 1) {
      feedback =
        password.length >= 16
          ? 'Long, but one character type. Mix in digits or symbols.'
          : 'Add another word or two — uncommon words are better.';
    } else if (score < 3) {
      feedback =
        classes < 3
          ? 'Add a mix of letters, numbers, and symbols.'
          : 'A bit longer would help.';
    } else {
      feedback = 'Looks good.';
    }
  } else if (password.length < 8) {
    score = Math.min(score, 1);
    if (!feedback) feedback = 'Use at least 8 characters.';
  }

  if (password.length < 6) score = 1;
  if (weak) score = Math.min(score, weak.cap);

  score = Math.max(0, Math.min(4, score));
  const level = LEVELS[score];

  return {
    score,
    label: level.label,
    color: level.color,
    text: level.text,
    feedback,
    segments: [0, 1, 2, 3].map((i) => i < score),
  };
};

export const generateStrongPassword = (length = 14) => {
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%^&*';
  const all = lowers + uppers + digits + symbols;
  const required = [
    lowers[Math.floor(Math.random() * lowers.length)],
    uppers[Math.floor(Math.random() * uppers.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  while (required.length < length) {
    required.push(all[Math.floor(Math.random() * all.length)]);
  }
  for (let i = required.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [required[i], required[j]] = [required[j], required[i]];
  }
  return required.join('');
};
