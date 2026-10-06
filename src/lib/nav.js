export const TAB_LINKS = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/accounts', label: 'Accounts', icon: 'wallet' },
  { to: '/ledger', label: 'Entries', icon: 'list' },
  { to: '/capture', label: 'Paste', icon: 'clipboard' },
]

export const MORE_LINKS = [
  { to: '/goals', label: 'Goals', icon: 'target' },
  { to: '/insights', label: 'Graphs', icon: 'chart' },
  { to: '/recurring', label: 'Recurring', icon: 'repeat' },
  { to: '/freedom', label: 'Freedom', icon: 'flag' },
  { to: '/profile', label: 'Profile', icon: 'user' },
]

export const MAIN_LINKS = [...TAB_LINKS, ...MORE_LINKS]

// Sidebar sections.
export const NAV_GROUPS = [
  { label: null, links: [
    { to: '/', label: 'Dashboard', icon: 'grid' },
    { to: '/accounts', label: 'Accounts', icon: 'wallet' },
    { to: '/ledger', label: 'Entries', icon: 'list' },
    { to: '/capture', label: 'Paste', icon: 'clipboard' },
  ] },
  { label: 'Plan', links: [
    { to: '/goals', label: 'Goals', icon: 'target' },
    { to: '/recurring', label: 'Recurring', icon: 'repeat' },
    { to: '/freedom', label: 'Freedom', icon: 'flag' },
  ] },
  { label: 'Insights', links: [
    { to: '/insights', label: 'Graphs', icon: 'chart' },
  ] },
  { label: 'You', links: [
    { to: '/profile', label: 'Profile', icon: 'user' },
  ] },
]
