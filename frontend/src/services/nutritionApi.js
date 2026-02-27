// services/nutritionApi.js
import axios from 'axios';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
// Try both REACT_APP_USDA_API_KEY and USDA_API_KEY for flexibility
const API_KEY = process.env.REACT_APP_USDA_API_KEY || process.env.USDA_API_KEY;

const fetchFoodData = async (foodQuery) => {
  // Check if API key is missing
  if (!API_KEY) {
    console.error('USDA API Key is missing. Please set REACT_APP_USDA_API_KEY in your .env file');
    return { 
      name: 'API Key Missing', 
      calories: 0, 
      protein: 0, 
      carbs: 0, 
      fats: 0,
      error: 'Please configure USDA_API_KEY in your environment variables. Get one at https://api.nal.usda.gov'
    };
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        query: foodQuery,
        api_key: API_KEY,
      },
    });

    // Check if foods array exists and has items
    if (!response.data.foods || response.data.foods.length === 0) {
      return { name: 'Food not found', calories: 0, protein: 0, carbs: 0, fats: 0 };
    }

    const food = response.data.foods[0];

    if (!food || !food.foodNutrients) {
      return { name: 'Food not found', calories: 0, protein: 0, carbs: 0, fats: 0 };
    }

    const nutrients = food.foodNutrients;

    // Extract nutrients
    const energyNutrient = nutrients.find(n =>
      n.nutrientId === 1008 || n.nutrientName === 'Energy' || n.nutrientName === 'Energy (kcal)'
    );

    const proteinNutrient = nutrients.find(n =>
      n.nutrientId === 1003 || n.nutrientName === 'Protein'
    );

    const carbsNutrient = nutrients.find(n =>
      n.nutrientId === 1005 || 
      n.nutrientName === 'Carbohydrate, by difference' ||
      n.nutrientName === 'Carbohydrate'
    );

    const fatNutrient = nutrients.find(n =>
      n.nutrientId === 1004 || 
      n.nutrientName === 'Total lipid (fat)' ||
      n.nutrientName === 'Fat'
    );

    return {
      name: food.description || 'Unknown Food',
      calories: energyNutrient?.value || 0,
      protein: proteinNutrient?.value || 0,
      carbs: carbsNutrient?.value || 0,
      fats: fatNutrient?.value || 0,
      servingSize: food.servingSize || null,
      servingSizeUnit: food.servingSizeUnit || null,
    };

  } catch (error) {
    console.error('Error fetching food data:', error);

    // Handle API key errors specifically
    if (error.response?.data?.error?.includes('api_key') || 
        error.response?.data?.error?.includes('API_KEY_MISSING')) {
      return { 
        name: 'API Key Error', 
        calories: 0, 
        protein: 0, 
        carbs: 0, 
        fats: 0,
        error: 'USDA API key is missing or invalid. Please check your REACT_APP_USDA_API_KEY environment variable.'
      };
    }

    return { 
      name: 'Error fetching data', 
      calories: 0, 
      protein: 0, 
      carbs: 0, 
      fats: 0,
      error: error.response?.data?.error || error.message || 'Failed to fetch food data'
    };
  }
};

export { fetchFoodData };
