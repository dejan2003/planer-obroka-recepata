import { Recipe } from './recipe.interface'; 

export interface MealPlan {
  id: number;
  user_id: number;
  plan_name: string;
  plan_date: string;
  recipes?: Recipe[];
  created_at?: string;
  updated_at?: string;
}