import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MapView = (props) => (
  <View style={[props.style, styles.container]}>
    <Text style={styles.text}>Map is not supported on Web.</Text>
  </View>
);

export const Marker = () => null;
export const Polyline = () => null;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Raleway_500Medium',
  }
});
