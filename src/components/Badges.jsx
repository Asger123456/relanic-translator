// All badges in the system
export const ALL_BADGES = [
  // Owner
  { id: 'owner', label: 'Owner', icon: '♛', color: '#f0d47a', description: 'Creator of Tongues' },
  // Role badges
  { id: 'admin',       label: 'Admin',           icon: '⚡', color: '#e07070', description: 'Platform administrator' },
  { id: 'moderator',   label: 'Moderator',       icon: '🛡', color: '#9370db', description: 'Community moderator' },
  { id: 'trusted',     label: 'Trusted',         icon: '✦',  color: '#38b2ac', description: 'Trusted community member' },
  // Achievement badges
  { id: 'verified',    label: 'Verified',        icon: '◈',  color: '#c9a84c', description: 'Verified language builder' },
  { id: 'wordsmith',   label: 'Wordsmith',       icon: '✒',  color: '#c9a84c', description: 'Created a translator with 50+ words' },
  { id: 'lexicon',     label: 'Lexicon',         icon: '📖', color: '#5090e0', description: 'Created a translator with 200+ words' },
  { id: 'polyglot',    label: 'Polyglot',        icon: '🌐', color: '#60c080', description: 'Published 5+ translators' },
  { id: 'architect',   label: 'Architect',       icon: '⌬',  color: '#e08040', description: 'Created a translator with grammar rules' },
  { id: 'scholar',     label: 'Scholar',         icon: '⟁',  color: '#9370db', description: 'Left 20+ ratings' },
  { id: 'social',      label: 'Social',          icon: '⬡',  color: '#c060a0', description: 'Has 10+ followers' },
  { id: 'pioneer',     label: 'Pioneer',         icon: '⍟',  color: '#c9a84c', description: 'One of the first 100 users' },
  { id: 'critic',      label: 'Critic',          icon: '⌘',  color: '#50b8d0', description: 'Left a comment on 10+ translators' },
]

export const ROLE_BADGE_IDS = ['owner','admin','moderator','trusted']

export function BadgeIcon({ badge, size = 'sm' }) {
  const b = typeof badge === 'string' ? ALL_BADGES.find(x => x.id === badge) : badge
  if (!b) return null
  const rgb = b.color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  const pad = size === 'lg' ? '6px 14px' : size === 'md' ? '4px 10px' : '2px 8px'
  const fs = size === 'lg' ? '.85rem' : size === 'md' ? '.72rem' : '.62rem'
  const iconFs = size === 'lg' ? '1rem' : size === 'md' ? '.85rem' : '.72rem'
  return (
    <span title={b.description} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: `rgba(${rgb},0.12)`,
      border: `1px solid rgba(${rgb},0.4)`,
      color: b.color, borderRadius: 6, padding: pad,
      fontFamily: "'JetBrains Mono', monospace", fontSize: fs,
      letterSpacing: '.08em', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: iconFs }}>{b.icon}</span>
      {b.label}
    </span>
  )
}

export function BadgeList({ badges = [], size = 'sm' }) {
  if (!badges || badges.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {badges.map(id => <BadgeIcon key={id} badge={id} size={size} />)}
    </div>
  )
}
