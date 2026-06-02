import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

interface Props {
  streak: number;
  onPress?: () => void;
  textColor?: string;
  hideNumber?: boolean;
  scale?: number;
}

// p  = side lean (-1 left → 1 right)
// tp = tip height (0 → 1)
function buildOuter(p: number, tp: number) {
  const tx = (13 + p * 1.2).toFixed(2);
  const ty = (2 - tp * 1.0).toFixed(2);
  const rCP = (4 + p * 3).toFixed(2);
  const lCP = (4 - p * 3).toFixed(2);
  return `M ${tx},${ty} C 18,${rCP} 22,10 22,17 C 22,22 18,26 13,26 C 8,26 4,22 4,17 C 4,10 8,${lCP} ${tx},${ty} Z`;
}

function buildMid(p: number, tp: number) {
  const tx = (13 + p * 0.9).toFixed(2);
  const ty = (6 - tp * 0.7).toFixed(2);
  const rCP = (8 + p * 2.5).toFixed(2);
  const lCP = (8 - p * 2.5).toFixed(2);
  return `M ${tx},${ty} C 17,${rCP} 20,13 20,18 C 20,22 17,25 13,25 C 9,25 6,22 6,18 C 6,13 9,${lCP} ${tx},${ty} Z`;
}

const STATIC_OUTER = buildOuter(0, 0);
const STATIC_MID = buildMid(0, 0);

export default function DiyaStreak({ streak, onPress, textColor = '#FBBF24', hideNumber = false, scale = 1 }: Props) {
  const [outerD, setOuterD] = useState(STATIC_OUTER);
  const [midD, setMidD] = useState(STATIC_MID);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();

    const tick = (now: number) => {
      const t = now - start;
      // Two sine waves at different periods so they never perfectly sync
      const p  = Math.sin((2 * Math.PI * t) / 1750);
      const tp = Math.sin((2 * Math.PI * t) / 1200);
      setOuterD(buildOuter(p, tp));
      setMidD(buildMid(p, tp));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <Svg width={25 * scale} height={32 * scale} viewBox="0 0 26 34">
        <Defs>
          <LinearGradient id="dsFOuter" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#CC2200" stopOpacity="1" />
            <Stop offset="0.45" stopColor="#FF5200" stopOpacity="1" />
            <Stop offset="1" stopColor="#FF9500" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="dsFMid" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#FF7000" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#FFD000" stopOpacity="1" />
            <Stop offset="1" stopColor="#FFE87A" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="dsFCore" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#FFE040" stopOpacity="1" />
            <Stop offset="1" stopColor="#FFFBE0" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Path d={outerD} fill="url(#dsFOuter)" />
        <Path d={midD} fill="url(#dsFMid)" />
        <Path
          d="M 13,14 C 16,14 18,17 18,21 C 18,24 16,25 13,25 C 10,25 8,24 8,21 C 8,17 10,14 13,14 Z"
          fill="url(#dsFCore)"
        />
        <Rect x={12} y={26} width={2} height={7} fill="#5C3010" rx={1} />
      </Svg>

      <Svg width={52 * scale} height={33 * scale} viewBox="0 0 44 28" style={[styles.bowl, { marginTop: -7 * scale }]}>
        <Path
          d="M 6,3 L 38,3 Q 41,3 41,6 C 41,18 32,26 22,26 C 12,26 3,18 3,6 Q 3,3 6,3 Z"
          fill="#8B4A1E"
          stroke="rgba(251,191,36,0.30)"
          strokeWidth="1.2"
        />
        {!hideNumber && (
          <SvgText
            x={22}
            y={17}
            textAnchor="middle"
            fontSize={13}
            fontWeight="700"
            fill={textColor}
          >
            {streak}
          </SvgText>
        )}
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 4 },
  bowl: {},
});
