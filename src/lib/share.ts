/** Opens WhatsApp with the message ready to send; the sender picks who gets it. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Opens the phone's text-message app with the message filled in. */
export function smsUrl(message: string): string {
  return `sms:?&body=${encodeURIComponent(message)}`;
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}
