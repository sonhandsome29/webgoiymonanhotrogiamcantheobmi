import { Link } from 'react-router-dom'
import Notice from '../components/ui/Notice'
import SectionHeading from '../components/ui/SectionHeading'
import EmptyState from '../components/ui/EmptyState'
import FamilyDayCard from '../components/cards/FamilyDayCard'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import { useAppContext } from '../hooks/useAppContext'
import { formatCurrency } from '../utils/formatters'

function FamilyPage() {
  const {
    errors,
    familyForm,
    familyMenu,
    handleFamilySubmit,
    handleSaveFamilyMenu,
    loading,
    minCost,
    recommendedFamilyBudget,
    refreshPricing,
    setFamilyForm,
    user,
    language,
    t,
  } = useAppContext()
  const hasBudgetInput = String(familyForm.weeklyBudget || '').trim() !== ''
  const averageDailyBudget = familyMenu ? Math.round(familyMenu.totalWeekCost / 7) : 0

  if (!user) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow={t('family_menu')}
          title={language === 'vi' ? 'Đăng nhập để lập thực đơn gia đình' : 'Sign in to build a family menu'}
          description={language === 'vi' ? 'Khách có thể xem giá cơ sở, nhưng tạo thực đơn gia đình chỉ dành cho tài khoản đã đăng nhập.' : 'Guests can view the pricing baseline, but menu generation and household inputs are reserved for signed-in accounts.'}
          actions={
            <button className="ghost-button" type="button" onClick={refreshPricing}>
              {language === 'vi' ? 'Làm mới giá cả' : 'Refresh pricing data'}
            </button>
          }
        />

        <div className="panel-stack tw-surface-soft p-5 md:p-6">
          {errors.familyMinCost ? <Notice tone="error">{errors.familyMinCost}</Notice> : null}

          <EmptyState
            title={language === 'vi' ? 'Lập kế hoạch gia đình bị khóa với khách' : 'Family planning is locked for guests'}
            description={language === 'vi' ? 'Đăng nhập để nhập số thành viên, ngân sách tuần, và tạo thực đơn 7 ngày dựa trên giá nguyên liệu hiện tại.' : 'Sign in to enter family size, weekly budget, and generate a 7-day family menu based on your current ingredient pricing.'}
            action={
              <Link className="primary-button" to="/auth">
                {language === 'vi' ? 'Đăng nhập để tạo thực đơn gia đình' : 'Sign in to create a family menu'}
              </Link>
            }
          />

          {recommendedFamilyBudget ? (
            <p className="subtle-text">
              {language === 'vi' ? `Mức tối thiểu ví dụ cho ${familyForm.familySize} người: ${formatCurrency(recommendedFamilyBudget)}.` : `Example minimum for ${familyForm.familySize} people: ${formatCurrency(recommendedFamilyBudget)}.`}
            </p>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className="panel panel--full">
        <SectionHeading
          eyebrow={t('family_menu')}
          title={language === 'vi' ? 'Ước tính ngân sách tối thiểu và lập thực đơn gia đình 7 ngày' : 'Estimate the minimum budget and build a 7-day family menu'}
          description={language === 'vi' ? 'Dùng giá nguyên liệu hiện tại để tạo thực đơn tuần phù hợp với số thành viên trong gia đình.' : 'Use your current ingredient prices to generate a weekly menu that fits the size of your household.'}
          actions={
            <button className="ghost-button" type="button" onClick={refreshPricing}>
              {language === 'vi' ? 'Làm mới giá cả' : 'Refresh pricing data'}
            </button>
          }
        />

      <div className="panel-stack tw-surface-soft p-5 md:p-6 family-form-card">
        {minCost && hasBudgetInput ? (
          <div className="highlight-card">
            <div className="highlight-card__top">
              <div>
                <span className="chip chip--accent">{language === 'vi' ? 'Mục tiêu tối thiểu' : 'Minimum target'}</span>
                <h3>{formatCurrency(minCost.minCostPerPerson)}</h3>
                <p>{language === 'vi' ? `mỗi người / tuần, bao gồm đệm ${formatCurrency(minCost.buffer)}` : `per person / week, including a ${formatCurrency(minCost.buffer)} buffer`}</p>
              </div>
              <div className="inline-stats">
                <span>{formatCurrency(minCost.dailyCostPerPerson)} / {language === 'vi' ? 'ngày' : 'day'}</span>
                <span>{formatCurrency(minCost.baseWeeklyCostPerPerson)} / {language === 'vi' ? 'tuần cơ bản' : 'base week'}</span>
              </div>
            </div>

            <div className="tag-row">
              {(minCost.cheapestMeals || []).map((item) => (
                <span className="tag" key={item.name}>
                  {item.name}: {formatCurrency(item.cost)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {errors.familyMinCost ? <Notice tone="error">{errors.familyMinCost}</Notice> : null}

        <form className="panel-stack" onSubmit={handleFamilySubmit}>
          <div className="field-grid">
            <label className="field">
              <span>{t('family_size')}</span>
              <input
                type="number"
                min="1"
                value={familyForm.familySize}
                onChange={(event) =>
                  setFamilyForm((previous) => ({ ...previous, familySize: event.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{t('weekly_budget')}</span>
              <input
                type="number"
                min="0"
                value={familyForm.weeklyBudget}
                onChange={(event) =>
                  setFamilyForm((previous) => ({ ...previous, weeklyBudget: event.target.value }))
                }
                placeholder="Example 1500000"
                required
              />
            </label>
          </div>

          <div className="family-actions-card">
            <button className="primary-button" type="submit" disabled={loading.family}>
              {loading.family ? (language === 'vi' ? 'Đang tạo thực đơn...' : 'Generating menu...') : t('generate_family_btn')}
            </button>

            {familyMenu ? (
              <button className="ghost-button" type="submit" disabled={loading.family}>
                {loading.family ? (language === 'vi' ? 'Đang làm mới...' : 'Refreshing...') : (language === 'vi' ? 'Tạo thực đơn gia đình khác' : 'Generate another family menu')}
              </button>
            ) : null}

            {familyMenu ? (
              <button className="ghost-button" type="button" onClick={handleSaveFamilyMenu}>
                {language === 'vi' ? 'Lưu thực đơn gia đình' : 'Save family menu'}
              </button>
            ) : null}

            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                setFamilyForm((previous) => ({
                  ...previous,
                  weeklyBudget: recommendedFamilyBudget
                    ? String(Math.round(recommendedFamilyBudget))
                    : previous.weeklyBudget,
                }))
              }
            >
              {language === 'vi' ? 'Dùng ngân sách đề xuất' : 'Use suggested budget'}
            </button>
          </div>

          {recommendedFamilyBudget ? (
            <p className="subtle-text">
              {language === 'vi' ? `Tối thiểu đề xuất cho ${familyForm.familySize} người: ${formatCurrency(recommendedFamilyBudget)}.` : `Suggested minimum for ${familyForm.familySize} people: ${formatCurrency(recommendedFamilyBudget)}.`}
            </p>
          ) : null}

          {!hasBudgetInput ? (
            <p className="subtle-text">{language === 'vi' ? 'Nhập ngân sách tuần để xem mục tiêu tối thiểu và hướng dẫn định giá.' : 'Enter a weekly budget to see the minimum target and pricing guidance.'}</p>
          ) : null}
        </form>

        {errors.family ? <Notice tone="error">{errors.family}</Notice> : null}

        {loading.family ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="shimmer-skeleton" style={{ height: '36px', width: '50%', borderRadius: '12px' }} />
            <div className="family-summary-grid" style={{ pointerEvents: 'none', opacity: 0.7 }}>
              <div className="shimmer-skeleton" style={{ height: '80px', borderRadius: '24px' }} />
              <div className="shimmer-skeleton" style={{ height: '80px', borderRadius: '24px' }} />
              <div className="shimmer-skeleton" style={{ height: '80px', borderRadius: '24px' }} />
              <div className="shimmer-skeleton" style={{ height: '80px', borderRadius: '24px' }} />
            </div>
            <div className="shimmer-skeleton" style={{ height: '120px', borderRadius: '28px' }} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="shimmer-skeleton" style={{ height: '240px', borderRadius: '28px' }} />
              <div className="shimmer-skeleton" style={{ height: '240px', borderRadius: '28px' }} />
              <div className="shimmer-skeleton" style={{ height: '240px', borderRadius: '28px' }} />
            </div>
          </div>
        ) : familyMenu ? (
          <div className="panel-stack">
            <div className="family-summary-grid">
              <article className="family-summary-card">
                <span className="family-summary-card__label">{language === 'vi' ? 'Tổng tuần' : 'Weekly total'}</span>
                <strong className="family-summary-card__value">{formatCurrency(familyMenu.totalWeekCost)}</strong>
              </article>
              <article className="family-summary-card">
                <span className="family-summary-card__label">{language === 'vi' ? 'Chi phí bữa ăn cơ bản' : 'Base meal cost'}</span>
                <strong className="family-summary-card__value">{formatCurrency(familyMenu.baseWeekCost)}</strong>
              </article>
              <article className="family-summary-card">
                <span className="family-summary-card__label">{language === 'vi' ? 'Đệm an toàn' : 'Safety buffer'}</span>
                <strong className="family-summary-card__value">{formatCurrency(familyMenu.buffer)}</strong>
              </article>
              <article className="family-summary-card">
                <span className="family-summary-card__label">{t('stat_min_budget')}</span>
                <strong className="family-summary-card__value">{formatCurrency(familyMenu.minBudgetForFamily)}</strong>
              </article>
            </div>

            <div className="family-result-hero">
              <div className="family-result-hero__top">
                <div className="family-result-hero__copy">
                  <span className="tw-chip">{language === 'vi' ? 'Kết quả gia đình' : 'Family result'}</span>
                  <h3>{language === 'vi' ? `Thực đơn 7 ngày cho ${familyMenu.familySize} người` : `7-day meal plan for ${familyMenu.familySize} people`}</h3>
                  <p>
                    {language === 'vi' ? 'Kế hoạch này phân bổ ngân sách trong tuần và giữ mỗi ngày rõ ràng theo loại bữa ăn và chi phí mỗi người.' : 'This plan spreads your budget across the week and keeps each day readable by meal type and per-person cost.'}
                  </p>
                </div>

                <div className="family-result-hero__stats">
                  <strong>{formatCurrency(Math.round(familyMenu.totalWeekCost / 7))}</strong>
                  <span>{language === 'vi' ? 'trung bình mỗi ngày' : 'average per day'}</span>
                  <span>
                    {Math.round(
                      (familyMenu.days || []).reduce(
                        (sum, day) =>
                          sum +
                          (day.meals || []).reduce((mealSum, item) => mealSum + (item.dish?.calories || 0), 0),
                        0,
                      ) / Math.max((familyMenu.days || []).length, 1),
                    )}{' '}
                    kcal {language === 'vi' ? 'trung bình' : 'average'}
                  </span>
                  {familyMenu.savedAt ? <span>{language === 'vi' ? 'đã lưu' : 'saved'} {new Date(familyMenu.savedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB')}</span> : null}
                </div>
              </div>
            </div>

            <div className="family-day-grid">
              {(familyMenu.days || []).map((day) => (
                <FamilyDayCard averageDailyBudget={averageDailyBudget} key={day.dayKeyVi} day={day} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
              className="family-empty-state"
              title={language === 'vi' ? 'Chưa có thực đơn gia đình' : 'No family menu yet'}
              description={language === 'vi' ? 'Nhập số thành viên và ngân sách tuần để tạo thực đơn gia đình 7 ngày đầy đủ.' : 'Enter family size and weekly budget to generate a full 7-day family menu.'}
            />
          )}
      </div>
    </section>
  )
}

export default FamilyPage
