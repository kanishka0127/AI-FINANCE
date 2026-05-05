import { ref, set, get } from 'firebase/database';
import { db } from '../lib/firebase';
import categoriesData from '../../import.json';

export const initializeCategories = async () => {
  try {
    console.log('Checking categories in database...');
    const categoriesRef = ref(db, 'categories');
    const snapshot = await get(categoriesRef);
    
    if (!snapshot.exists()) {
      console.log('No categories found, initializing...');
      await set(categoriesRef, categoriesData.categories);
      console.log('Categories initialized successfully!');
      return true;
    } else {
      console.log('Categories already exist, count:', Object.keys(snapshot.val()).length);
      return true;
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
    // Don't fail completely, just log the error
    console.log('Continuing without category initialization...');
    return true; // Return true to continue app initialization
  }
};
