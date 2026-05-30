import { Link } from 'react-router-dom'
import { activityOptions, dayOptions } from '../constants/appData'
import MealCard from '../components/cards/MealCard'
import Notice from '../components/ui/Notice'
import EmptyState from '../components/ui/EmptyState'
import SectionHeading from '../components/ui/SectionHeading'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { useAppContext } from '../hooks/useAppContext'
import { formatNumber, getGroupLabel } from '../utils/formatters'
import { useAppStore } from '../store/useAppStore'

function PlannerPage() {
  const {
    errors,
    handlePlannerSubmit,
    handleReplaceMeal,
    handleSavePlan,
    isAdmin,
    loading,
    mealPlan,
    plannerForm,
    resetPlannerForm,
    selectedSaveDay,
    setPlannerForm,
    setSelectedSaveDay,
    user,
    language,
    t,
    mealGroups
  } = useAppContext()

  const meals = useAppStore((state) => state.meals)
  const ingredients = useAppStore((state) => state.ingredients)

  if (isAdmin) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow={language === 'vi' ? 'Dành riêng cho Admin' : 'Admin only'}
          title={language === 'vi' ? 'Quản trị viên không cần lập thực đơn' : 'Admin does not use the meal planner'}
          description=""
        />

        <EmptyState
          title={language === 'vi' ? 'Công cụ lập thực đơn bị ẩn với quản trị viên' : 'Planner is hidden for admin'}
          description={language === 'vi' ? 'Vui lòng truy cập Thư viện món ăn để quản lý danh mục món ăn hoặc xem Người dùng để giám sát.' : 'Go to Meals to manage meal data, or open Users to monitor registered activity.'}
        />
      </section>
    )
  }

  if (!user) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow={t('meal_planner')}
          title={language === 'vi' ? 'Đăng nhập để lập thực đơn' : 'Sign in to use the planner'}
          description={language === 'vi' ? 'Khách có thể duyệt qua sản phẩm, nhưng việc tính toán calo cá nhân chỉ khả dụng sau khi đăng nhập.' : 'Guests can browse the product, but personal calorie planning is available only after sign-in.'}
        />

        <EmptyState
          title={language === 'vi' ? 'Trực quan hóa kế hoạch bị hạn chế đối với khách' : 'Planner is view-only for guests'}
          description={language === 'vi' ? 'Vui lòng tạo tài khoản hoặc đăng nhập để điền chỉ số cơ thể, nhận gợi ý tối ưu và lưu lịch sử ăn uống.' : 'Create an account or sign in to enter your body data, generate meal suggestions, and save days into your meal history.'}
          action={
            <Link className="primary-button" to="/auth">
              {language === 'vi' ? 'Đăng nhập để bắt đầu' : 'Sign in to start planning'}
            </Link>
          }
        />
      </section>
    )
  }

  return (
    <section className="panel panel--full">
        <SectionHeading
          eyebrow={language === 'vi' ? 'Gợi ý bữa ăn' : 'Suggest meals'}
          title={language === 'vi' ? 'Gợi ý món ăn theo Calo và Sở thích' : 'Suggest meals by calories and preferences'}
          description=""
          actions={
            <div className="action-row">
              {mealPlan ? (
                <button className="ghost-button" type="submit" form="planner-form" disabled={loading.planner}>
                  {loading.planner ? (language === 'vi' ? 'Đang làm mới...' : 'Refreshing...') : (language === 'vi' ? 'Đổi thực đơn khác' : 'Try another plan')}
                </button>
              ) : null}
              <button className="ghost-button" type="button" onClick={resetPlannerForm}>
                {language === 'vi' ? 'Đặt lại mặc định' : 'Reset preset'}
              </button>
            </div>
          }
        />

      <div className="planner-layout gap-6 xl:grid xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <form className="panel-stack tw-surface-soft p-5 md:p-6 planner-form-card" id="planner-form" onSubmit={handlePlannerSubmit}>
          <div className="field-grid field-grid--wide">
            <label className="field">
              <span>{t('weight_label')}</span>
              <input
                type="number"
                min="1"
                value={plannerForm.weight}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, weight: event.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{t('height_label')}</span>
              <input
                type="number"
                min="1"
                value={plannerForm.height}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, height: event.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{t('age_label')}</span>
              <input
                type="number"
                min="1"
                value={plannerForm.age}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, age: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>{t('gender_label')}</span>
              <select
                value={plannerForm.gender}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, gender: event.target.value }))
                }
              >
                <option value="female">{t('gender_female')}</option>
                <option value="male">{t('gender_male')}</option>
              </select>
            </label>

            <label className="field">
              <span>{t('activity_label')}</span>
              <select
                value={plannerForm.activity_level}
                onChange={(event) =>
                  setPlannerForm((previous) => ({ ...previous, activity_level: event.target.value }))
                }
              >
                {activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === 'sedentary' ? t('activity_sedentary') : t('activity_frequent')}
                  </option>
                ))}
              </select>
            </label>

          </div>

          <div className="field-grid field-grid--wide">
            <label className="field field--span-2">
              <span>{language === 'vi' ? 'Tránh nhóm món ăn' : 'Groups to avoid'}</span>
              <select
                value={plannerForm.dislikedGroups}
                onChange={(event) =>
                  setPlannerForm((previous) => ({
                    ...previous,
                    dislikedGroups: event.target.value,
                  }))
                }
              >
                <option value="">{language === 'vi' ? 'Không (None)' : 'None'}</option>
                {mealGroups.map((group) => (
                  <option key={group} value={group}>
                    {getGroupLabel(group)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--span-2">
              <span>{language === 'vi' ? 'Tránh nguyên liệu' : 'Ingredients to avoid'}</span>
              <select
                value={plannerForm.dislikedIngredients}
                onChange={(event) =>
                  setPlannerForm((previous) => ({
                    ...previous,
                    dislikedIngredients: event.target.value,
                  }))
                }
              >
                <option value="">{language === 'vi' ? 'Không (None)' : 'None'}</option>
                {ingredients.map((ing) => (
                  <option key={ing._id || ing.name} value={ing.name}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--span-2">
              <span>{language === 'vi' ? 'Tránh món ăn cụ thể' : 'Specific meals to skip'}</span>
              <select
                value={plannerForm.dislikedMeals}
                onChange={(event) =>
                  setPlannerForm((previous) => ({
                    ...previous,
                    dislikedMeals: event.target.value,
                  }))
                }
              >
                <option value="">{language === 'vi' ? 'Không (None)' : 'None'}</option>
                {meals.map((meal) => (
                  <option key={meal._id || meal.name} value={meal.name}>
                    {meal.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {errors.planner ? <Notice tone="error">{errors.planner}</Notice> : null}

          <div className="planner-actions-card">
            <button className="primary-button" type="submit" disabled={loading.planner}>
              {loading.planner ? (language === 'vi' ? 'Đang tính toán...' : 'Calculating...') : t('generate_suggestions')}
            </button>
            <Link className="ghost-button" to="/history">
              {language === 'vi' ? 'Xem lịch sử dinh dưỡng' : 'Open daily history'}
            </Link>
          </div>
        </form>

        <div className="panel-stack tw-surface-soft p-5 md:p-6">
          {loading.planner ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="shimmer-skeleton" style={{ height: '36px', width: '55%', borderRadius: '12px' }} />
              <div className="shimmer-skeleton" style={{ height: '60px', borderRadius: '20px' }} />
              <SkeletonLoader count={3} />
            </div>
          ) : mealPlan ? (
            <>
              <div className="summary-band">
                <span>{language === 'vi' ? 'Mục tiêu' : 'Target'}: {formatNumber(mealPlan.targetCaloriesPerDay)} kcal</span>
                <span>{language === 'vi' ? 'Thực tế' : 'Actual'}: {formatNumber(mealPlan.selectedCalories)} kcal</span>
                <span>BMI: {mealPlan.bmi}</span>
                <span>{language === 'vi' ? 'Chế độ' : 'Goal'}: {mealPlan.goal === 'weight_loss' ? (language === 'vi' ? 'Giảm cân' : 'Weight loss') : mealPlan.goal === 'weight_gain' ? (language === 'vi' ? 'Tăng cân' : 'Weight gain') : (language === 'vi' ? 'Giữ cân' : 'Maintenance')}</span>
              </div>

              <div className="planner-save-bar">
                <label className="field field--compact">
                  <span>{language === 'vi' ? 'Lưu vào thứ' : 'Save to day'}</span>
                  <select value={selectedSaveDay} onChange={(event) => setSelectedSaveDay(event.target.value)}>
                    {dayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {t(day.value)}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="primary-button"
                  type="button"
                  onClick={handleSavePlan}
                  disabled={loading.savePlan}
                >
                  {loading.savePlan ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu vào lịch sử' : 'Save to history')}
                </button>
              </div>

              <div className="meal-section-grid">
                {(mealPlan.meals || []).map((section) => (
                  <div className="meal-section" key={section.meal}>
                    <div className="meal-section__header">
                      <h3>{t(section.meal)}</h3>
                      <span>{language === 'vi' ? `${(section.details || []).length} món được chọn` : `${(section.details || []).length} selected meals`}</span>
                    </div>

                    <div className="meal-card-grid">
                      {(section.details || []).map((meal) => (
                        <div className="panel-stack" key={meal._id}>
                          <MealCard caption={t(section.meal)} meal={meal} />
                          <button className="ghost-button" type="button" onClick={() => handleReplaceMeal(section.meal, meal._id)}>
                            {language === 'vi' ? 'Đổi món khác' : 'Replace this meal'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              className="planner-empty-state"
              title={language === 'vi' ? 'Chưa có thực đơn nào' : 'No meal plan yet'}
              description={language === 'vi' ? 'Nhập các chỉ số cơ thể của bạn ở bên trái để SonE tự động gợi ý thực đơn sáng, trưa, tối dinh dưỡng.' : 'Enter your body data on the left and SonE will generate a day plan for breakfast, lunch, and dinner.'}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default PlannerPage
