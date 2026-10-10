import React, { useState } from 'react';
import { ChevronLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Category } from '../../types';

export const CategoryModal: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, setActiveScreen } = useApp();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [nameInput, setNameInput] = useState('');
  const [colorInput, setColorInput] = useState('#1479F5');

  const colorPalette = [
    '#1479F5', // Blue
    '#10B981', // Green
    '#F97316', // Orange
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#EAB308', // Yellow
    '#06B6D4', // Cyan
    '#64748B', // Gray
  ];

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setNameInput(cat.name);
    setColorInput(cat.color);
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setNameInput('');
    setColorInput('#1479F5');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    if (isCreating) {
      await addCategory({
        name: nameInput.trim(),
        color: colorInput,
        bgColor: colorInput + '18', // ~10% opacity soft bg
      });
      setIsCreating(false);
    } else if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: nameInput.trim(),
        color: colorInput,
        bgColor: colorInput + '18',
      });
      setEditingCategory(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this category? Associated tasks will be kept.')) {
      await deleteCategory(id);
      setEditingCategory(null);
    }
  };

  return (
    <div className="relative mx-auto max-w-3xl space-y-4 animate-slide-up text-slate-800">

      {/* Screen Header matching Screen 8 */}
      <div className="w-full flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveScreen('settings')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Manage Categories
        </h2>
        <button
          onClick={handleOpenCreate}
          className="w-10 h-10 rounded-full flex items-center justify-center text-brand-500 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
          title="Add Category"
        >
          <Plus size={22} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Category List */}
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700/60 shadow-xs"
          >
            <div className="flex items-center space-x-3.5">
              <span
                className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-800"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {cat.name}
              </span>
            </div>

            <button
              onClick={() => handleOpenEdit(cat)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Dialog */}
      {(isCreating || editingCategory) && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-fade-in">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-t-3xl p-5 shadow-modal">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isCreating ? 'Create Category' : `Edit "${editingCategory?.name}"`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingCategory(null);
                }}
                className="text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Fitness"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Color
                </label>
                <div className="flex items-center space-x-3">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColorInput(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        colorInput === color ? 'scale-125 ring-2 ring-offset-2 ring-brand-500' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              {editingCategory && !editingCategory.isDefault && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingCategory.id)}
                  className="p-3 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100"
                  title="Delete Category"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-brand-500 text-white font-bold text-xs shadow-float"
              >
                {isCreating ? 'Create Category' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
