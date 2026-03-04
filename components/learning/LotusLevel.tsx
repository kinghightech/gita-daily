// @ts-nocheck
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function LotusLevel({ level, isCompleted, isLocked, isActive, onClick, size = "lg" }) {
    const sizeClasses = size === "lg" ? "w-20 h-20" : "w-14 h-14";
    
    return (
        <motion.button
            onClick={() => !isLocked && onClick(level)}
            disabled={isLocked}
            whileHover={!isLocked ? { scale: 1.15, y: -3 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            className={`relative group ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {/* Water ripple effect */}
            {!isLocked && (
                <>
                    <motion.div
                        className="absolute inset-0 rounded-full bg-cyan-300/30"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute inset-0 rounded-full bg-cyan-200/20"
                        animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                </>
            )}
            
            {/* Lotus Image */}
            <div className={`relative ${sizeClasses} ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                <svg viewBox="0 0 100 90" className="w-full h-full drop-shadow-xl">
                    {/* Lily pad / leaf base */}
                    <ellipse
                        cx="50"
                        cy="78"
                        rx="38"
                        ry="10"
                        className={`${isCompleted ? 'fill-emerald-400' : 'fill-emerald-500'}`}
                    />
                    <ellipse
                        cx="50"
                        cy="78"
                        rx="28"
                        ry="7"
                        className={`${isCompleted ? 'fill-emerald-300' : 'fill-emerald-400'} opacity-70`}
                    />
                    
                    {/* Outer petals - more spread */}
                    {[-40, -25, -10, 10, 25, 40].map((angle, i) => (
                        <ellipse
                            key={`outer-${i}`}
                            cx="50"
                            cy="48"
                            rx="8"
                            ry="28"
                            transform={`rotate(${angle} 50 65)`}
                            className={`${
                                isCompleted 
                                    ? 'fill-amber-200' 
                                    : isActive 
                                        ? 'fill-pink-100' 
                                        : 'fill-pink-50'
                            } ${!isLocked && 'group-hover:fill-pink-200'} transition-colors duration-300`}
                        />
                    ))}
                    
                    {/* Middle petals */}
                    {[-30, -15, 0, 15, 30].map((angle, i) => (
                        <ellipse
                            key={`mid-${i}`}
                            cx="50"
                            cy="45"
                            rx="7"
                            ry="24"
                            transform={`rotate(${angle} 50 62)`}
                            className={`${
                                isCompleted 
                                    ? 'fill-amber-300' 
                                    : isActive 
                                        ? 'fill-pink-200' 
                                        : 'fill-pink-100'
                            } ${!isLocked && 'group-hover:fill-pink-300'} transition-colors duration-300`}
                        />
                    ))}
                    
                    {/* Inner petals */}
                    {[-20, -7, 7, 20].map((angle, i) => (
                        <ellipse
                            key={`inner-${i}`}
                            cx="50"
                            cy="42"
                            rx="6"
                            ry="20"
                            transform={`rotate(${angle} 50 58)`}
                            className={`${
                                isCompleted 
                                    ? 'fill-amber-400' 
                                    : isActive 
                                        ? 'fill-pink-300' 
                                        : 'fill-pink-200'
                            } ${!isLocked && 'group-hover:fill-pink-400'} transition-colors duration-300`}
                        />
                    ))}
                    
                    {/* Center petals */}
                    {[-12, 0, 12].map((angle, i) => (
                        <ellipse
                            key={`center-${i}`}
                            cx="50"
                            cy="40"
                            rx="5"
                            ry="16"
                            transform={`rotate(${angle} 50 54)`}
                            className={`${
                                isCompleted 
                                    ? 'fill-amber-500' 
                                    : isActive 
                                        ? 'fill-pink-400' 
                                        : 'fill-pink-300'
                            } ${!isLocked && 'group-hover:fill-pink-500'} transition-colors duration-300`}
                        />
                    ))}
                    
                    {/* Center */}
                    <circle
                        cx="50"
                        cy="45"
                        r="10"
                        className={`${
                            isCompleted 
                                ? 'fill-yellow-400' 
                                : isActive 
                                    ? 'fill-yellow-300' 
                                    : 'fill-yellow-200'
                        } transition-colors duration-300`}
                    />
                    
                    {/* Center details */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                        <circle
                            key={`dot-${i}`}
                            cx={50 + 5 * Math.cos(angle * Math.PI / 180)}
                            cy={45 + 5 * Math.sin(angle * Math.PI / 180)}
                            r="1.5"
                            className="fill-amber-600"
                        />
                    ))}
                </svg>
                
                {/* Level number or lock */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-6px' }}>
                    {isLocked ? (
                        <Lock className="w-4 h-4 text-slate-400" />
                    ) : (
                        <span className={`text-sm font-bold ${
                            isCompleted ? 'text-amber-800' : 'text-pink-800'
                        }`}>
                            {level}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Glow effect for completed */}
            {isCompleted && (
                <div className="absolute inset-0 rounded-full bg-amber-400/50 blur-lg -z-10" />
            )}
            
            {/* Active glow */}
            {isActive && !isCompleted && (
                <motion.div 
                    className="absolute inset-0 rounded-full bg-pink-400/40 blur-lg -z-10"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
        </motion.button>
    );
}