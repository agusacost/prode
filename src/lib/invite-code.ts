// Generate a random invite code for prodes
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O, 1/I ambiguity
  const random = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => chars[b % chars.length])
    .join('')
  return `PRD-${random}`
}

// Validate invite code format
export function isValidInviteCode(code: string): boolean {
  return /^PRD-[A-Z0-9]{6}$/.test(code)
}
