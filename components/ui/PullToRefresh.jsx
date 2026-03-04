import { Loader2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
    const startYRef = useRef(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef(null);

    const handleTouchStart = useCallback((e) => {
        if (containerRef.current?.scrollTop === 0) {
            startYRef.current = e.touches[0].clientY;
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (startYRef.current === null || isRefreshing) return;
        const diff = e.touches[0].clientY - startYRef.current;
        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            e.preventDefault();
            setPullDistance(Math.min(diff * 0.5, THRESHOLD + 20));
        }
    }, [isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (pullDistance >= THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(THRESHOLD);
            await onRefresh();
            setIsRefreshing(false);
        }
        setPullDistance(0);
        startYRef.current = null;
    }, [pullDistance, isRefreshing, onRefresh]);

    const indicatorOpacity = Math.min(pullDistance / THRESHOLD, 1);
    const rotation = (pullDistance / THRESHOLD) * 360;

    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            {/* Pull indicator */}
            <div
                className="flex items-center justify-center overflow-hidden transition-all duration-200"
                style={{ height: pullDistance, opacity: indicatorOpacity }}
            >
                <Loader2
                    className="w-6 h-6 text-amber-400"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                    }}
                />
            </div>
            {children}
        </div>
    );
}