import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { dayOptions } from '../constants/appData'
import MealCard from '../components/cards/MealCard'
import EmptyState from '../components/ui/EmptyState'
import Notice from '../components/ui/Notice'
import SectionHeading from '../components/ui/SectionHeading'
import { useAppContext } from '../hooks/useAppContext'
import { formatCurrency, formatNumber, getDayLabel, maskEmail } from '../utils/formatters'

function HistoryPage() {
  const {
    adminUsersOverview,
    errors,
    historyCalories,
    historyDay,
    historyMeals,
    isAdmin,
    loading,
    refreshAdminOverview,
    savedDays,
    setHistoryDay,
    shoppingList,
    user,
    language,
    t
  } = useAppContext()
  const [adminSearch, setAdminSearch] = useState('')
  const [familyFilter, setFamilyFilter] = useState('all')
  const [bmiFilter, setBmiFilter] = useState('all')
  const adminWeekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ]
  const filteredAdminUsers = useMemo(() => {
    const searchTerm = adminSearch.trim().toLowerCase()

    return adminUsersOverview.filter((item) => {
      const matchesSearch = !searchTerm || item.email.toLowerCase().includes(searchTerm)
      const matchesFamily =
        familyFilter === 'all' ||
        (familyFilter === 'yes' && item.hasFamilyMenu) ||
        (familyFilter === 'no' && !item.hasFamilyMenu)
      const matchesBmi =
        bmiFilter === 'all' ||
        (bmiFilter === 'yes' && Boolean(item.bmi)) ||
        (bmiFilter === 'no' && !item.bmi)

      return matchesSearch && matchesFamily && matchesBmi
    })
  }, [adminSearch, adminUsersOverview, bmiFilter, familyFilter])

  if (!user) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow={language === 'vi' ? 'Nhật ký dinh dưỡng' : 'Meal history'}
          title={language === 'vi' ? 'Tính năng này yêu cầu đăng nhập' : 'Meal history requires a session'}
          description=""
        />

        <EmptyState
          title={language === 'vi' ? 'Đăng nhập để xem nhật ký' : 'Sign in to open this page'}
          description={language === 'vi' ? 'Sau khi đăng nhập, bạn có thể kiểm tra thực đơn tuần đã lưu và danh sách nguyên liệu đi chợ.' : 'After signing in, you can safely view saved meal days and shopping lists for your account.'}
          action={
            <Link className="primary-button" to="/auth">
              {language === 'vi' ? 'Đi đến đăng nhập' : 'Go to sign in'}
            </Link>
          }
        />
      </section>
    )
  }

  if (isAdmin) {
    return (
      <section className="panel panel--full">
        <SectionHeading
          eyebrow={language === 'vi' ? 'Quản lý người dùng' : 'Admin user management'}
          title={language === 'vi' ? 'Quản lý tài khoản đã đăng ký' : 'Registered user management'}
          description=""
          actions={
            <button className="ghost-button" type="button" onClick={refreshAdminOverview}>
              {language === 'vi' ? 'Làm mới dữ liệu' : 'Refresh data'}
            </button>
          }
        />

        {errors.adminOverview ? <Notice tone="error">{errors.adminOverview}</Notice> : null}

        <div className="summary-band">
          <span>{loading.adminOverview ? (language === 'vi' ? 'Đang tải danh sách...' : 'Loading user overview...') : (language === 'vi' ? `Tổng số người dùng: ${adminUsersOverview.length}` : `Total registered users: ${adminUsersOverview.length}`)}</span>
          <span>{language === 'vi' ? `${filteredAdminUsers.length} tài khoản trong chế độ xem` : `${filteredAdminUsers.length} users in current view`}</span>
          <span>{language === 'vi' ? `${adminUsersOverview.filter((item) => item.hasFamilyMenu).length} có thực đơn gia đình` : `${adminUsersOverview.filter((item) => item.hasFamilyMenu).length} users with family menu`}</span>
          <span>{language === 'vi' ? `${adminUsersOverview.filter((item) => item.bmi).length} đã cập nhật BMI` : `${adminUsersOverview.filter((item) => item.bmi).length} users with BMI`}</span>
          <span>{language === 'vi' ? 'Làm mới thủ công' : 'Manual refresh'}</span>
        </div>

        <div className="admin-table-toolbar">
          <label className="field admin-table-toolbar__search">
            <span>{language === 'vi' ? 'Tìm theo email' : 'Search by email'}</span>
            <input
              type="text"
              value={adminSearch}
              onChange={(event) => setAdminSearch(event.target.value)}
              placeholder={language === 'vi' ? 'Nhập email người dùng' : 'Search registered email'}
            />
          </label>

          <label className="field">
            <span>{language === 'vi' ? 'Thực đơn gia đình' : 'Family menu'}</span>
            <select value={familyFilter} onChange={(event) => setFamilyFilter(event.target.value)}>
              <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
              <option value="yes">{language === 'vi' ? 'Có thực đơn gia đình' : 'Has family menu'}</option>
              <option value="no">{language === 'vi' ? 'Không có thực đơn gia đình' : 'No family menu'}</option>
            </select>
          </label>

          <label className="field">
            <span>BMI</span>
            <select value={bmiFilter} onChange={(event) => setBmiFilter(event.target.value)}>
              <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
              <option value="yes">{language === 'vi' ? 'Có chỉ số BMI' : 'Has BMI'}</option>
              <option value="no">{language === 'vi' ? 'Chưa có BMI' : 'No BMI'}</option>
            </select>
          </label>
        </div>

        {filteredAdminUsers.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{language === 'vi' ? 'Thành viên' : 'User'}</th>
                  <th>{language === 'vi' ? 'Ngày đăng ký' : 'Registered'}</th>
                  <th>BMI</th>
                  <th>{language === 'vi' ? 'Menu gia đình' : 'Family menu'}</th>
                  <th>{language === 'vi' ? 'Lịch sử gia đình' : 'Family history'}</th>
                  {adminWeekDays.map((day) => (
                    <th key={day.value}>{t(day.value)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAdminUsers.map((item) => (
                  <tr key={item.userId}>
                    <td>
                      <div className="admin-table__user-cell">
                        <span className="chip chip--accent">{language === 'vi' ? 'Thành viên' : 'User'}</span>
                        <strong>{maskEmail(item.email)}</strong>
                      </div>
                    </td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB') : (language === 'vi' ? 'Không rõ' : 'Unknown')}</td>
                    <td>
                      <span className="admin-table__badge">{item.bmi ? `BMI ${item.bmi}` : (language === 'vi' ? 'Chưa nhập' : 'No BMI')}</span>
                    </td>
                    <td>
                      <span className="admin-table__badge">
                        {item.hasFamilyMenu ? (language === 'vi' ? `Đã lưu (${item.familyMenuCount || 1})` : `Saved (${item.familyMenuCount || 1})`) : (language === 'vi' ? 'Chưa chọn' : 'Not selected')}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table__day-cell">
                        {item.familyMenuHistory?.length ? (
                          item.familyMenuHistory.slice(0, 3).map((entry) => (
                            <span className="admin-table__meal-pill" key={entry.historyId}>
                              {new Date(entry.savedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB')} · {formatCurrency(entry.totalWeekCost)}
                            </span>
                          ))
                        ) : (
                          <span className="admin-table__empty">{language === 'vi' ? 'Không có lưu' : 'No family saves'}</span>
                        )}
                      </div>
                    </td>
                    {adminWeekDays.map((day) => {
                      const selectedMeals = item.weekMeals?.[day.value] || []

                      return (
                        <td key={`${item.userId}-${day.value}`}>
                          <div className="admin-table__day-cell">
                            {selectedMeals.length ? (
                              selectedMeals.map((mealName) => (
                                <span className="admin-table__meal-pill" key={`${item.userId}-${day.value}-${mealName}`}>
                                  {mealName}
                                </span>
                              ))
                            ) : (
                              <span className="admin-table__empty">{language === 'vi' ? 'Không có món' : 'No meals'}</span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={adminUsersOverview.length ? (language === 'vi' ? 'Không tìm thấy tài khoản phù hợp bộ lọc' : 'No users match the current filters') : (language === 'vi' ? 'Chưa có thành viên nào đăng ký' : 'No registered users yet')}
            description={
              adminUsersOverview.length
                ? (language === 'vi' ? 'Hãy xóa từ khóa hoặc thay đổi cấu hình bộ lọc thực đơn và BMI để tiếp tục.' : 'Try clearing the search box or switching the family menu and BMI filters.')
                : (language === 'vi' ? 'Khi người dùng đăng ký tài khoản và bắt đầu lập thực đơn, thông tin sẽ hiển thị ở đây.' : 'When regular users sign up and use the planner, this page will show their weekly selections for admin monitoring.')
            }
          />
        )}
      </section>
    )
  }

  return (
    <section className="panel panel--full">
      <SectionHeading
        eyebrow={language === 'vi' ? 'Nhật ký dinh dưỡng' : 'Meal history'}
        title={language === 'vi' ? 'Lịch sử thực đơn và Danh sách đi chợ theo ngày' : 'Saved meal history and shopping list by day'}
        description=""
      />

      <div className="history-layout gap-6 xl:grid xl:grid-cols-2">
        <div className="panel-stack tw-surface-soft p-5 md:p-6">
          
          {/* Day Selector Card Layer */}
          <div className="day-selector-card" style={{
            background: 'var(--paper-bright)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '10px' }}>
              {language === 'vi' ? 'Chọn ngày trong tuần' : 'Select Weekday'}
            </div>
            <div className="day-chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {dayOptions.map((day) => (
                <button
                  key={day.value}
                  className={historyDay === day.value ? 'day-chip is-active' : 'day-chip'}
                  type="button"
                  onClick={() => setHistoryDay(day.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  {t(day.value)}
                  {savedDays.has(day.value) ? <span className="day-chip__dot" /> : null}
                </button>
              ))}
            </div>
          </div>

          {errors.historyOverview ? <Notice tone="error">{errors.historyOverview}</Notice> : null}
          {errors.historyDay ? <Notice tone="error">{errors.historyDay}</Notice> : null}

          {/* Daily Stats Grid Layer */}
          <div className="summary-band-card" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            background: 'var(--paper-mid)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ borderRight: '1px solid var(--line)' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '2px' }}>
                {language === 'vi' ? 'Xem ngày' : 'Viewing Day'}
              </div>
              <strong style={{ fontSize: '0.88rem', color: 'var(--accent-strong)' }}>
                {loading.history ? (language === 'vi' ? 'Đang tải...' : 'Loading...') : t(historyDay)}
              </strong>
            </div>
            <div style={{ borderRight: '1px solid var(--line)' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '2px' }}>
                {language === 'vi' ? 'Đã lưu' : 'Saved Meals'}
              </div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>
                {historyMeals.length}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '2px' }}>
                {language === 'vi' ? 'Năng lượng' : 'Calories'}
              </div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--warm-deep)', fontFamily: 'var(--font-heading)' }}>
                {formatNumber(historyCalories)} kcal
              </strong>
            </div>
          </div>

          {historyMeals.length ? (
            <div className="meal-card-grid meal-card-grid--history">
              {historyMeals.map((meal) => (
                <MealCard key={`${meal.caption}-${meal.name}`} caption={t(meal.caption)} meal={meal} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={language === 'vi' ? 'Chưa lưu món ăn nào cho ngày này' : 'No meals saved for this day'}
              description={language === 'vi' ? 'Sau khi nhận gợi ý từ công cụ lập kế hoạch, vui lòng lưu để tự động tạo danh sách đi chợ tương ứng.' : 'After creating a meal suggestion, save it into history so the shopping list can be generated for that day.'}
            />
          )}
        </div>

        <div className="panel-stack tw-surface-soft p-5 md:p-6">
          {/* Shopping Header Card Layer */}
          <div className="shopping-header-card" style={{
            background: 'var(--paper-mid)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="chip chip--accent" style={{ background: 'var(--accent)', color: '#fff', border: 'none', alignSelf: 'flex-start' }}>
                {language === 'vi' ? 'Danh sách đi chợ' : 'Shopping List'}
              </span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>
                {language === 'vi' ? `Nguyên liệu cho ${t(historyDay)}` : `Ingredients for ${getDayLabel(historyDay)}`}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '2px' }}>
                {language === 'vi' ? 'TỔNG CHI PHÍ' : 'TOTAL COST'}
              </div>
              <strong style={{ fontSize: '1.35rem', color: 'var(--warm-deep)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                {shoppingList ? formatCurrency(shoppingList.totalPrice) : '--'}
              </strong>
            </div>
          </div>

          {shoppingList?.ingredients?.length ? (
            <div className="shopping-grid">
              {shoppingList.ingredients.map((item) => (
                <article className="shopping-card" key={`${item.normalized}-${item.mealName}`}>
                  <div>
                    <span className="chip chip--outline">{t(item.mealType)}</span>
                    <h4>{item.name}</h4>
                    <p>{item.mealName}</p>
                  </div>
                  <div className="shopping-card__meta">
                    <span>{item.category || (language === 'vi' ? 'Khác' : 'Uncategorized')}</span>
                    <strong>{formatCurrency(item.price)}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={language === 'vi' ? 'Chưa có danh sách đi chợ' : 'No shopping list yet'}
              description={language === 'vi' ? 'Lưu kế hoạch ăn uống cho ngày này để SonE tự động tính toán danh sách đi chợ.' : 'Save a meal plan for this day and SonE will generate the shopping list automatically.'}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default HistoryPage
