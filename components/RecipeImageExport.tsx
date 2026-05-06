
import React, { forwardRef } from 'react';
import type { Recipe, ExportImageLayout, UiText } from '../types';
import ClockIcon from './icons/ClockIcon';
import UsersIcon from './icons/UsersIcon';

interface RecipeImageExportProps {
  recipe: Recipe;
  layout?: ExportImageLayout;
  uiText: UiText;
}

const RecipeInfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center text-center">
    <div className="text-emerald-600">{icon}</div>
    <p className="mt-1 text-xs font-bold uppercase text-gray-500 tracking-wider">{label}</p>
    <p className="text-sm text-gray-800">{value}</p>
  </div>
);

const RecipeImageExport = forwardRef<HTMLDivElement, RecipeImageExportProps>(({ recipe, layout = 'desktop', uiText }, ref) => {
  const isMobile = layout === 'mobile';

  const getContainerClasses = () => {
    const baseClasses = "bg-white text-gray-800";
    if (isMobile) {
      return `${baseClasses} w-[450px] p-8`;
    }
    // Desktop image export
    return `${baseClasses} w-[800px] p-12`;
  };
  const containerClasses = getContainerClasses();

  const titleClasses = isMobile
    ? "text-3xl"
    : "text-4xl";
  const sectionTitleClasses = isMobile
    ? "text-xl"
    : "text-2xl";

  return (
    <div 
      ref={ref} 
      className={containerClasses}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="text-center mb-8">
        <h1 className={`font-bold text-emerald-700 mb-2 ${titleClasses}`}>{recipe.recipeName}</h1>
        <p className="text-gray-600 italic max-w-2xl mx-auto">{recipe.description}</p>
      </div>

      <div className="my-8 py-4 border-y border-gray-200 flex justify-around items-center">
        <RecipeInfoItem icon={<ClockIcon className="w-6 h-6" />} label={uiText.recipePrepTime} value={recipe.prepTime} />
        <RecipeInfoItem icon={<ClockIcon className="w-6 h-6" />} label={uiText.recipeCookTime} value={recipe.cookTime} />
        <RecipeInfoItem icon={<UsersIcon className="w-6 h-6" />} label={uiText.recipeServings} value={recipe.servings} />
      </div>

      <div>
        <h2 className={`font-semibold mb-4 border-b-2 border-emerald-300 pb-2 text-emerald-800 ${sectionTitleClasses}`}>{uiText.recipeIngredients}</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={`ing-${index}`}>{ingredient}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
          <h2 className={`font-semibold mb-4 border-b-2 border-emerald-300 pb-2 text-emerald-800 ${sectionTitleClasses}`}>{uiText.recipeInstructions}</h2>
          <ol className="list-decimal list-outside space-y-2 text-gray-700 text-sm leading-relaxed pl-4">
              {recipe.instructions.map((step, index) => (
                  <li key={`inst-${index}`}>{step}</li>
              ))}
          </ol>
      </div>

      {recipe.nutrition && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className={`font-semibold mb-4 text-emerald-800 ${sectionTitleClasses}`}>{uiText.nutritionTitle}</h2>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
              <p className="text-[10px] font-bold uppercase text-gray-500">{uiText.caloriesLabel}</p>
              <p className="text-sm font-bold">{recipe.nutrition.calories}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
              <p className="text-[10px] font-bold uppercase text-gray-500">{uiText.proteinLabel}</p>
              <p className="text-sm font-bold">{recipe.nutrition.protein}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
              <p className="text-[10px] font-bold uppercase text-gray-500">{uiText.fatLabel}</p>
              <p className="text-sm font-bold">{recipe.nutrition.fat}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded border border-gray-100">
              <p className="text-[10px] font-bold uppercase text-gray-500">{uiText.carbsLabel}</p>
              <p className="text-sm font-bold">{recipe.nutrition.carbohydrates}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            {recipe.nutrition.vitamins.length > 0 && (
              <div>
                <p className="font-bold text-emerald-700 mb-1">{uiText.vitaminsLabel}</p>
                <p className="text-gray-600 leading-tight">{recipe.nutrition.vitamins.join(', ')}</p>
              </div>
            )}
            {recipe.nutrition.minerals.length > 0 && (
              <div>
                <p className="font-bold text-emerald-700 mb-1">{uiText.mineralsLabel}</p>
                <p className="text-gray-600 leading-tight">{recipe.nutrition.minerals.join(', ')}</p>
              </div>
            )}
            {recipe.nutrition.others.length > 0 && (
              <div>
                <p className="font-bold text-emerald-700 mb-1">{uiText.othersLabel}</p>
                <p className="text-gray-600 leading-tight">{recipe.nutrition.others.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-emerald-800 text-xs font-medium border border-emerald-100">
             {recipe.nutrition.healthScore === 'healthy' ? uiText.healthyTip : uiText.unhealthyTip}
          </div>
          
          <p className="mt-2 text-[10px] text-gray-400 italic text-center">
            {uiText.nutritionDisclaimer}
          </p>
        </div>
      )}

      <div className="mt-8 pt-4 text-center border-t border-gray-200">
        <h3 className="text-2xl font-bold text-emerald-700 flex items-center justify-center gap-2">
            <span>🍅</span>
            <span>Toma</span>
        </h3>
        <p className="text-gray-500 text-sm mt-1">{uiText.tagline}</p>
        <p className="text-xs text-gray-500 mt-2">
          Toma AI recipe generator by Syafiq Haron
        </p>
      </div>
    </div>
  );
});

export default RecipeImageExport;