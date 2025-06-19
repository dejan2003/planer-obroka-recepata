class RecipeService {
    constructor(recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    async createRecipe(userId, recipeData) {
        const {
            title,
            description,
            ingredients,
            instructions,
            preparation_time, 
            cooking_time,    
            servings,
            cuisine        
        } = recipeData;

        if (!userId || !title || !ingredients || !instructions) {
            throw new Error('Naziv, sastojci i uputstva su obavezni za recept.');
        }

        return await this.recipeRepository.createRecipe(
            userId,

            {
                title,
                description,
                ingredients,
                instructions,
                preparation_time, 
                cooking_time,     
                servings,
                cuisine           
            }
        );
    }

    async getRecipeById(recipeId, userId) {
        const recipe = await this.recipeRepository.getRecipeById(recipeId);
        if (!recipe) {
            return null; 
        }
        if (recipe.user_id !== userId) {
            return null; 
        }
        return recipe;
    }

    async getAllRecipesForUser(userId, filters= {}) {
        return await this.recipeRepository.getAllRecipesByUserId(userId, filters);
    }

    async updateRecipe(recipeId, userId, updateData) {
        const existingRecipe = await this.recipeRepository.getRecipeById(recipeId);
        if (!existingRecipe || existingRecipe.user_id !== userId) {
            throw new Error('Recept nije pronađen ili nemate dozvolu za ažuriranje.');
        }
        const { title, ingredients, instructions } = updateData;
        if (!title || !ingredients || !instructions) {
            throw new Error('Naziv, sastojci i uputstva su obavezni za ažuriranje recepta.');
        }
        return await this.recipeRepository.updateRecipe(recipeId, updateData);
    }

    async deleteRecipe(recipeId, userId) {
        const existingRecipe = await this.recipeRepository.getRecipeById(recipeId);
        if (!existingRecipe || existingRecipe.user_id !== userId) {
            throw new new Error('Recept nije pronađen ili nemate dozvolu za brisanje.');
        }
        return await this.recipeRepository.deleteRecipe(recipeId);
    }
}
module.exports = RecipeService;