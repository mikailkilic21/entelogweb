import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Box } from 'lucide-react-native';
import { Product } from '@/types';
import { API_URL } from '@/constants/Config';

interface ProductItemProps {
    item: Product;
    index: number;
    onPress: (id: number) => void;
}

const ProductItem = React.memo(({ item, index, onPress }: ProductItemProps) => {
    const [imageError, setImageError] = useState(false);

    return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()} className="mb-3">
            <TouchableOpacity onPress={() => onPress(item.id)} activeOpacity={0.7}>
                <View className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl mb-3 flex-row items-center">

                    <View className="w-16 h-16 rounded-xl mr-4 bg-slate-800/50 overflow-hidden items-center justify-center border border-slate-700/50">
                        {!imageError ? (
                            <Image
                                source={{ uri: `${API_URL}/products/image/${encodeURIComponent(item.code)}` }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <Box size={24} color="#94a3b8" />
                        )}
                    </View>

                    <View className="flex-1">
                        <Text className="text-white font-bold text-base" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-slate-500 text-xs font-mono mt-1">{item.code}</Text>
                        <Text className="text-slate-400 text-xs mt-1">{item.brand || '-'}</Text>
                    </View>

                    <View className="items-end">
                        <View className={`px-2 py-1 rounded text-xs font-bold mb-1 ${item.stockLevel > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                            <Text className={item.stockLevel > 0 ? 'text-blue-400' : 'text-red-400'}>
                                {item.stockLevel.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.unit || ''}
                            </Text>
                        </View>
                        <Text className="text-emerald-400 font-bold text-sm">
                            {(item.stockValue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

ProductItem.displayName = 'ProductItem';

export default ProductItem;
