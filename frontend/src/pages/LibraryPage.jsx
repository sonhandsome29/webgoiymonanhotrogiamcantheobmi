import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MealCard from '../components/cards/MealCard'
import MealDetailModal from '../components/ui/MealDetailModal'
import Notice from '../components/ui/Notice'
import SectionHeading from '../components/ui/SectionHeading'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { useAppContext } from '../hooks/useAppContext'
import { api } from '../lib/api'
import { formatNumber, getGroupLabel, resolveGroupKey } from '../utils/formatters'

const initialMealForm = {
  name: '',
  group: '',
  calories: '',
  protein: '',
  fat: '',
  carbs: '',
  image_url: '',
  instructions: '',
  ingredients: '',
}

function LibraryPage() {
  const [searchParams] = useSearchParams()
  const {
    filteredMeals,
    isAdmin,
    mealGroup,
    mealGroups,
    mealQuery,
    meals,
    refreshMeals,
    setMealGroup,
    setMealQuery,
    language,
    t
  } = useAppContext()
  const [mealForm, setMealForm] = useState(initialMealForm)
  const [mealActionError, setMealActionError] = useState('')
  const [mealActionLoading, setMealActionLoading] = useState(false)
  const [editingMealId, setEditingMealId] = useState('')
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [mealGroupMode, setMealGroupMode] = useState('existing')
  const [customMealGroup, setCustomMealGroup] = useState('')

  useEffect(() => {
    const searchValue = searchParams.get('search') || ''
    const groupValue = searchParams.get('group') || 'all'
    const mealId = searchParams.get('meal') || ''

    setMealQuery(searchValue)
    setMealGroup(groupValue === 'all' ? 'all' : resolveGroupKey(groupValue))

    if (mealId) {
      const matchedMeal = meals.find((meal) => meal._id === mealId || meal.name === mealId)
      setSelectedMeal(matchedMeal || null)
    } else {
      setSelectedMeal(null)
    }
  }, [meals, searchParams, setMealGroup, setMealQuery])

  const adminPreviewMeals = useMemo(() => filteredMeals.slice(0, 12), [filteredMeals])

  function handleMealFormChange(field, value) {
    setMealForm((previous) => ({ ...previous, [field]: value }))
  }

  function handleEditMeal(meal) {
    setEditingMealId(meal._id)
    const existingGroup = mealGroups.includes(meal.group)
    setMealGroupMode(existingGroup ? 'existing' : 'custom')
    setCustomMealGroup(existingGroup ? '' : meal.group || '')
    setMealForm({
      name: meal.name || '',
      group: meal.group || '',
      calories: String(meal.calories || ''),
      protein: String(meal.protein || ''),
      fat: String(meal.fat || ''),
      carbs: String(meal.carbs || ''),
      image_url: meal.image_url || '',
      instructions: meal.instructions || '',
      ingredients: (meal.ingredients || []).join('\n'),
    })
  }

  function resetMealForm() {
    setEditingMealId('')
    setMealForm(initialMealForm)
    setMealActionError('')
    setMealGroupMode('existing')
    setCustomMealGroup('')
  }

  async function handleMealSubmit(event) {
    event.preventDefault()
    setMealActionLoading(true)
    setMealActionError('')

    const payload = {
      ...mealForm,
      group: mealGroupMode === 'custom' ? customMealGroup.trim() : mealForm.group,
      calories: Number(mealForm.calories) || 0,
      protein: Number(mealForm.protein) || 0,
      fat: Number(mealForm.fat) || 0,
      carbs: Number(mealForm.carbs) || 0,
      ingredients: mealForm.ingredients
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    }

    try {
      if (editingMealId) {
        await api.updateMeal(editingMealId, payload)
      } else {
        await api.createMeal(payload)
      }

      await refreshMeals()
      resetMealForm()
    } catch (error) {
      setMealActionError(error.message)
    } finally {
      setMealActionLoading(false)
    }
  }

  async function handleDeleteMeal(mealId) {
    setMealActionLoading(true)
    setMealActionError('')

    try {
      await api.deleteMeal(mealId)
      await refreshMeals()

      if (editingMealId === mealId) {
        resetMealForm()
      }
    } catch (error) {
      setMealActionError(error.message)
    } finally {
      setMealActionLoading(false)
    }
  }

  if (isAdmin) {
    return (
      <>
        <section className="panel panel--half">
          <SectionHeading
            eyebrow={language === 'vi' ? 'Quản lý món ăn' : 'Meal management'}
            title={editingMealId ? (language === 'vi' ? 'Chỉnh sửa món ăn' : 'Edit meal') : (language === 'vi' ? 'Tạo món ăn mới' : 'Create a new meal')}
            description={language === 'vi' ? 'Duy trì danh mục chính xác để các tính năng lập thực đơn, lịch sử và ngân sách gia đình hoạt động ổn định.' : 'Keep the catalog accurate so planner, history, and family-budget features stay useful.'}
          />

          <form className="panel-stack planner-form-card" onSubmit={handleMealSubmit}>
            <div className="field-grid field-grid--wide">
              <label className="field field--span-2">
                <span>{language === 'vi' ? 'Tên món ăn' : 'Meal name'}</span>
                <input type="text" value={mealForm.name} onChange={(event) => handleMealFormChange('name', event.target.value)} required />
              </label>

              <label className="field">
                <span>{language === 'vi' ? 'Nhóm món ăn' : 'Meal group'}</span>
                <select
                  value={mealGroupMode === 'custom' ? '__other__' : mealForm.group}
                  onChange={(event) => {
                    const nextValue = event.target.value

                    if (nextValue === '__other__') {
                      setMealGroupMode('custom')
                      if (!customMealGroup) setCustomMealGroup(mealForm.group || '')
                    } else {
                      setMealGroupMode('existing')
                      setCustomMealGroup('')
                      handleMealFormChange('group', nextValue)
                    }
                  }}
                  required
                >
                  <option value="" disabled>
                    {language === 'vi' ? 'Chọn nhóm món' : 'Select a group'}
                  </option>
                  {mealGroups.map((group) => (
                    <option key={group} value={group}>
                      {getGroupLabel(group)}
                    </option>
                  ))}
                  <option value="__other__">{language === 'vi' ? 'Khác (tùy chỉnh)' : 'Other (custom)'}</option>
                </select>
              </label>

              {mealGroupMode === 'custom' ? (
                <label className="field">
                  <span>{language === 'vi' ? 'Tên nhóm tùy chỉnh' : 'Custom group name'}</span>
                  <input
                    type="text"
                    value={customMealGroup}
                    onChange={(event) => setCustomMealGroup(event.target.value)}
                    placeholder={language === 'vi' ? 'Ví dụ: sinh tố' : 'Example: smoothies'}
                    required
                  />
                </label>
              ) : null}

              <label className="field">
                <span>{language === 'vi' ? 'Lượng Calo (kcal)' : 'Calories'}</span>
                <input type="number" value={mealForm.calories} onChange={(event) => handleMealFormChange('calories', event.target.value)} />
              </label>

              <label className="field">
                <span>{language === 'vi' ? 'Đạm (Protein)' : 'Protein'}</span>
                <input type="number" value={mealForm.protein} onChange={(event) => handleMealFormChange('protein', event.target.value)} />
              </label>

              <label className="field">
                <span>{language === 'vi' ? 'Béo (Fat)' : 'Fat'}</span>
                <input type="number" value={mealForm.fat} onChange={(event) => handleMealFormChange('fat', event.target.value)} />
              </label>

              <label className="field">
                <span>Carbs</span>
                <input type="number" value={mealForm.carbs} onChange={(event) => handleMealFormChange('carbs', event.target.value)} />
              </label>

              <label className="field field--span-2">
                <span>{language === 'vi' ? 'Đường dẫn ảnh' : 'Image URL'}</span>
                <input type="text" value={mealForm.image_url} onChange={(event) => handleMealFormChange('image_url', event.target.value)} />
              </label>

              <label className="field field--span-2">
                <span>{language === 'vi' ? 'Hướng dẫn nấu nướng' : 'Instructions'}</span>
                <textarea rows="4" value={mealForm.instructions} onChange={(event) => handleMealFormChange('instructions', event.target.value)} />
              </label>

              <label className="field field--span-2">
                <span>{language === 'vi' ? 'Nguyên liệu (mỗi nguyên liệu một dòng)' : 'Ingredients (one item per line)'}</span>
                <textarea rows="6" value={mealForm.ingredients} onChange={(event) => handleMealFormChange('ingredients', event.target.value)} />
              </label>
            </div>

            {mealActionError ? <Notice tone="error">{mealActionError}</Notice> : null}

            <div className="action-row">
              <button className="primary-button" disabled={mealActionLoading} type="submit">
                {mealActionLoading ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : editingMealId ? (language === 'vi' ? 'Cập nhật món' : 'Update meal') : (language === 'vi' ? 'Tạo món' : 'Create meal')}
              </button>
              <button className="ghost-button" type="button" onClick={resetMealForm}>
                {language === 'vi' ? 'Đặt lại form' : 'Reset form'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel panel--half">
          <SectionHeading
            eyebrow={language === 'vi' ? 'Kho món ăn' : 'Meal inventory'}
            title={language === 'vi' ? `Có ${formatNumber(meals.length)} món ăn trong hệ thống` : `${formatNumber(meals.length)} meals currently in the system`}
            description={language === 'vi' ? 'Tìm kiếm danh mục hiện tại, mở món ăn để chỉnh sửa hoặc xóa món ăn không còn cần thiết.' : 'Search the current catalog, open a meal for editing, or remove entries that are no longer needed.'}
          />

          <div className="field-grid field-grid--wide family-form-card">
            <label className="field field--span-2">
              <span>{language === 'vi' ? 'Tìm nhanh món ăn' : 'Quick meal search'}</span>
              <input type="text" value={mealQuery} onChange={(event) => setMealQuery(event.target.value)} placeholder={language === 'vi' ? 'Nhập tên món ăn cần tìm' : 'Search a meal to edit'} />
            </label>

            <label className="field">
              <span>{language === 'vi' ? 'Nhóm món ăn' : 'Meal group'}</span>
              <select value={mealGroup} onChange={(event) => setMealGroup(event.target.value)}>
                <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                {mealGroups.map((group) => (
                  <option key={group} value={group}>
                    {getGroupLabel(group)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ingredient-list admin-management-list">
            {adminPreviewMeals.map((meal) => (
              <article className="admin-catalog-row" key={meal._id}>
                <div className="admin-catalog-row__content">
                  <h3>{meal.name}</h3>
                  <p>{getGroupLabel(meal.group) || (language === 'vi' ? 'Không có nhóm' : 'No group')} · {meal.calories || 0} kcal</p>
                </div>
                <div className="admin-catalog-row__actions">
                  <button className="ghost-button" type="button" onClick={() => handleEditMeal(meal)}>
                    {language === 'vi' ? 'Sửa' : 'Edit'}
                  </button>
                  <button className="ghost-button" type="button" onClick={() => handleDeleteMeal(meal._id)}>
                    {language === 'vi' ? 'Xóa' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="panel panel--full">
        <SectionHeading
          eyebrow={language === 'vi' ? 'Thư viện món ăn' : 'Meal catalog'}
          title={language === 'vi' ? 'Khám phá danh mục món ăn' : 'Browse the meal library'}
          description={language === 'vi' ? 'Tìm kiếm theo tên hoặc nhóm để chọn những món ăn bạn muốn thêm vào kế hoạch ăn uống hoặc lưu lại.' : 'Search by name or group to find meals you want to plan, save, or compare later.'}
        />

        <div className="panel-stack">
          <div className="field-grid field-grid--wide">
            <label className="field field--span-2">
              <span>{language === 'vi' ? 'Tìm kiếm món ăn' : 'Search meals'}</span>
              <input
                type="text"
                value={mealQuery}
                onChange={(event) => setMealQuery(event.target.value)}
                placeholder={language === 'vi' ? 'Ví dụ: gà nướng, salad, sữa chua' : 'Example: grilled chicken, salad, yogurt'}
              />
            </label>

            <label className="field">
              <span>{language === 'vi' ? 'Nhóm món ăn' : 'Meal group'}</span>
              <select value={mealGroup} onChange={(event) => setMealGroup(event.target.value)}>
                <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                {mealGroups.map((group) => (
                  <option key={group} value={group}>
                    {getGroupLabel(group)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="subtle-text">
            {language === 'vi' ? `Hiển thị ${filteredMeals.length} món ăn phù hợp bộ lọc trên tổng số ${formatNumber(meals.length)} món ăn hiện có.` : `Showing ${filteredMeals.length} meals after filtering out of ${formatNumber(meals.length)} available meals.`}
          </p>

          <div className="meal-card-grid meal-card-grid--catalog">
            {meals.length === 0 ? (
              <SkeletonLoader count={6} />
            ) : filteredMeals.map((meal) => (
              <MealCard key={meal._id} actionLabel={language === 'vi' ? 'Xem chi tiết' : 'Open details'} caption={t(meal.group)} meal={meal} onClick={setSelectedMeal} />
            ))}
          </div>
        </div>
      </section>

      <MealDetailModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
    </>
  )
}

export default LibraryPage
