import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }) => {
  const [compareList, setCompareList] = useState([]);

  useEffect(() => {
    loadCompareList();
  }, []);

  const loadCompareList = async () => {
    try {
      const stored = await AsyncStorage.getItem('pk_compare_list');
      if (stored) {
        setCompareList(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load compare list', error);
    }
  };

  const saveCompareList = async (list) => {
    try {
      await AsyncStorage.setItem('pk_compare_list', JSON.stringify(list));
    } catch (error) {
      console.error('Failed to save compare list', error);
    }
  };

  const addToCompare = (property) => {
    if (compareList.find(p => p.id === property.id)) {
      Toast.show({ type: 'info', text1: 'Already in Compare List', text2: 'This property is already selected for comparison.' });
      return;
    }
    
    if (compareList.length >= 3) {
      Toast.show({ type: 'error', text1: 'Compare Limit Reached', text2: 'You can only compare up to 3 properties at a time.' });
      return;
    }

    const newList = [...compareList, property];
    setCompareList(newList);
    saveCompareList(newList);
    Toast.show({ type: 'success', text1: 'Added to Compare', text2: 'Property added successfully.' });
  };

  const removeFromCompare = (propertyId) => {
    const newList = compareList.filter(p => p.id !== propertyId);
    setCompareList(newList);
    saveCompareList(newList);
    Toast.show({ type: 'success', text1: 'Removed from Compare', text2: 'Property removed successfully.' });
  };

  const clearCompare = () => {
    setCompareList([]);
    saveCompareList([]);
  };

  const isInCompare = (propertyId) => {
    return compareList.some(p => p.id === propertyId);
  };

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
};
