class RecipeRepository {
  constructor(dbPool) {
    this.pool = dbPool;
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
      cuisine,
    } = recipeData;

    try {
      const query = `
                INSERT INTO recipes
                (user_id, title, description, ingredients, instructions, preparation_time, cooking_time, servings, cuisine)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
      const values = [
        userId,
        title,
        description,
        ingredients,
        instructions,
        preparation_time || null, 
        cooking_time || null,
        servings || null,
        cuisine || null,
      ];

      const [result] = await this.pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      console.error("Greška pri kreiranju recepta (createRecipe):", error);
      throw error;
    }
  }

  async getRecipeById(id) {
    try {
      const [rows] = await this.pool.execute(
        "SELECT * FROM recipes WHERE id = ?",
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error(
        "Greška pri dohvatanju recepta po ID-u (getRecipeById):",
        error
      );
      throw error;
    }
  }

  async getAllRecipesByUserId(userId, filters = {}) {
    try {
      let query = "SELECT * FROM recipes WHERE user_id = ?";
      const values = [userId];
      const filterConditions = [];
      if (filters.searchTerm) {
        const term = `%${filters.searchTerm}%`;
        filterConditions.push(
          "(title LIKE ? OR ingredients LIKE ? OR instructions LIKE ? OR cuisine LIKE ?)"
        );
        values.push(term, term, term, term);
      }

      if (filters.cuisine) {
        filterConditions.push("cuisine = ?");
        values.push(filters.cuisine);
      }

      if (filters.maxPrepTime) {
        filterConditions.push("preparation_time <= ?");
        values.push(filters.maxPrepTime);
      }

      if (filters.maxCookTime) {
        filterConditions.push("cooking_time <= ?");
        values.push(filters.maxCookTime);
      }

      if (filters.minServings) {
        filterConditions.push("servings >= ?");
        values.push(filters.minServings);
      }

      if (filterConditions.length > 0) {
        query += " AND " + filterConditions.join(" AND ");
      }

      const [rows] = await this.pool.execute(query, values);
      return rows;
    } catch (error) {
      console.error(
        "Greška pri dohvatanju recepata sa filterima (getAllRecipesByUserId):",
        error
      );
      throw error;
    }
  }

  async updateRecipe(id, recipeData) {
    try {
      const fields = [];
      const values = [];
      for (const key in recipeData) {
        if (recipeData.hasOwnProperty(key)) {
          fields.push(`${key} = ?`);
          values.push(recipeData[key]);
        }
      }
      values.push(id); 

      if (fields.length === 0) {
        return false; 
      }

      const query = `UPDATE recipes SET ${fields.join(", ")} WHERE id = ?`;
      const [result] = await this.pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Greška pri ažuriranju recepta (updateRecipe):", error);
      throw error;
    }
  }

  async deleteRecipe(id) {
    try {
      const [result] = await this.pool.execute(
        "DELETE FROM recipes WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Greška pri brisanju recepta (deleteRecipe):", error);
      throw error;
    }
  }
}
module.exports = RecipeRepository;
