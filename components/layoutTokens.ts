export const NAV_COLOR_TOKENS = {
  shell: {
    border: 'border-slate-200 dark:border-slate-800',
    background: 'bg-white dark:bg-slate-900',
    surface: 'bg-slate-50 dark:bg-slate-800/70',
  },
  overlay: {
    backdrop: 'bg-slate-950/55 dark:bg-slate-950/70',
    blur: 'backdrop-blur-sm',
    open: 'opacity-100',
    closed: 'opacity-0 pointer-events-none',
  },
  navItem: {
    base: 'text-slate-600 dark:text-slate-300',
    active: 'bg-brand-primary/12 text-brand-primary dark:bg-brand-primary/20 dark:text-sky-200',
    hoverFocus:
      'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/80 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50',
    icon: 'text-slate-400 dark:text-slate-500',
    iconActive: 'text-brand-primary dark:text-sky-300',
  },
};

export const NAV_ICON_SIZE_CLASS = 'h-5 w-5';
