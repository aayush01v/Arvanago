export const MOTION = {
  duration: {
    fast: 0.16,
    standard: 0.24,
    slow: 0.36,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    emphasized: [0.2, 0.8, 0.2, 1] as const,
  },
};
