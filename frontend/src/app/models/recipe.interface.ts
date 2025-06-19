export interface Recipe {
  id?: number;
  user_id: number; 
  title: string;
  description: string;
  ingredients: string; 
  instructions: string;
  preparation_time?: number; 
  cooking_time?: number;     
  servings?: number;      
  cuisine?: string;      
  created_at?: string;
  updated_at?: string;
}