import { describe, expect, it } from 'vitest';
import { smsUrl, whatsappUrl } from './share.ts';

const message = "Hi Nana, it's Asha! Give here: https://example.com/give?promoter=p1&x=2";

describe('share links', () => {
  it('fills in a WhatsApp message', () => {
    const url = new URL(whatsappUrl(message));
    expect(url.host).toBe('wa.me');
    expect(url.searchParams.get('text')).toBe(message);
  });

  it('fills in a text message', () => {
    const url = smsUrl(message);
    expect(url.startsWith('sms:?&body=')).toBe(true);
    expect(decodeURIComponent(url.slice('sms:?&body='.length))).toBe(message);
  });
});
