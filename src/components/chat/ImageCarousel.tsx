import React from 'react';
import { ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import type { Attachment } from '../../types';
import { useAppTheme } from '../../theming/useAppTheme';

interface ImageCarouselProps {
  images: Attachment[];
  onImagePress?: (image: Attachment, index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  onImagePress
}) => {
  const { theme } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      marginVertical: theme.spacing.sm,
    },
    image: {
      width: screenWidth * 0.6,
      height: 200,
      borderRadius: theme.borderRadius.md,
      marginRight: theme.spacing.sm,
      resizeMode: 'cover',
    },
    lastImage: {
      marginRight: theme.spacing.md,
    },
  });

  if (images.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
    >
      {images.map((image, index) => (
        <Image
          key={image.id}
          source={{ uri: image.url }}
          style={[
            styles.image,
            index === images.length - 1 && styles.lastImage
          ]}
          onTouchEnd={() => onImagePress?.(image, index)}
        />
      ))}
    </ScrollView>
  );
};
