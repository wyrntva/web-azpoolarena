import { redirect } from 'next/navigation';

// Server-side redirect - nhanh hơn nhiều so với client-side
export default function Home() {
  redirect('/tournaments');
}
