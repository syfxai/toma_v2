import React from 'react';
import type { Recipe, UiText } from '../types';
import ClockIcon from './icons/ClockIcon';
import UsersIcon from './icons/UsersIcon';

interface RecipeInfoProps {
    recipe: Pick<Recipe, 'prepTime' | 'cookTime' | 'totalTime' | 'servings'>;
    uiText: Pick<UiText, 'recipePrepTime' | 'recipeCookTime' | 'recipeTotalTime' | 'recipeServings'>;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex flex-col items-center text-center p-2">
        <div className="text-emerald-600">{icon}</div>
        <p className="mt-2 text-xs sm:text-sm font-bold uppercase text-gray-500 tracking-wider">{label}</p>
        <p className="text-sm sm:text-base font-semibold text-gray-800">{value}</p>
    </div>
);

const RecipeInfo: React.FC<RecipeInfoProps> = ({ recipe, uiText }) => {
    return (
        <div className="mb-8 py-4 bg-emerald-50/60 rounded-xl border border-emerald-200/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InfoItem icon={<ClockIcon className="w-7 h-7" />} label={uiText.recipePrepTime} value={recipe.prepTime} />
                <InfoItem icon={<ClockIcon className="w-7 h-7" />} label={uiText.recipeCookTime} value={recipe.cookTime} />
                <InfoItem icon={<ClockIcon className="w-7 h-7" />} label={uiText.recipeTotalTime} value={recipe.totalTime} />
                <InfoItem icon={<UsersIcon className="w-7 h-7" />} label={uiText.recipeServings} value={recipe.servings} />
            </div>
        </div>
    );
};

export default RecipeInfo;
