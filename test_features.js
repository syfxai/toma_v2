// Using built-in fetch (Node 18+)

async function testFeature(ingredients) {
    console.log(`\nTesting: "${ingredients}"`);
    try {
        const response = await fetch('http://localhost:3000/api/generateRecipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients })
        });
        
        if (!response.ok) {
            console.error('API Error:', response.status, await response.text());
            return;
        }

        const data = await response.json();
        console.log('--- RESULT ---');
        console.log('Recipe:', data.recipeName);
        console.log('Servings:', data.servings);
        console.log('Calories:', data.nutrition?.calories);
        console.log('Ingredients (first 3):', data.ingredients.slice(0, 3));
        console.log('Health Score:', data.nutrition?.healthScore);
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

async function runTests() {
    // Note: Server must be running for this to work
    await testFeature("ayam 200 kalori");
    await testFeature("nasi goreng untuk 100 orang");
}

runTests();
