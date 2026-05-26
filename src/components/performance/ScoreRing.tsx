import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { scoreColor } from '../../lib/performance-format';

type ScoreRingProps = {
  score: number;
  scoreMin?: number;
  scoreMax?: number;
  size?: number;
};

export function ScoreRing({ score, scoreMin, scoreMax, size = 120 }: ScoreRingProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score)) / 100;
  const color = scoreColor(score);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(128,128,128,0.25)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={`${circumference * progress} ${circumference}`}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.label}>
        <Text style={[styles.score, { color }]}>{Math.round(score)}</Text>
        <Text style={styles.sub}>score</Text>
        {scoreMin != null && scoreMax != null ? (
          <Text style={styles.range}>
            {Math.round(scoreMin)}–{Math.round(scoreMax)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  label: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 32, fontWeight: '800' },
  sub: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginTop: -2 },
  range: { fontSize: 9, color: '#888', marginTop: 2 },
});
