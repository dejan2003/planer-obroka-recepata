class MealPlannerService {
    constructor(mealPlanRepository, recipeRepository) {
        this.mealPlanRepository = mealPlanRepository;
        this.recipeRepository = recipeRepository;
    }

    async createMealPlan(userId, planData) {
        const { name, plan_date, notes } = planData;
        if (!userId || !name || !plan_date) {
            throw new Error('Naziv i datum plana obroka su obavezni.');
        }

        return await this.mealPlanRepository.createMealPlan(userId, name, plan_date, notes);
    }

    async getMealPlanDetails(mealPlanId, userId) {
        const mealPlan = await this.mealPlanRepository.getMealPlanById(mealPlanId);
        if (!mealPlan || mealPlan.user_id !== userId) {
            return null; 
        }

        
        const recipes = await this.mealPlanRepository.getRecipesForMealPlan(mealPlanId);
        
        
        return { ...mealPlan, recipes: recipes || [] };
    }

    async getAllMealPlansForUser(userId, startDate, endDate) {
        return await this.mealPlanRepository.getMealPlansByDateRange(userId, startDate, endDate);
    }

    async updateMealPlan(mealPlanId, userId, updateData) {
        const existingPlan = await this.mealPlanRepository.getMealPlanById(mealPlanId);
        if (!existingPlan || existingPlan.user_id !== userId) {
            throw new Error('Plan obroka nije pronađen ili nemate dozvolu za ažuriranje.');
        }

        return await this.mealPlanRepository.updateMealPlan(mealPlanId, updateData);
    }

    async deleteMealPlan(mealPlanId, userId) {
        const existingPlan = await this.mealPlanRepository.getMealPlanById(mealPlanId);
        if (!existingPlan || existingPlan.user_id !== userId) {
            throw new Error('Plan obroka nije pronađen ili nemate dozvolu za brisanje.');
        }
        return await this.mealPlanRepository.deleteMealPlan(mealPlanId);
    }

    async addRecipeToMealPlan(mealPlanId, recipeId, mealType, userId) {
        const existingPlan = await this.mealPlanRepository.getMealPlanById(mealPlanId);
        if (!existingPlan || existingPlan.user_id !== userId) {
            throw new Error('Plan obroka nije pronađen ili nemate dozvolu za modifikaciju.');
        }
        const existingRecipe = await this.recipeRepository.getRecipeById(recipeId);
        if (!existingRecipe || existingRecipe.user_id !== userId) {
            throw new Error('Recept nije pronađen ili nemate dozvolu za korišćenje.');
        }
        return await this.mealPlanRepository.addRecipeToMealPlan(mealPlanId, recipeId, mealType);
    }

    async removeRecipeFromMealPlan(mealPlanId, recipeId, userId) {
        const existingPlan = await this.mealPlanRepository.getMealPlanById(mealPlanId);
        if (!existingPlan || existingPlan.user_id !== userId) {
            throw new Error('Plan obroka nije pronađen ili nemate dozvolu za modifikaciju.');
        }
        return await this.mealPlanRepository.removeRecipeFromMealPlan(mealPlanId, recipeId);
    }

    async getRecipesForMealPlan(mealPlanId, userId) {
        const mealPlan = await this.mealPlanRepository.getMealPlanById(mealPlanId);
        if (!mealPlan || mealPlan.user_id !== userId) {
            return null; 
        }
        return await this.mealPlanRepository.getRecipesForMealPlan(mealPlanId);
    }
}
module.exports = MealPlannerService;