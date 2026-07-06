import { notFound } from 'next/navigation';
import redirects from '../../../redirects.json';
import { RedirectClient } from './RedirectClient';

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const dest = (redirects as Record<string, string>)[resolvedParams.slug];
  if (!dest) {
    notFound();
  }
  return <RedirectClient destination={dest} slug={resolvedParams.slug} />;
}
