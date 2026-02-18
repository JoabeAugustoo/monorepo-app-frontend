export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  let masked = digits;
  if (digits.length > 2) masked = digits.slice(0, 2) + '.' + digits.slice(2);
  if (digits.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
  if (digits.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
  if (digits.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15);
  return masked;
}

export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  let masked = digits;
  if (digits.length > 3) masked = digits.slice(0, 3) + '.' + digits.slice(3);
  if (digits.length > 6) masked = masked.slice(0, 7) + '.' + masked.slice(7);
  if (digits.length > 9) masked = masked.slice(0, 11) + '-' + masked.slice(11);
  return masked;
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const masked = user.length > 2 ? user[0] + '***' + user[user.length - 1] : '***';
  return `${masked}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return '(' + digits.slice(0, 2) + ') *****-' + digits.slice(-4);
}
