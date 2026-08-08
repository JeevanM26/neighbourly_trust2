/* ---------------------------------------------------------
   Telegram Bot Dynamic Passcode / OTP Generator for Owners
   Neighborly Trust — Security & 2FA Engine
--------------------------------------------------------- */

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

const FALLBACK_BOT_TOKEN = '8830072583:AAEYhpGNTgD9AMR5hd5RC0eX3QlBi3is73c';

const DEFAULT_CONFIG: TelegramConfig = {
  botToken: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ? process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN : FALLBACK_BOT_TOKEN,
  chatId: '7258080421',
};

// Generate a random 4-digit numeric OTP
export function generateDynamicPasscode(length: number = 4): string {
  let passcode = '';
  for (let i = 0; i < length; i++) {
    passcode += Math.floor(Math.random() * 10).toString();
  }
  return passcode;
}

export function getTelegramConfig(): TelegramConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const savedToken = localStorage.getItem('nt_telegram_bot_token');
    const savedChatId = localStorage.getItem('nt_telegram_chat_id');
    const envToken = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '' : '';
    const activeToken = savedToken !== null && savedToken !== '' ? savedToken : (envToken || FALLBACK_BOT_TOKEN);
    return {
      botToken: activeToken,
      chatId: savedChatId !== null && savedChatId !== '' ? savedChatId : DEFAULT_CONFIG.chatId,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveTelegramConfig(config: TelegramConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('nt_telegram_bot_token', config.botToken);
    localStorage.setItem('nt_telegram_chat_id', config.chatId);
  } catch (e) {
    console.error('Failed to save Telegram config', e);
  }
}

export function getOwnerChatIds(): Record<string, string> {
  if (typeof window === 'undefined') return { '7975182162': '7258080421' };
  try {
    const saved = localStorage.getItem('nt_owner_chat_ids');
    return saved ? JSON.parse(saved) : { '7975182162': '7258080421' };
  } catch {
    return { '7975182162': '7258080421' };
  }
}

export function saveOwnerChatId(phone: string, chatId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const map = getOwnerChatIds();
    map[cleanPhone] = chatId.trim();
    localStorage.setItem('nt_owner_chat_ids', JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save owner chat ID map', e);
  }
}

export async function sendTelegramOtp(
  phone: string,
  passcode: string,
  customConfig?: TelegramConfig
): Promise<{ success: boolean; message: string }> {
  const config = customConfig || getTelegramConfig();
  const cleanPhone = phone.replace(/\D/g, "");
  const ownerChatIdsMap = getOwnerChatIds();

  let targetChatId = customConfig?.chatId || ownerChatIdsMap[cleanPhone] || config.chatId || '7258080421';
  let botToken = config.botToken || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '' : '') || FALLBACK_BOT_TOKEN;

  if (!targetChatId && botToken) {
    try {
      const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
      const updatesData = await updatesRes.json();
      if (updatesData.ok && updatesData.result?.length > 0) {
        const lastMsg = updatesData.result[updatesData.result.length - 1]?.message;
        if (lastMsg?.chat?.id) {
          targetChatId = lastMsg.chat.id.toString();
          saveOwnerChatId(cleanPhone, targetChatId);
        }
      }
    } catch {
      // Auto-fetch fallback
    }
  }

  if (!botToken || !targetChatId) {
    return {
      success: false,
      message: 'Telegram Bot Token or Chat ID not set.',
    };
  }

  const text = `🔐 *Neighborly Trust — Owner Login OTP*\n\n📱 Owner Mobile: \`+91 ${phone}\`\n💬 Your 4-digit OTP is: *${passcode}*\n\n⏰ Valid for 5 minutes. Do not share this OTP with anyone.`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true, message: 'Passcode sent to Telegram!' };
    } else {
      return {
        success: false,
        message: data.description || 'Failed to send Telegram message.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error connecting to Telegram Bot API.',
    };
  }
}
