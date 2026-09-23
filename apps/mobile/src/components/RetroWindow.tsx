import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/styles/colors';

interface RetroWindowProps {
    title: string;
    children: ReactNode;
    style?: any;
}

export const RetroWindow: React.FC<RetroWindowProps> = ({ title, children, style }) => {
    return (
        <View style={[styles.window, style]}>
            <View style={styles.titleBar}>
                <Text style={styles.titleText}>{title}</Text>
                <View style={styles.controls}>
                    <View style={styles.controlBtn}>
                        <Text style={styles.controlText}>_</Text>
                    </View>
                    <View style={styles.controlBtn}>
                        <Text style={styles.controlText}>□</Text>
                    </View>
                    <View style={styles.controlBtn}>
                        <Text style={styles.controlText}>✕</Text>
                    </View>
                </View>
            </View>
            <View style={styles.body}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    window: {
        backgroundColor: Colors.backgroundCard,
        borderWidth: 3,
        borderTopColor: Colors.borderLight,
        borderLeftColor: Colors.borderLight,
        borderRightColor: Colors.borderDark,
        borderBottomColor: Colors.borderDark,
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 10,
    },
    titleBar: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    titleText: {
        color: Colors.textLight,
        fontSize: 12,
        fontWeight: 'bold',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    },
    controls: {
        flexDirection: 'row',
        gap: 2,
    },
    controlBtn: {
        backgroundColor: Colors.backgroundCard,
        borderWidth: 2,
        borderTopColor: Colors.borderLight,
        borderLeftColor: Colors.borderLight,
        borderRightColor: Colors.borderDark,
        borderBottomColor: Colors.borderDark,
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
        lineHeight: 12,
    },
    body: {
        padding: 16,
    },
});