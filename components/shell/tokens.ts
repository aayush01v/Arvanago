export const SHELL_TOKENS = {
  header: {
    height: 'h-16',
    mobileLogoWrap: 'flex items-center gap-2 md:hidden',
    actionCluster: 'flex items-center gap-2 sm:gap-3 md:gap-4 justify-end',
    avatarCluster: 'flex items-center gap-2 sm:gap-3 pl-3 border-l border-slate-200 dark:border-slate-700',
    searchButton: 'relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-brand-primary dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors',
  },
  drawer: {
    container: 'fixed inset-y-0 left-0 z-40 flex w-56 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300',
    topBar: 'relative flex h-16 items-center border-b border-slate-800/70 px-4 shrink-0',
    navHeader: 'text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 pl-3 mb-2',
    navLabel: 'text-sm font-medium tracking-[0.01em]',
    navLinkBase: 'group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200',
    navLinkActive: 'bg-brand-primary/15 text-brand-primary',
    navLinkInactive: 'text-slate-300 hover:bg-slate-900 hover:text-white',
    iconActive: 'text-brand-primary',
    iconInactive: 'text-slate-500 group-hover:text-slate-200',
  },
};

