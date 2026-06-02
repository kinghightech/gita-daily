/**
 * DiyaIcon — compact vertical diya asset.
 * Flame is the main focus (~70% of height). Bowl is narrow and supportive.
 * Use size prop to scale uniformly.
 */
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface Props {
  size?: number;
}

export default function DiyaIcon({ size = 60 }: Props) {
  return (
    // viewBox 60×64 — content: flame y4-y42, wick y42-y46, bowl y46-y58
    <Svg width={size} height={size * (64 / 60)} viewBox="0 0 60 64">
      <Defs>
        <LinearGradient id="diIconOuter" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#B52000" stopOpacity="1" />
          <Stop offset="0.38" stopColor="#FF4400" stopOpacity="1" />
          <Stop offset="1" stopColor="#FF8800" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="diIconInner" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#FFCC00" stopOpacity="1" />
          <Stop offset="0.5" stopColor="#FFE84D" stopOpacity="1" />
          <Stop offset="1" stopColor="#FFF9CC" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* ── Flame ─────────────────────────────────────────────────────────── */}
      {/* Outer flame: teardrop, wide lower half, sharp tip at top */}
      <Path
        d="M 30,42 C 21,37 19,27 22,17 C 24,10 27,5 30,4 C 33,5 36,10 38,17 C 41,27 39,37 30,42 Z"
        fill="url(#diIconOuter)"
      />
      {/* Inner golden core: sits inside lower 2/3 of outer */}
      <Path
        d="M 30,37 C 24,32 23,23 26,16 C 27,11 29,8 30,7 C 31,8 33,11 34,16 C 37,23 36,32 30,37 Z"
        fill="url(#diIconInner)"
      />

      {/* ── Wick ──────────────────────────────────────────────────────────── */}
      <Rect x="29" y="42" width="2" height="4" rx="1" fill="#5C3010" />

      {/* ── Bowl ──────────────────────────────────────────────────────────── */}
      {/* Half-ellipse: center (30,46), rx=17, ry=12 */}
      <Path
        d="M 13,46 C 13,54 21,58 30,58 C 39,58 47,54 47,46 Z"
        fill="#8B4A1E"
        stroke="rgba(251,191,36,0.30)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
