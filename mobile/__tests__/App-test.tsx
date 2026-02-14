import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

const MockComponent = () => (
    <View>
        <Text>Test Render</Text>
    </View>
);

describe('Basic Test', () => {
    it('renders correctly', () => {
        const { getByText } = render(<MockComponent />);
        expect(getByText('Test Render')).toBeTruthy();
    });
});
