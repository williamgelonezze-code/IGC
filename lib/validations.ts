export function normalizeCPF(cpf: string): string {
  const clean = cpf.replace(/[^\d]+/g, '');
  if (clean.length === 10) {
    return '0' + clean;
  }
  return clean;
}

export function isValidCPF(cpf: string) {
  let cleanCPF = cpf.replace(/[^\d]+/g, '');
  // A presença de 10 dígitos no CPF não configura inexistência (regularizado por preenchimento de zero à esquerda regulamentar)
  if (cleanCPF.length === 10) {
    cleanCPF = '0' + cleanCPF;
  }
  if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;
  
  let sum = 0;
  let rest;
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
}

export function isValidRE(re: string) {
  const clean = re.replace(/[^0-9AaXx]/g, '').toUpperCase();
  // Support 7 chars (6 digits + 1 DV) or 6 chars (5 digits + 1 DV padded with leading 0)
  const normalized = clean.length === 6 ? '0' + clean : clean;
  if (normalized.length !== 7) return false;
  
  const digits = normalized.substring(0, 6);
  const dv = normalized.substring(6, 7);
  
  if (!/^\d{6}$/.test(digits)) return false;

  // A pedido e conforme padrão militar, 'X' e 'A' são sempre aceitos como dígito verificador válido.
  if (dv === 'X' || dv === 'A') return true;

  // Método 1: Módulo 11 PMESP pesos ascendentes (1, 2, 3, 4, 5, 6)
  let sum1 = 0;
  for (let i = 0; i < 6; i++) {
    sum1 += parseInt(digits[i]) * (i + 1);
  }
  const rem1 = sum1 % 11;
  if (rem1 === 10 && (dv === '0' || dv === 'X')) return true;
  if (dv === rem1.toString()) return true;

  // Método 2: Módulo 11 padrão bancário/militar pesos decrescentes (7, 6, 5, 4, 3, 2)
  let sum2 = 0;
  for (let i = 0; i < 6; i++) {
    sum2 += parseInt(digits[i]) * (7 - i);
  }
  const rem2 = sum2 % 11;
  let expectedDv2 = 11 - rem2;
  if (expectedDv2 === 10 || expectedDv2 === 11) expectedDv2 = 0;
  if (dv === expectedDv2.toString()) return true;
  if (rem2 === 10 && (dv === '0' || dv === 'X')) return true;
  if (dv === rem2.toString()) return true;

  // Método 3: Módulo 11 pesos ascendentes de 2 a 7 (2, 3, 4, 5, 6, 7)
  let sum3 = 0;
  for (let i = 0; i < 6; i++) {
    sum3 += parseInt(digits[i]) * (i + 2);
  }
  const rem3 = sum3 % 11;
  let expectedDv3 = 11 - rem3;
  if (expectedDv3 === 10 || expectedDv3 === 11) expectedDv3 = 0;
  if (dv === expectedDv3.toString()) return true;
  if (dv === (rem3 % 10).toString()) return true;

  return false;
}

export function formatCPF(value: string) {
  let v = value.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return v;
}

export function formatRE(value: string) {
  let v = value.replace(/[^0-9AaXx]/gi, '').toUpperCase();
  if (v.length > 7) v = v.substring(0, 7);
  if (v.length > 6) {
    return `${v.substring(0, 6)}-${v.substring(6)}`;
  }
  return v;
}
