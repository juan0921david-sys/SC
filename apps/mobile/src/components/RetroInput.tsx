import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '@/styles/colors';

interface RetroInputProps extends TextInputProps {
    label: string;
    icon?: string;
}

export const RetroInput: React.FC<RetroInputProps> = ({ label, icon, style, ...props }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {icon && `${icon} `}
                {label}
            </Text>
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor={Colors.textMuted}
                {...props}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textLight,
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderTopColor: Colors.borderDark,
        borderLeftColor: Colors.borderDark,
        borderRightColor: Colors.borderLight,
        borderBottomColor: Colors.borderLight,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#000000',
    },
});