import React, { memo, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import LikeableImage from "./LikeableImage";

import { FONTS } from "../../constants/fonts";

type ImageCarouselProps = {
  images: string[];
  onLike: () => void;
  isLiked: boolean;
  style?: ViewStyle;
};

const { width: screenWidth } = Dimensions.get("window");

const ImageCarousel = memo(
  ({ images, onLike, isLiked, style }: ImageCarouselProps) => {
    const { theme } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const currentIndex = Math.round(contentOffsetX / screenWidth);
      setActiveIndex(currentIndex);
    };

    // Only show carousel if there are multiple images
    if (images.length === 1) {
      return (
        <LikeableImage
          uri={images[0]}
          style={style}
          onLike={onLike}
          isLiked={isLiked}
        />
      );
    }

    return (
      <View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={style}
        >
          {images.map((imageUri, index) => (
            <LikeableImage
              key={index}
              uri={imageUri}
              style={[style, { width: screenWidth }]}
              onLike={onLike}
              isLiked={isLiked}
            />
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        {images.length > 1 && (
          <>
            <View style={styles.paginationContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor:
                        index === activeIndex
                          ? theme.primary.main
                          : "rgba(0, 0, 0, 0.5)",
                    },
                  ]}
                />
              ))}
            </View>
            {/* Image Counter */}
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {activeIndex + 1}/{images.length}
              </Text>
            </View>
          </>
        )}
      </View>
    );
  },
);

ImageCarousel.displayName = "ImageCarousel";

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  counterContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
});

export default ImageCarousel;
