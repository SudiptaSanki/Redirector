// Cloudflare Turnstile Bot Verification Helper

export async function verifyTurnstile(
  token: string | null | undefined,
  secretKey: string | undefined,
  ip?: string
): Promise<{ success: boolean; error?: string }> {
  // If no secret key is configured (e.g. initial dev or unconfigured), allow with warning
  if (!secretKey) {
    return { success: true };
  }

  // If token is missing
  if (!token) {
    return { success: false, error: 'Turnstile verification token missing' };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = (await response.json()) as { success: boolean; 'error-codes'?: string[] };
    if (!outcome.success) {
      return { 
        success: false, 
        error: outcome['error-codes']?.join(', ') || 'Bot verification failed' 
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Turnstile verification error:', err);
    return { success: false, error: 'Verification service error' };
  }
}
