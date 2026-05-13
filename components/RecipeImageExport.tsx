
import React, { forwardRef } from 'react';
import type { Recipe, ExportImageLayout, UiText } from '../types';

interface RecipeImageExportProps {
  recipe: Recipe;
  layout?: ExportImageLayout;
  uiText: UiText;
}

const RecipeImageExport = forwardRef<HTMLDivElement, RecipeImageExportProps>(({ recipe, layout = 'desktop', uiText }, ref) => {
  const isMobile = layout === 'mobile';
  const width = isMobile ? 450 : 800;
  const padding = isMobile ? 32 : 48;

  const s = {
    container: {
      background: '#ffffff',
      color: '#1f2937',
      width: `${width}px`,
      padding: `${padding}px`,
      fontFamily: "'Segoe UI', Arial, sans-serif",
      boxSizing: 'border-box' as const,
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '28px',
    },
    title: {
      fontSize: isMobile ? '26px' : '32px',
      fontWeight: 700,
      color: '#059669',
      marginBottom: '8px',
      lineHeight: 1.2,
    },
    description: {
      fontSize: '14px',
      color: '#6b7280',
      fontStyle: 'italic',
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: 1.5,
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTop: '1px solid #e5e7eb',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 0',
      margin: '20px 0',
    },
    infoItem: {
      textAlign: 'center' as const,
    },
    infoLabel: {
      fontSize: '10px',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      color: '#9ca3af',
      letterSpacing: '0.05em',
      marginBottom: '4px',
    },
    infoValue: {
      fontSize: '13px',
      color: '#1f2937',
      fontWeight: 600,
    },
    sectionTitle: {
      fontSize: isMobile ? '16px' : '18px',
      fontWeight: 600,
      color: '#065f46',
      borderBottom: '2px solid #6ee7b7',
      paddingBottom: '6px',
      marginBottom: '12px',
    },
    listItem: {
      fontSize: '13px',
      color: '#374151',
      marginBottom: '6px',
      lineHeight: 1.5,
    },
    section: {
      marginTop: '20px',
    },
    nutritionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '8px',
      marginBottom: '16px',
    },
    nutritionCell: {
      textAlign: 'center' as const,
      padding: '8px',
      background: '#f9fafb',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
    },
    nutritionLabel: {
      fontSize: '9px',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      color: '#6b7280',
      marginBottom: '3px',
    },
    nutritionValue: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#111827',
    },
    microGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      fontSize: '11px',
    },
    microLabel: {
      fontWeight: 700,
      color: '#059669',
      marginBottom: '3px',
    },
    microValue: {
      color: '#6b7280',
      lineHeight: 1.4,
    },
    healthTip: {
      marginTop: '12px',
      padding: '10px 14px',
      background: '#ecfdf5',
      borderRadius: '8px',
      color: '#065f46',
      fontSize: '12px',
      fontWeight: 500,
      border: '1px solid #d1fae5',
    },
    disclaimer: {
      marginTop: '8px',
      fontSize: '10px',
      color: '#9ca3af',
      fontStyle: 'italic',
      textAlign: 'center' as const,
    },
    footer: {
      marginTop: '28px',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb',
      textAlign: 'center' as const,
    },
    footerTitle: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#059669',
    },
    footerSub: {
      fontSize: '12px',
      color: '#9ca3af',
      marginTop: '4px',
    },
  };

  return (
    <div ref={ref} style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>{recipe.recipeName}</div>
        <div style={s.description}>{recipe.description}</div>
      </div>

      {/* Info Row */}
      <div style={s.infoRow}>
        <div style={s.infoItem}>
          <div style={s.infoLabel}>{uiText.recipePrepTime}</div>
          <div style={s.infoValue}>{recipe.prepTime}</div>
        </div>
        <div style={s.infoItem}>
          <div style={s.infoLabel}>{uiText.recipeCookTime}</div>
          <div style={s.infoValue}>{recipe.cookTime}</div>
        </div>
        <div style={s.infoItem}>
          <div style={s.infoLabel}>{uiText.recipeTotalTime}</div>
          <div style={s.infoValue}>{recipe.totalTime}</div>
        </div>
        <div style={s.infoItem}>
          <div style={s.infoLabel}>{uiText.recipeServings}</div>
          <div style={s.infoValue}>{recipe.servings}</div>
        </div>
      </div>

      {/* Ingredients */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{uiText.recipeIngredients}</div>
        <ul style={{ listStyle: 'disc', paddingLeft: '18px', margin: 0 }}>
          {recipe.ingredients.map((ing, i) => (
            <li key={i} style={s.listItem}>{ing}</li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div style={s.section}>
        <div style={s.sectionTitle}>{uiText.recipeInstructions}</div>
        <ol style={{ listStyle: 'decimal', paddingLeft: '18px', margin: 0 }}>
          {recipe.instructions.map((step, i) => (
            <li key={i} style={s.listItem}>{step}</li>
          ))}
        </ol>
      </div>

      {/* Nutrition */}
      {recipe.nutrition && (
        <div style={{ ...s.section, marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={s.sectionTitle}>{uiText.nutritionTitle}</div>
          <div style={s.nutritionGrid}>
            {[
              { label: uiText.caloriesLabel, value: recipe.nutrition.calories },
              { label: uiText.proteinLabel, value: recipe.nutrition.protein },
              { label: uiText.fatLabel, value: recipe.nutrition.fat },
              { label: uiText.carbsLabel, value: recipe.nutrition.carbohydrates },
            ].map(({ label, value }) => (
              <div key={label} style={s.nutritionCell}>
                <div style={s.nutritionLabel}>{label}</div>
                <div style={s.nutritionValue}>{value}</div>
              </div>
            ))}
          </div>

          <div style={s.microGrid}>
            {recipe.nutrition.vitamins.length > 0 && (
              <div>
                <div style={s.microLabel}>{uiText.vitaminsLabel}</div>
                <div style={s.microValue}>{recipe.nutrition.vitamins.join(', ')}</div>
              </div>
            )}
            {recipe.nutrition.minerals.length > 0 && (
              <div>
                <div style={s.microLabel}>{uiText.mineralsLabel}</div>
                <div style={s.microValue}>{recipe.nutrition.minerals.join(', ')}</div>
              </div>
            )}
            {recipe.nutrition.others.length > 0 && (
              <div>
                <div style={s.microLabel}>{uiText.othersLabel}</div>
                <div style={s.microValue}>{recipe.nutrition.others.join(', ')}</div>
              </div>
            )}
          </div>

          <div style={s.healthTip}>
            {recipe.nutrition.healthScore === 'healthy' ? uiText.healthyTip : uiText.unhealthyTip}
          </div>
          <div style={s.disclaimer}>{uiText.nutritionDisclaimer}</div>
        </div>
      )}

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerTitle}>🍅 Toma</div>
        <div style={s.footerSub}>{uiText.tagline}</div>
        <div style={{ ...s.footerSub, marginTop: '2px' }}>Toma AI recipe generator by Syafiq Haron</div>
      </div>
    </div>
  );
});

RecipeImageExport.displayName = 'RecipeImageExport';

export default RecipeImageExport;