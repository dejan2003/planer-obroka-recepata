class MealPlanRepository {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    async createMealPlan(userId, name, planDate, notes) {
        try {
            const [result] = await this.pool.execute(
                'INSERT INTO meal_plans (user_id, name, plan_date, notes) VALUES (?, ?, ?, ?)',
                [userId, name, planDate, notes]
            );
            return result.insertId;
        } catch (error) {
            console.error('Greška pri kreiranju plana obroka (createMealPlan):', error);
            throw error;
        }
    }

    async getMealPlanById(id) {
        try {
            const [rows] = await this.pool.execute('SELECT * FROM meal_plans WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            console.error('Greška pri dohvatanju plana obroka po ID-u (getMealPlanById):', error);
            throw error;
        }
    }

    async getAllMealPlansByUserId(userId) {
        try {
            const [rows] = await this.pool.execute('SELECT * FROM meal_plans WHERE user_id = ?', [userId]);
            return rows;
        } catch (error) {
            console.error('Greška pri dohvatanju svih planova obroka za korisnika (getAllMealPlansByUserId):', error);
            throw error;
        }
    }

    async getMealPlansByDateRange(userId, startDate, endDate) {
        try {
            let query = 'SELECT * FROM meal_plans WHERE user_id = ?';
            const params = [userId];

            if (startDate) {
                query += ' AND plan_date >= ?';
                params.push(startDate);
            }
            if (endDate) {
                query += ' AND plan_date <= ?';
                params.push(endDate);
            }
            query += ' ORDER BY plan_date ASC'; 

            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Greška pri dohvatanju planova obroka po datumu (getMealPlansByDateRange):', error);
            throw error;
        }
    }

    async updateMealPlan(id, planData) {
        try {
            const fields = [];
            const values = [];
            for (const key in planData) {
                if (planData.hasOwnProperty(key)) {
                    fields.push(`${key} = ?`);
                    values.push(planData[key]);
                }
            }
            values.push(id);

            if (fields.length === 0) {
                return false; 
            }

            const query = `UPDATE meal_plans SET ${fields.join(', ')} WHERE id = ?`;
            const [result] = await this.pool.execute(query, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Greška pri ažuriranju plana obroka (updateMealPlan):', error);
            throw error;
        }
    }

    async deleteMealPlan(id) {
        try {
            const [result] = await this.pool.execute('DELETE FROM meal_plans WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Greška pri brisanju plana obroka (deleteMealPlan):', error);
            throw error;
        }
    }

    async addRecipeToMealPlan(mealPlanId, recipeId, mealType) {
        try {
            const [result] = await this.pool.execute(
                'INSERT INTO meal_plan_recipes (meal_plan_id, recipe_id, meal_type) VALUES (?, ?, ?)',
                [mealPlanId, recipeId, mealType]
            );
            return result.insertId;
        } catch (error) {
            console.error('Greška pri dodavanju recepta u plan obroka (addRecipeToMealPlan):', error);
            throw error;
        }
    }

    async getRecipesForMealPlan(mealPlanId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT r.*, mpr.meal_type
                 FROM meal_plan_recipes mpr
                 JOIN recipes r ON mpr.recipe_id = r.id
                 WHERE mpr.meal_plan_id = ?`,
                [mealPlanId]
            );
            return rows;
        } catch (error) {
            console.error('Greška pri dohvatanju recepata za plan obroka (getRecipesForMealPlan):', error);
            throw error;
        }
    }

    async removeRecipeFromMealPlan(mealPlanId, recipeId) {
        try {
            const [result] = await this.pool.execute(
                'DELETE FROM meal_plan_recipes WHERE meal_plan_id = ? AND recipe_id = ?',
                [mealPlanId, recipeId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Greška pri brisanju recepta iz plana obroka (removeRecipeFromMealPlan):', error);
            throw error;
        }
    }
}
module.exports = MealPlanRepository;