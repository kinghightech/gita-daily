import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

type LotusLoaderProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

type PetalPath = {
  id: string;
  d: string;
  drawOrder: number;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const LENGTH_FALLBACK = 220;

// Render order is back-to-front so petals overlap like the reference icon.
const LOTUS_PETALS: PetalPath[] = [
  {
    id: 'back-left-outer',
    drawOrder: 5,
    d: 'M50 88 C30 86 15 70 10 52 C25 55 40 72 50 88',
  },
  {
    id: 'back-right-outer',
    drawOrder: 6,
    d: 'M50 88 C70 86 85 70 90 52 C75 55 60 72 50 88',
  },
  {
    id: 'back-left-top',
    drawOrder: 3,
    d: 'M50 88 C45 74 38 56 32 34 C43 38 48 58 50 88',
  },
  {
    id: 'back-right-top',
    drawOrder: 4,
    d: 'M50 88 C55 74 62 56 68 34 C57 38 52 58 50 88',
  },
  {
    id: 'front-left',
    drawOrder: 1,
    d: 'M50 88 C36 80 26 61 20 42 C34 44 45 63 50 88',
  },
  {
    id: 'front-right',
    drawOrder: 2,
    d: 'M50 88 C64 80 74 61 80 42 C66 44 55 63 50 88',
  },
  {
    id: 'front-center',
    drawOrder: 0,
    d: 'M50 88 C42 72 42 48 50 26 C58 48 58 72 50 88',
  },
];

type LotusStrokeProps = {
  d: string;
  drawOrder: number;
  length: number;
  color: string;
  strokeWidth: number;
  progress: Animated.SharedValue<number>;
  step: number;
  span: number;
};

const LotusStroke = memo(function LotusStroke({
  d,
  drawOrder,
  length,
  color,
  strokeWidth,
  progress,
  step,
  span,
}: LotusStrokeProps) {
  const animatedProps = useAnimatedProps(() => {
    const start = drawOrder * step;
    const end = start + span;
    const localProgress = interpolate(progress.value, [start, end], [0, 1], Extrapolation.CLAMP);

    return {
      strokeDashoffset: length * (1 - localProgress),
    };
  }, [drawOrder, length, progress, span, step]);

  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={[length, length]}
      animatedProps={animatedProps}
    />
  );
});

function LotusLoader({
  size = 96,
  color = '#D4AF37',
  strokeWidth = 3,
  duration = 1200,
  style,
}: LotusLoaderProps) {
  const progress = useSharedValue(0);
  const [lengths, setLengths] = useState<number[]>(() => LOTUS_PETALS.map(() => LENGTH_FALLBACK));
  const measureRefs = useRef<Array<Path | null>>([]);

  const { step, span } = useMemo(() => {
    const count = LOTUS_PETALS.length;
    const nextStep = 1 / (count + 1.2);
    const nextSpan = nextStep * 1.85;
    return { step: nextStep, span: nextSpan };
  }, []);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      false
    );
  }, [duration, progress]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      const measured = LOTUS_PETALS.map((_, index) => {
        const path = measureRefs.current[index];
        if (!path || typeof path.getTotalLength !== 'function') return LENGTH_FALLBACK;

        try {
          const value = path.getTotalLength();
          return Number.isFinite(value) && value > 0 ? value : LENGTH_FALLBACK;
        } catch {
          return LENGTH_FALLBACK;
        }
      });

      setLengths(measured);
    });

    return () => cancelAnimationFrame(handle);
  }, [size, strokeWidth]);

  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {LOTUS_PETALS.map((petal, index) => (
          <Path
            key={`measure-${petal.id}`}
            ref={(node) => {
              measureRefs.current[index] = node;
            }}
            d={petal.d}
            fill="none"
            stroke="transparent"
            strokeWidth={0}
          />
        ))}

        {LOTUS_PETALS.map((petal, index) => (
          <LotusStroke
            key={petal.id}
            d={petal.d}
            drawOrder={petal.drawOrder}
            length={lengths[index] ?? LENGTH_FALLBACK}
            color={color}
            strokeWidth={strokeWidth}
            progress={progress}
            step={step}
            span={span}
          />
        ))}
      </Svg>
    </View>
  );
}

export default memo(LotusLoader);
