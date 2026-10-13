/* eslint-disable @next/next/no-img-element */

export default function BrandLogo({ tone = 'dark' }: { tone?: 'dark' | 'light' | 'system' }) {
  const logo = <img className="brand-logo" src={tone === 'light' ? '/fotos/zutere-white.png' : '/fotos/zutere-black.png'} alt="Zutere" width={tone === 'light' ? 774 : 1260} height={tone === 'light' ? 218 : 354} />;
  return tone === 'system' ? <picture><source media="(prefers-color-scheme: dark)" srcSet="/fotos/zutere-white.png" />{logo}</picture> : logo;
}
