import React, { useCallback, useMemo } from 'react';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@shopify/restyle';
import type { Theme } from '../theme';

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose: () => void;
  sheetRef: React.RefObject<GorhomBottomSheet | null>;
  scrollable?: boolean;
}

export default function BottomSheet({
  children,
  snapPoints: customSnapPoints,
  onClose,
  sheetRef,
  scrollable = false,
}: BottomSheetProps) {
  const theme = useTheme<Theme>();
  const snapPoints = useMemo(
    () => customSnapPoints ?? ['50%', '85%'],
    [customSnapPoints],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    [],
  );

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={{
        backgroundColor: theme.colors.border,
        width: 40,
      }}
      backgroundStyle={{
        backgroundColor: theme.colors.cardBackground,
        borderTopLeftRadius: theme.borderRadii.xl,
        borderTopRightRadius: theme.borderRadii.xl,
      }}
    >
      {scrollable ? (
        <BottomSheetScrollView style={{ flex: 1 }}>
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={{ flex: 1 }}>
          {children}
        </BottomSheetView>
      )}
    </GorhomBottomSheet>
  );
}
