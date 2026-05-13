
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
    <div style={{ color: '#059669' }}>{icon}</div>
    <p className="mt-1 text-xs font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</p>
    <p className="text-sm" style={{ color: '#1f2937' }}>{value}</p>
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
        <h1 className={`font-bold mb-2 ${titleClasses}`} style={{ color: '#047857' }}>{recipe.recipeName}</h1>
        <p className="italic max-w-2xl mx-auto" style={{ color: '#4b5563' }}>{recipe.description}</p>
      </div>

      <div className="my-8 py-4 flex justify-around items-center" style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <RecipeInfoItem icon={<ClockIcon className="w-6 h-6" />} label={uiText.recipePrepTime} value={recipe.prepTime} />
        <RecipeInfoItem icon={<ClockIcon className="w-6 h-6" />} label={uiText.recipeCookTime} value={recipe.cookTime} />
        <RecipeInfoItem icon={<UsersIcon className="w-6 h-6" />} label={uiText.recipeServings} value={recipe.servings} />
      </div>

      <div>
        <h2 className={`font-semibold mb-4 pb-2 ${sectionTitleClasses}`} style={{ color: '#065f46', borderBottom: '2px solid #6ee7b7' }}>{uiText.recipeIngredients}</h2>
        <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: '#374151' }}>
          {recipe.ingredients.map((ingredient, index) => (
            <li key={`ing-${index}`}>{ingredient}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
          <h2 className={`font-semibold mb-4 pb-2 ${sectionTitleClasses}`} style={{ color: '#065f46', borderBottom: '2px solid #6ee7b7' }}>{uiText.recipeInstructions}</h2>
          <ol className="list-decimal list-outside space-y-2 text-sm leading-relaxed pl-4" style={{ color: '#374151' }}>
              {recipe.instructions.map((step, index) => (
                  <li key={`inst-${index}`}>{step}</li>
              ))}
          </ol>
      </div>

      {recipe.nutrition && (
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid #e5e7eb' }}>
          <h2 className={`font-semibold mb-4 ${sectionTitleClasses}`} style={{ color: '#065f46' }}>{uiText.nutritionTitle}</h2>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-2 rounded border" style={{ backgroundColor: '#f9fafb', borderColor: '#f1f5f9' }}>
              <p className="text-[10px] font-bold uppercase" style={{ color: '#6b7280' }}>{uiText.caloriesLabel}</p>
              <p className="text-sm font-bold" style={{ color: '#1f2937' }}>{recipe.nutrition.calories}</p>
            </div>
            <div className="text-center p-2 rounded border" style={{ backgroundColor: '#f9fafb', borderColor: '#f1f5f9' }}>
              <p className="text-[10px] font-bold uppercase" style={{ color: '#6b7280' }}>{uiText.proteinLabel}</p>
              <p className="text-sm font-bold" style={{ color: '#1f2937' }}>{recipe.nutrition.protein}</p>
            </div>
            <div className="text-center p-2 rounded border" style={{ backgroundColor: '#f9fafb', borderColor: '#f1f5f9' }}>
              <p className="text-[10px] font-bold uppercase" style={{ color: '#6b7280' }}>{uiText.fatLabel}</p>
              <p className="text-sm font-bold" style={{ color: '#1f2937' }}>{recipe.nutrition.fat}</p>
            </div>
            <div className="text-center p-2 rounded border" style={{ backgroundColor: '#f9fafb', borderColor: '#f1f5f9' }}>
              <p className="text-[10px] font-bold uppercase" style={{ color: '#6b7280' }}>{uiText.carbsLabel}</p>
              <p className="text-sm font-bold" style={{ color: '#1f2937' }}>{recipe.nutrition.carbohydrates}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            {recipe.nutrition.vitamins.length > 0 && (
              <div>
                <p className="font-bold mb-1" style={{ color: '#047857' }}>{uiText.vitaminsLabel}</p>
                <p className="leading-tight" style={{ color: '#4b5563' }}>{recipe.nutrition.vitamins.join(', ')}</p>
              </div>
            )}
            {recipe.nutrition.minerals.length > 0 && (
              <div>
                <p className="font-bold mb-1" style={{ color: '#047857' }}>{uiText.mineralsLabel}</p>
                <p className="leading-tight" style={{ color: '#4b5563' }}>{recipe.nutrition.minerals.join(', ')}</p>
              </div>
            )}
            {recipe.nutrition.others.length > 0 && (
              <div>
                <p className="font-bold mb-1" style={{ color: '#047857' }}>{uiText.othersLabel}</p>
                <p className="leading-tight" style={{ color: '#4b5563' }}>{recipe.nutrition.others.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 rounded-lg text-xs font-medium border" style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#d1fae5' }}>
             {recipe.nutrition.healthScore === 'healthy' ? uiText.healthyTip : uiText.unhealthyTip}
          </div>
          
          <p className="mt-2 text-[10px] italic text-center" style={{ color: '#9ca3af' }}>
            {uiText.nutritionDisclaimer}
          </p>
        </div>
      )}

      <div className="mt-8 pt-4 text-center" style={{ borderTop: '1px solid #e5e7eb' }}>
        <h3 className="text-2xl font-bold flex items-center justify-center gap-2" style={{ color: '#047857' }}>
            <span>🍅</span>
            <span>Toma</span>
        </h3>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{uiText.tagline}</p>
        <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
          Toma AI recipe generator by Syafiq Haron
        </p>
      </div>
    </div>
  );
});

export default RecipeImageExport;