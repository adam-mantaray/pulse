import { createTheme } from '@shopify/restyle';
import { palette, darkPalette } from './tokens/colors';

const theme = createTheme({
  colors: {
    // Backgrounds
    mainBackground: palette.bg,
    secondaryBackground: palette.bgSecondary,
    cardBackground: palette.card,
    cardWarmBackground: palette.cardWarm,

    // Text
    textPrimary: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textTertiary: palette.textTertiary,
    textOnAccent: palette.white,

    // Accent
    accent: palette.accent,
    accentLight: palette.accentLight,
    accentWarm: palette.accentWarm,

    // Semantic (from Ledgerly)
    expense: palette.expense,
    income: palette.income,
    warning: palette.gold,
    border: palette.border,
    transparent: palette.transparent,

    // Pulse-specific semantic colors
    success: palette.income,        // #3A7D53 — goal completed, habit done
    danger: palette.expense,        // #C45C3E — blockers, overdue
    streak: palette.gold,           // #C49A3F — habit streaks
    agentActive: palette.accent,    // #2D5F3F — agent online
    agentIdle: palette.textTertiary, // #A09A8C — agent idle
  },

  spacing: {
    '0': 0,
    xs: 4,
    s: 8,
    m: 12,
    md: 16,
    l: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
  },

  borderRadii: {
    none: 0,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
    pill: 9999,
  },

  textVariants: {
    defaults: {
      fontFamily: 'DMSans-Regular',
      fontSize: 16,
      lineHeight: 26,
      color: 'textPrimary',
    },
    displayLarge: {
      fontFamily: 'Fraunces-Bold',
      fontSize: 36,
      lineHeight: 40,
      color: 'textPrimary',
    },
    heading: {
      fontFamily: 'Fraunces-SemiBold',
      fontSize: 20,
      lineHeight: 26,
      color: 'textPrimary',
    },
    subheading: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 16,
      lineHeight: 22,
      color: 'textPrimary',
    },
    body: {
      fontFamily: 'DMSans-Regular',
      fontSize: 16,
      lineHeight: 26,
      color: 'textPrimary',
    },
    bodySmall: {
      fontFamily: 'DMSans-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: 'textSecondary',
    },
    label: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
      color: 'textTertiary',
    },
    button: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 16,
      lineHeight: 22,
      color: 'textOnAccent',
    },
    amount: {
      fontFamily: 'Fraunces-Bold',
      fontSize: 32,
      lineHeight: 36,
      color: 'textPrimary',
    },
  },

  cardVariants: {
    defaults: {
      backgroundColor: 'cardBackground',
      borderRadius: 'md',
      padding: 'md',
      borderWidth: 1,
      borderColor: 'border',
    },
    elevated: {
      backgroundColor: 'cardBackground',
      borderRadius: 'md',
      padding: 'md',
      shadowColor: 'textPrimary',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    warm: {
      backgroundColor: 'cardWarmBackground',
      borderRadius: 'md',
      padding: 'md',
      borderWidth: 1,
      borderColor: 'border',
    },
  },

  buttonVariants: {
    defaults: {
      backgroundColor: 'accent',
      borderRadius: 'md',
      paddingVertical: 'md',
      paddingHorizontal: 'xl',
    },
    primary: {
      backgroundColor: 'accent',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: 'accent',
    },
    danger: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: 'expense',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  },
});

export type Theme = typeof theme;

export const darkTheme: Theme = {
  ...theme,
  colors: {
    mainBackground: darkPalette.bg as Theme['colors']['mainBackground'],
    secondaryBackground: darkPalette.bgSecondary as Theme['colors']['secondaryBackground'],
    cardBackground: darkPalette.card as Theme['colors']['cardBackground'],
    cardWarmBackground: darkPalette.cardWarm as Theme['colors']['cardWarmBackground'],
    textPrimary: darkPalette.textPrimary as Theme['colors']['textPrimary'],
    textSecondary: darkPalette.textSecondary as Theme['colors']['textSecondary'],
    textTertiary: darkPalette.textTertiary as Theme['colors']['textTertiary'],
    textOnAccent: darkPalette.white as Theme['colors']['textOnAccent'],
    accent: darkPalette.accent as Theme['colors']['accent'],
    accentLight: darkPalette.accentLight as Theme['colors']['accentLight'],
    accentWarm: darkPalette.accentWarm as Theme['colors']['accentWarm'],
    expense: darkPalette.expense as Theme['colors']['expense'],
    income: darkPalette.income as Theme['colors']['income'],
    warning: darkPalette.gold as Theme['colors']['warning'],
    border: darkPalette.border as Theme['colors']['border'],
    transparent: darkPalette.transparent as Theme['colors']['transparent'],

    // Pulse-specific semantic colors (dark)
    success: darkPalette.income as Theme['colors']['success'],
    danger: darkPalette.expense as Theme['colors']['danger'],
    streak: darkPalette.gold as Theme['colors']['streak'],
    agentActive: darkPalette.accent as Theme['colors']['agentActive'],
    agentIdle: darkPalette.textTertiary as Theme['colors']['agentIdle'],
  },
};

export default theme;
