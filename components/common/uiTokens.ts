export const uiTokens = {
  radius: {
    surface: 'rounded-2xl',
    interactive: 'rounded-xl',
    pill: 'rounded-full',
  },
  elevation: {
    card: 'shadow-[0_14px_38px_rgba(15,23,42,0.12)] dark:shadow-[0_12px_30px_rgba(2,6,23,0.55)]',
    floating: 'shadow-[0_18px_40px_rgba(15,23,42,0.22)] dark:shadow-[0_16px_34px_rgba(2,6,23,0.6)]',
    subtle: 'shadow-sm',
  },
  icon: {
    strokeWidth: 1.75,
    activeStrokeWidth: 2,
  },
  chip: {
    height: 'h-8',
  },
} as const;

export type UiTokenMap = typeof uiTokens;
