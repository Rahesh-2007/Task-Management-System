import React, { useState } from 'react';
import { User } from 'lucide-react';

const COLOR_PALETTES = [
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-indigo-500', text: 'text-white' },
  { bg: 'bg-emerald-600', text: 'text-white' },
  { bg: 'bg-amber-500', text: 'text-white' },
  { bg: 'bg-violet-500', text: 'text-white' },
  { bg: 'bg-sky-500', text: 'text-white' },
  { bg: 'bg-teal-600', text: 'text-white' },
  { bg: 'bg-fuchsia-600', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-blue-600', text: 'text-white' },
];

function getColorForString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

function getInitials(name = '', email = '') {
  const target = (name || email || '').trim();
  if (!target) return '';
  
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  
  return target.slice(0, 2).toUpperCase();
}

function isLikelyImageUrl(val) {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim();
  // If it's just 1 or 2 uppercase letters (like 'DU' or 'R' or 'RX'), it's initials, not a URL
  if (/^[A-Z0-9]{1,3}$/i.test(s) && !s.includes('.')) return false;
  return (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('data:image/') ||
    s.startsWith('blob:') ||
    (s.startsWith('/') && (s.endsWith('.jpg') || s.endsWith('.png') || s.endsWith('.webp') || s.endsWith('.svg') || s.endsWith('.jpeg')))
  );
}

const SIZE_MAP = {
  '2xs': 'w-4 h-4 text-[9px]',
  'xs': 'w-5 h-5 text-[10px]',
  'sm': 'w-6 h-6 text-xs',
  'md': 'w-8 h-8 text-xs',
  'lg': 'w-9 h-9 text-xs',
  'xl': 'w-10 h-10 text-sm',
  '2xl': 'w-12 h-12 text-base',
  '3xl': 'w-16 h-16 text-xl',
};

export default function Avatar({
  user,
  name: propName,
  avatar: propAvatar,
  email: propEmail,
  size = 'md',
  rounded = 'rounded-full',
  className = '',
  title,
}) {
  const [imgError, setImgError] = useState(false);

  const name = propName || user?.name || user?.user_name || '';
  const email = propEmail || user?.email || '';
  const rawAvatar = propAvatar !== undefined ? propAvatar : user?.avatar || user?.user_avatar;
  const isImage = isLikelyImageUrl(rawAvatar) && !imgError;

  const initials = getInitials(name, email);
  const color = getColorForString(name || email || 'User');
  const sizeClass = SIZE_MAP[size] || size;
  const tooltipText = title !== undefined ? title : name || email || 'User';

  return (
    <div
      title={tooltipText}
      className={`inline-flex items-center justify-center font-bold select-none overflow-hidden flex-shrink-0 ${rounded} ${sizeClass} ${className} ${
        !isImage ? `${color.bg} ${color.text}` : 'bg-neutral-100'
      }`}
    >
      {isImage ? (
        <img
          src={rawAvatar}
          alt={name || 'Avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span className="leading-none tracking-tight">{initials}</span>
      ) : (
        <User className="w-1/2 h-1/2 opacity-90 stroke-[2.5]" />
      )}
    </div>
  );
}
