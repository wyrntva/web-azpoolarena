import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Home() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  
  const botKeywords = [
    'googlebot',
    'google',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'baiduspider',
    'facebookexternalhit',
    'zalo-uri-validator',
    'zalobot',
    'telegrambot',
    'twitterbot',
    'slackbot',
    'linkedinbot',
    'pinterest',
    'whatsapp',
    'viber'
  ];
  const ua = userAgent.toLowerCase();
  const isBot = botKeywords.some(keyword => ua.includes(keyword));
  
  if (isBot) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Poolarena VietNam</h1>
        <p>POOLARENA.VN - Hệ thống giải đấu hàng đầu Việt Nam.</p>
      </main>
    );
  }

  redirect('/tournaments');
}
