import { useState } from 'react';
import { View, Text, Image, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type ProfileAvatarProps = {
  name?: string;
  email?: string;
  pictureUrl?: string | null;
  size?: number;
  style?: ViewStyle;
};

export function ProfileAvatar({ name, email, pictureUrl, size = 72, style }: ProfileAvatarProps) {
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  const initials = (name || email || 'U')
    .split(/[\s@]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const showImage = !!pictureUrl && !imageFailed;
  const radius = size / 2;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.accent,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: pictureUrl }}
          style={{ width: size, height: size, borderRadius: radius }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text style={{ fontWeight: '700', color: colors.primaryText, fontSize: size * 0.3 }}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
});
