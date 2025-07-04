import React, { useState } from 'react';
import {
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
  Modal
} from 'react-native';
import type { Attachment } from '../../types';
import { useAppTheme } from '../../theming/useAppTheme';

interface ImageCarouselProps {
  images: Attachment[];
  onImagePress?: (image: Attachment, index: number) => void;
  showCount?: boolean;
  maxPreviewHeight?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  onImagePress,
  showCount = true,
  maxPreviewHeight = 200
}) => {
  const { theme } = useAppTheme();
  const [selectedImage, setSelectedImage] = useState<{ image: Attachment; index: number } | null>(null);
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());

  const handleImagePress = (image: Attachment, index: number) => {
    if (onImagePress) {
      onImagePress(image, index);
    } else {
      setSelectedImage({ image, index });
    }
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const handleImageLoadStart = (imageId: string) => {
    setImageLoading(prev => new Set(prev).add(imageId));
  };

  const handleImageLoadEnd = (imageId: string) => {
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: theme.spacing.sm,
    },
    imageContainer: {
      position: 'relative',
      marginRight: theme.spacing.sm,
    },
    image: {
      width: screenWidth * 0.6,
      height: maxPreviewHeight,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    } as const,
    lastImage: {
      marginRight: theme.spacing.md,
    },
    imageCounter: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    counterText: {
      color: 'white',
      fontSize: theme.typography.fontSize.small,
      fontWeight: '600' as const,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
    },
    // Modal styles
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalImage: {
      width: screenWidth * 0.95,
      height: screenHeight * 0.8,
      resizeMode: 'contain',
    } as const,
    modalCloseArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalImageCounter: {
      position: 'absolute',
      bottom: 50,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    modalCounterText: {
      color: 'white',
      fontSize: theme.typography.fontSize.medium,
      fontWeight: '600' as const,
    },
  });

  if (images.length === 0) {
    return null;
  }

  const filteredImages = images.filter(img =>
    img.fileType.startsWith('image/') && img.url
  );

  if (filteredImages.length === 0) {
    return null;
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
        decelerationRate="fast"
        snapToInterval={screenWidth * 0.6 + theme.spacing.sm}
        snapToAlignment="start"
      >
        {filteredImages.map((image, index) => (
          <TouchableOpacity
            key={image.id}
            style={[
              styles.imageContainer,
              index === filteredImages.length - 1 && styles.lastImage
            ]}
            onPress={() => handleImagePress(image, index)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: image.thumbnailUrl || image.url }}
              style={styles.image}
              onLoadStart={() => handleImageLoadStart(image.id)}
              onLoadEnd={() => handleImageLoadEnd(image.id)}
              resizeMode="cover"
            />

            {imageLoading.has(image.id) && (
              <View style={styles.loadingOverlay}>
                <Text style={{ color: theme.colors.textSecondary }}>Loading...</Text>
              </View>
            )}

            {showCount && filteredImages.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.counterText}>
                  {index + 1}/{filteredImages.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Full-screen modal */}
      {selectedImage && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.modalCloseArea}
              onPress={closeModal}
              activeOpacity={1}
            />
            <Image
              source={{ uri: selectedImage.image.url }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            {showCount && filteredImages.length > 1 && (
              <View style={styles.modalImageCounter}>
                <Text style={styles.modalCounterText}>
                  {selectedImage.index + 1}/{filteredImages.length}
                </Text>
              </View>
            )}
          </View>
        </Modal>
      )}
    </>
  );
};
