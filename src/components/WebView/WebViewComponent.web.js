import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const WebView = (props) => {
  if (props.source && props.source.uri) {
    return (
      <iframe 
        src={props.source.uri} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="autoplay; fullscreen"
      />
    );
  }
  return (
    <View style={[props.style, styles.container]}>
      <Text style={styles.text}>WebView Content</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  }
});
