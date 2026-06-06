import { supabase } from '@/lib/supabase';

export const ONBOARDING_VIDEO_URL = supabase.storage
  .from('Onboarding')
  .getPublicUrl('onboarding-lite.mp4').data.publicUrl;

const VERSE_BG_FILENAMES = [
  'verse-bg.jpg',
  'verse-bg-0.jpg',
  'verse-bg-2.jpg',
  'verse-bg-3.jpg',
  'verse-bg-4.jpg',
  'verse-bg-5.jpg',
  'verse-bg-6.jpg',
  'verse-bg-7.jpg',
  'verse-bg-8.jpg',
  'verse-bg-9.jpg',
  'verse-bg-10.jpg',
  'verse-bg-11.jpg',
  'verse-bg-12.jpg',
  'verse-bg-13.jpg',
  'verse-bg-14.jpg',
  'verse-bg-15.jpg',
  'verse-bg-16.jpg',
  'verse-bg-17.jpg',
  'verse-bg-18.jpg',
  'verse-bg-19.jpg',
  'verse-bg-20.jpg',
  'verse-bg-21.jpg',
  'verse-bg-22.jpg',
  'verse-bg-23.jpg',
  'verse-bg-24.jpg',
  'verse-bg-25.jpg',
];

export const VERSE_BACKGROUND_URLS: string[] = VERSE_BG_FILENAMES.map(
  (name) => supabase.storage.from('verse-backgrounds').getPublicUrl(name).data.publicUrl,
);

export function getWorldLotusImageUrl(filename: string | undefined | null): string | null {
  if (!filename) return null;
  return supabase.storage.from('world-lotus-images').getPublicUrl(filename).data.publicUrl;
}

const FESTIVAL_IMAGE_MAP: Record<string, string> = {
  'Ganga Dussehra':      'GangaDussehra.png',
  'Vat Purnima':         'VatPurnima.png',
  'Jagannath Rath Yatra':'Jagannath Rath Yatra.png',
  'Guru Purnima':        'Guru Purnima.png',
  'Nag Panchami':        'Nag Panchami.png',
  'Raksha Bandhan':      'Raksha Bandhan.png',
  'Onam':                'Onam.png',
  'Janmashtami':         'anmashtami.png',
  'Ganesha Chaturthi':   'Ganesha Chaturthi.png',
  'Sharad Navratri':     'Sharad Navratri.png',
};

export function getFestivalImageUrl(festivalName: string): string | null {
  const filename = FESTIVAL_IMAGE_MAP[festivalName];
  if (!filename) return null;
  return supabase.storage.from('Festival Images').getPublicUrl(filename).data.publicUrl;
}
