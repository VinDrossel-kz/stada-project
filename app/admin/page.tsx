import { redirect } from 'next/navigation';
import { SITE_BACKEND } from '@/lib/site-backend';
export const dynamic = 'force-dynamic';
export default function Admin() {
  redirect(SITE_BACKEND + '/admin');
}
