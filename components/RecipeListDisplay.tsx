import React from 'react';
import type { RecipeList, RecipeSearchResult } from '../types';

interface RecipeListDisplayProps {
  recipeList: RecipeList;
  onSelect: (recipe: RecipeSearchResult) => void;
  uiText: any;
}

const RecipeListDisplay: React.FC<RecipeListDisplayProps> = ({ recipeList, onSelect, uiText }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {uiText.searchResultsTitle || "Found Recipes"}
        </h2>
        <p className="text-gray-600">
          {uiText.searchResultsSubtitle || "Select a recipe to view details"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipeList.results.map((result, index) => (
          <button
            key={index}
            onClick={() => onSelect(result)}
            className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left border border-gray-100 hover:border-emerald-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                View Recipe →
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors pr-8">
              {result.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-3">
              {result.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecipeListDisplay;
