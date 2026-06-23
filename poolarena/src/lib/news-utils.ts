const VIET_MAP: Record<string, string> = {
  à:'a', á:'a', ả:'a', ã:'a', ạ:'a',
  ă:'a', ắ:'a', ằ:'a', ẳ:'a', ẵ:'a', ặ:'a',
  â:'a', ấ:'a', ầ:'a', ẩ:'a', ẫ:'a', ậ:'a',
  è:'e', é:'e', ẻ:'e', ẽ:'e', ẹ:'e',
  ê:'e', ế:'e', ề:'e', ể:'e', ễ:'e', ệ:'e',
  ì:'i', í:'i', ỉ:'i', ĩ:'i', ị:'i',
  ò:'o', ó:'o', ỏ:'o', õ:'o', ọ:'o',
  ô:'o', ố:'o', ồ:'o', ổ:'o', ỗ:'o', ộ:'o',
  ơ:'o', ớ:'o', ờ:'o', ở:'o', ỡ:'o', ợ:'o',
  ù:'u', ú:'u', ủ:'u', ũ:'u', ụ:'u',
  ư:'u', ứ:'u', ừ:'u', ử:'u', ữ:'u', ự:'u',
  ỳ:'y', ý:'y', ỷ:'y', ỹ:'y', ỵ:'y',
  đ:'d',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(c => VIET_MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function newsHref(id: number, title: string): string {
  return `/news/${id}-${slugify(title)}`;
}

export function parseNewsId(slug: string): number {
  return parseInt(slug.split('-')[0], 10);
}

const BUTTON_STYLE = 'display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:8px 24px;border-radius:24px;background:#C6010B;color:#fff;text-decoration:none;font-weight:500;font-size:16px;line-height:24px;font-family:Montserrat,sans-serif;';

export function fixNewsButtons(html: string): string {
  return html.replace(
    /<a([^>]+)style="[^"]*background:#(?:ED1C1F|D22E39|C6010B)[^"]*"([^>]*)>/gi,
    (_match, before: string, after: string) =>
      `<a${before}style="${BUTTON_STYLE}"${after}>`
  );
}
