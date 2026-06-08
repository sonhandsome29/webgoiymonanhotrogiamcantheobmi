import Notice from '../components/ui/Notice'
import SectionHeading from '../components/ui/SectionHeading'
import { useAppContext } from '../hooks/useAppContext'
import { api } from '../lib/api'
import { formatCurrency } from '../utils/formatters'
import { useState } from 'react'

function PricingPage() {
  const [deleteError, setDeleteError] = useState('')
  const {
    errors,
    filteredIngredients,
    handleIngredientSubmit,
    ingredientForm,
    ingredientQuery,
    isAdmin,
    loading,
    refreshIngredients,
    refreshPricing,
    resetIngredientForm,
    setIngredientForm,
    setIngredientQuery,
    language,
    t,
  } = useAppContext()

  async function handleDeleteIngredient(ingredientId) {
    try {
      setDeleteError('')
      await api.deleteIngredient(ingredientId)
      await refreshIngredients()
      await refreshPricing()
    } catch (error) {
      setDeleteError(error.message)
    }
  }

  return (
    <>
      {isAdmin ? (
        <section className="panel panel--half">
          <SectionHeading
            eyebrow={t('pricing')}
            title={language === 'vi' ? 'Cập nhật giá nguyên liệu' : 'Update ingredient pricing'}
            description={language === 'vi' ? 'Giữ chi phí nguyên liệu hiện tại để kế hoạch bữa ăn và ngân sách gia đình phản ánh giá thực tế.' : 'Keep ingredient costs current so meal plans and family budgets reflect real pricing.'}
          />

          <form className="panel-stack" onSubmit={handleIngredientSubmit}>
            <div className="field-grid field-grid--wide">
              <label className="field field--span-2">
                <span>{language === 'vi' ? 'Tên nguyên liệu' : 'Ingredient name'}</span>
                <input
                  type="text"
                  value={ingredientForm.name}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, name: event.target.value }))
                  }
                  placeholder={language === 'vi' ? 'Ví dụ: ức gà' : 'Example: chicken breast'}
                  required
                />
              </label>

              <label className="field">
                <span>{t('col_price')}</span>
                <input
                  type="number"
                  min="0"
                  value={ingredientForm.price}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, price: event.target.value }))
                  }
                  placeholder="Example 120000"
                />
              </label>

              <label className="field">
                <span>{t('col_unit')}</span>
                <input
                  type="text"
                  value={ingredientForm.unit}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, unit: event.target.value }))
                  }
                  placeholder="kg, 100g, bunch, box"
                />
              </label>

              <label className="field">
                <span>{t('col_category')}</span>
                <input
                  type="text"
                  value={ingredientForm.category}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, category: event.target.value }))
                  }
                  placeholder={language === 'vi' ? 'thịt, rau củ, gia vị' : 'meat, vegetables, seasoning'}
                />
              </label>

              <label className="field field--span-2">
                <span>{language === 'vi' ? 'URL ảnh (tùy chọn)' : 'Image URL (optional)'}</span>
                <input
                  type="text"
                  value={ingredientForm.image_url}
                  onChange={(event) =>
                    setIngredientForm((previous) => ({ ...previous, image_url: event.target.value }))
                  }
                  placeholder="/images/uc-ga.jpg"
                />
              </label>
            </div>

            {errors.ingredient ? <Notice tone="error">{errors.ingredient}</Notice> : null}

            <div className="action-row">
              <button className="primary-button" type="submit" disabled={loading.ingredient}>
                {loading.ingredient ? (language === 'vi' ? 'Đang lưu giá...' : 'Saving price...') : (language === 'vi' ? 'Lưu / cập nhật giá' : 'Save / update price')}
              </button>
              <button className="ghost-button" type="button" onClick={resetIngredientForm}>
                {language === 'vi' ? 'Xóa form' : 'Clear form'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className={isAdmin ? 'panel panel--half' : 'panel panel--full'}>
        <SectionHeading
          eyebrow={t('pricing')}
          title={language === 'vi' ? 'Giá nguyên liệu hiện tại' : 'Current ingredient pricing'}
          description={isAdmin ? (language === 'vi' ? 'Xem danh mục hiện tại trong khi cập nhật mục ở bên trái.' : 'Review the current inventory while updating items on the left.') : (language === 'vi' ? 'Duyệt qua giá nguyên liệu mới nhất được sử dụng trong các tính năng lập kế hoạch và ngân sách.' : 'Browse the latest ingredient prices used across planning and budget features.')}
        />

        <div className="panel-stack">
          {deleteError ? <Notice tone="error">{deleteError}</Notice> : null}
          <label className="field">
            <span>{language === 'vi' ? 'Tìm kiếm nhanh nguyên liệu' : 'Quick ingredient search'}</span>
            <input
              type="text"
              value={ingredientQuery}
              onChange={(event) => setIngredientQuery(event.target.value)}
              placeholder={t('search_ingredients_placeholder')}
            />
          </label>

          <div className="ingredient-list">
            {filteredIngredients.map((ingredient) => (
              <article className="price-list-row" key={ingredient._id || ingredient.name}>
                <div className="price-list-row__content">
                  <h3>{ingredient.name}</h3>
                  <p>{ingredient.category || (language === 'vi' ? 'Chưa phân loại' : 'Uncategorized')}</p>
                </div>
                <div className="price-list-row__meta">
                  <span>{ingredient.unit || 'kg'}</span>
                  <strong>{formatCurrency(ingredient.price)}</strong>
                  {isAdmin && ingredient._id ? (
                    <button className="ghost-button" type="button" onClick={() => handleDeleteIngredient(ingredient._id)}>
                      {t('delete')}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default PricingPage
