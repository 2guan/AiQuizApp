import db from '@/lib/db';
import HomeClient from './HomeClient';
import { Metadata } from 'next';
import { getAssetPath } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const comp: any = db.prepare("SELECT title FROM competitions WHERE id = ?").get(id);
  return {
    title: comp ? comp.title : '知识竞赛',
  };
}

export default async function Home({ params }: Props) {
  const { id } = await params;

  // Fetch competition details
  const comp: any = db.prepare("SELECT * FROM competitions WHERE id = ?").get(id);

  if (!comp) {
    return <div>竞赛不存在</div>;
  }

  const initialBannerUrl = comp.banner ? getAssetPath(comp.banner) : getAssetPath('/images/default_banner.jpg');
  const initialSettings = {
    title: comp.title,
    subtitle: comp.subtitle || ''
  };

  return (
    <HomeClient
      initialBannerUrl={initialBannerUrl}
      initialSettings={initialSettings}
      competitionId={id}
    />
  );
}
