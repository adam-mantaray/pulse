import {
  createRestyleComponent,
  createVariant,
  VariantProps,
  spacing,
  SpacingProps,
  backgroundColor,
  BackgroundColorProps,
  border,
  BorderProps,
  layout,
  LayoutProps,
} from '@shopify/restyle';
import { Theme } from '../theme';

type CardProps = VariantProps<Theme, 'cardVariants'> &
  SpacingProps<Theme> &
  BackgroundColorProps<Theme> &
  BorderProps<Theme> &
  LayoutProps<Theme> &
  React.ComponentPropsWithRef<typeof import('react-native').View>;

const Card = createRestyleComponent<CardProps, Theme>(
  [
    createVariant({ themeKey: 'cardVariants' }),
    spacing,
    backgroundColor,
    border,
    layout,
  ],
);

export default Card;
