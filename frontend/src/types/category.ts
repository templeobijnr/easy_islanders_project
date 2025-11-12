/**
 * Category types - define the structure of categories and their schemas
 */

export interface SchemaField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multi-select' | 'date' | 'textarea' | 'email' | 'tel';
  label: string;
  placeholder?: string;
  required?: boolean;
  required_if?: string; // Conditional requirement
  choices?: string[] | Array<{ value: string; label: string }>;
  help_text?: string;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface CategorySchema {
  fields: SchemaField[];
  sections?: Array<{
    name: string;
    title: string;
    fields: string[]; // field names in this section
  }>;
}

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
  category?: string; // category ID or slug
}

export interface Category {
  id: string; // UUID
  name: string;
  slug: string;
  description?: string;
  icon?: string; // Lucide icon name
  color?: string; // Hex color code
  schema: CategorySchema;
  is_bookable: boolean;
  is_active: boolean;
  is_featured_category?: boolean;
  display_order?: number;
  subcategories?: SubCategory[];
  created_at?: string;
  updated_at?: string;
}

export interface CategoriesResponse {
  categories: Category[];
  count: number;
}

export interface SubCategoriesResponse {
  subcategories: SubCategory[];
  category: {
    id: string;
    slug: string;
    name: string;
  };
  count: number;
}
