import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#334155', // slate-700
    },
});

interface ChartSkeletonProps {
    type: 'line' | 'bar' | 'pie';
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ type }) => {
    return (
        <View className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6">
            {/* Title */}
            <Skeleton width="60%" height={20} style={{ marginBottom: 16 }} />

            {/* Chart Area */}
            {type === 'line' && (
                <View>
                    <Skeleton width="100%" height={220} borderRadius={12} />
                    {/* Legend */}
                    <View className="flex-row justify-center gap-6 mt-4">
                        <Skeleton width={80} height={12} />
                        <Skeleton width={80} height={12} />
                    </View>
                </View>
            )}

            {type === 'bar' && (
                <View className="flex-row items-end justify-around" style={{ height: 180 }}>
                    <Skeleton width={35} height={120} />
                    <Skeleton width={35} height={90} />
                    <Skeleton width={35} height={150} />
                    <Skeleton width={35} height={100} />
                    <Skeleton width={35} height={130} />
                </View>
            )}

            {type === 'pie' && (
                <View className="flex-row items-center justify-center">
                    {/* Pie Chart Circle */}
                    <Skeleton width={140} height={140} borderRadius={70} />
                    {/* Legend */}
                    <View className="ml-6 flex-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <View key={i} className="flex-row items-center mb-2">
                                <Skeleton width={8} height={8} borderRadius={4} style={{ marginRight: 8 }} />
                                <Skeleton width="60%" height={10} />
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};
