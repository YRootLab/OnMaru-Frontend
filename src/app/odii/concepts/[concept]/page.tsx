import { notFound } from 'next/navigation';
import { OdiiAudioFeature } from '@/features/odii-audio/components/OdiiAudioFeature';
import { isOdiiConcept, ODII_CONCEPTS } from '@/features/odii-audio/concepts/odiiConcept';

export function generateStaticParams() {
  return ODII_CONCEPTS.map((concept) => ({ concept }));
}

export default async function OdiiConceptPage({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  if (!isOdiiConcept(concept)) notFound();
  return <OdiiAudioFeature conceptVariant={concept} />;
}
