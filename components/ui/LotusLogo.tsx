import Svg, { Path } from 'react-native-svg';

type LotusLogoProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export default function LotusLogo({
  size = 128,
  color = '#B8A45A',
  strokeWidth = 4,
}: LotusLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M50 73 C30 69 10 52 1.5 40 C20 37.5 40 50 50 73"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M50 73 C70 69 90 52 98.5 40 C80 37.5 60 50 50 73"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M50 73 C34 67.5 18 50 11.5 29 C27 30.5 43 49.5 50 73"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M50 73 C66 67.5 82 50 88.5 29 C73 30.5 57 49.5 50 73"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M50 73 C39.5 61 33 42.5 31 22 C41.5 25 48 43.5 50 73"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M50 73 C60.5 61 67 42.5 69 22 C58.5 25 52 43.5 50 73"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M50 73 C41.5 58 40.5 34 50 14 C59.5 34 58.5 58 50 73"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
