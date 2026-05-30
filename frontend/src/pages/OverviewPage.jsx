import { Link } from 'react-router-dom'
import SectionHeading from '../components/ui/SectionHeading'
import { useAppContext } from '../hooks/useAppContext'
import { resolveImageUrl } from '../lib/api'
import { formatCurrency, formatNumber, getGroupLabel, maskEmail } from '../utils/formatters'

function OverviewPage() {
  const {
    adminUsersOverview,
    historyRecords,
    isAdmin,
    mealGroups,
    meals,
    minCost,
    recommendedFamilyBudget,
    savedDays,
    setMealQuery,
    user,
    language,
    t
  } = useAppContext()

  const accountName = user ? user.email.split('@')[0] : (language === 'vi' ? 'Khách' : 'guest')
  const personalizedMeals = meals.slice(0, 4)
  const editorialMeals = meals.slice(4, 7)
  const popularMeals = meals.slice(7, 13)
  const highlightedGroups = mealGroups
    .filter((group) => group !== 'cơm')
    .map((group) => {
      const groupMeals = meals.filter((meal) => meal.group === group)
      const cover = groupMeals.find((meal) => meal.image_url)

      return {
        group,
        count: groupMeals.length,
        cover,
        samples: groupMeals.slice(0, 2).map((meal) => meal.name),
      }
    })
    .filter((item) => item.cover)
    .slice(0, 6)

  return (
    <>
      <section className="panel panel--full home-personal-grid">
        <div className="home-personal-card">
          <SectionHeading
            eyebrow={isAdmin ? (language === 'vi' ? 'Chế độ Admin' : 'Admin mode') : user ? (language === 'vi' ? `Dành cho ${accountName}` : `For ${accountName}`) : (language === 'vi' ? 'Bắt đầu với SonE' : 'Start with SonE')}
            title={
              isAdmin
                ? (language === 'vi' ? 'Không gian quản lý nội dung và người dùng' : 'A cleaner admin workspace for content and users')
                : user
                  ? (language === 'vi' ? 'Bảng điều khiển được thiết kế riêng cho bạn' : 'A dashboard designed around your account')
                  : (language === 'vi' ? 'Thói quen ăn uống lành mạnh, xây dựng quanh bạn' : 'A healthier food routine, built around you')
            }
            description={
              isAdmin
                ? (language === 'vi' ? 'Quản trị viên xem hệ thống dưới góc độ quản lý: số lượng người dùng, danh mục món ăn, giá nguyên liệu và các lối tắt điều hành.' : 'Admin sees the system from a management angle: user count, meal inventory, ingredient pricing, and quick paths into moderation flows.')
                : user
                  ? (language === 'vi' ? 'Trang chủ của bạn tích hợp lập kế hoạch cá nhân, lịch sử đã lưu và độ rõ ràng ngân sách tại một nơi.' : 'Your homepage now puts personal planning, saved history, and budget clarity in one place so each return feels familiar.')
                  : (language === 'vi' ? 'Tìm kiếm món ăn, xây dựng kế hoạch dinh dưỡng và biến việc ăn uống hàng ngày thành dữ liệu dễ theo dõi.' : 'Search meals, build a planner, and turn daily eating into something easier to track and easier to keep.')
            }
          />

          <div className="home-personal-card__grid">
            <div className="home-kpi-card tw-lift caustic-blue">
              <span>{isAdmin ? (language === 'vi' ? 'Người dùng đã đăng ký' : 'Registered users') : (language === 'vi' ? 'Số ngày đã lưu' : 'Saved days')}</span>
              <strong>{formatNumber(isAdmin ? adminUsersOverview.length : savedDays.size)}</strong>
              <p>
                {isAdmin
                  ? (language === 'vi' ? 'Tổng số người dùng thông thường hiện có trong hệ thống.' : 'Total regular users currently registered in the system.')
                  : (language === 'vi' ? 'Số lượng ngày đã có thực đơn dinh dưỡng đi kèm.' : 'Days with real meal history attached to your account.')}
              </p>
            </div>
            <div className="home-kpi-card tw-lift caustic-blue">
              <span>{language === 'vi' ? 'Món ăn hiện có' : 'Meals available'}</span>
              <strong>{formatNumber(meals.length)}</strong>
              <p>{language === 'vi' ? 'Thư viện món ăn phong phú giúp bạn tra cứu và sử dụng lại bất cứ lúc nào.' : 'A growing meal library you can search and reuse anytime.'}</p>
            </div>
            <div className="home-kpi-card tw-lift caustic-blue">
              <span>{isAdmin ? (language === 'vi' ? 'Giá cơ sở nguyên liệu' : 'Pricing baseline') : (language === 'vi' ? 'Đề xuất ngân sách tuần' : 'Weekly budget hint')}</span>
              <strong>
                {minCost
                  ? formatCurrency(recommendedFamilyBudget || minCost.minCostPerPerson)
                  : (language === 'vi' ? 'Đang cập nhật...' : 'Updating...')}
              </strong>
              <p>
                {isAdmin
                  ? (language === 'vi' ? 'Giá cơ sở giúp Admin kiểm tra thuật toán chi phí hệ thống.' : 'This pricing baseline helps admin review the system cost logic.')
                  : (language === 'vi' ? 'Gợi ý ngân sách tuần tối ưu dựa trên dữ liệu giá cả nguyên liệu thực tế.' : 'Budget guidance based on your current ingredient pricing data.')}
              </p>
            </div>
            <div className="home-kpi-card tw-lift caustic-blue">
              <span>{language === 'vi' ? 'Chế độ tài khoản' : 'Account mode'}</span>
              <strong>{user ? (isAdmin ? t('admin') : (language === 'vi' ? 'Cá nhân' : 'Personal')) : t('guest')}</strong>
              <p>
                {user
                  ? (language === 'vi' ? 'Thanh điều hướng và chức năng được cấu hình linh hoạt theo phiên của bạn.' : 'Your navigation and actions now adapt around your session.')
                  : (language === 'vi' ? 'Đăng nhập để mở khóa các tính năng lập kế hoạch cá nhân hóa và lịch sử.' : 'Sign in to unlock personalized planning and saved history.')}
              </p>
            </div>
          </div>

          <div className="action-row">
            <Link className="primary-button" to={isAdmin ? '/history' : user ? '/planner' : '/auth'}>
              {isAdmin ? (language === 'vi' ? 'Quản lý người dùng' : 'Manage registered users') : user ? (language === 'vi' ? 'Lập thực đơn mới' : 'Plan a new day') : (language === 'vi' ? 'Đăng nhập để cá nhân hóa' : 'Log in to personalize')}
            </Link>
            <Link className="ghost-button" to={isAdmin ? '/library' : user ? '/history' : '/library'}>
              {isAdmin ? (language === 'vi' ? 'Quản lý món ăn' : 'Manage meals') : user ? (language === 'vi' ? 'Xem lại lịch sử' : 'Review your history') : (language === 'vi' ? 'Khám phá thư viện' : 'Explore meal library')}
            </Link>
          </div>
        </div>

        <div className="home-editorial-card tw-lift caustic-purple">
          <span className="eyebrow eyebrow--soft">{isAdmin ? (language === 'vi' ? 'Ghi chú Admin' : 'Admin note') : (language === 'vi' ? 'Ghi chú từ SonE' : 'A note from SonE')}</span>
          <h2>
            {isAdmin
              ? (language === 'vi' ? 'Góc nhìn Admin tập trung vào kiểm soát, trực quan và sạch sẽ.' : 'The admin view focuses on control, clarity, and clean operations.')
              : (language === 'vi' ? 'Chúng tôi đang xây dựng một người bạn đồng hành ăn uống hiện đại, không chỉ là danh sách món ăn.' : 'We are building a modern meal companion, not just a list of dishes.')}
          </h2>
          <p>
            {isAdmin
              ? (language === 'vi' ? 'Thay vì hiển thị công cụ lập kế hoạch cá nhân hay gia đình, trang chủ Admin nhấn mạnh vào kiểm duyệt: quản lý món ăn, người dùng và duy trì giá cả nguyên liệu ít xao nhãng nhất.' : 'Instead of showing personal planning and family actions, the admin homepage now emphasizes moderation: managing meals, checking registered users, and maintaining ingredient pricing with fewer distractions.')
              : (language === 'vi' ? 'SonE kết hợp khám phá món ăn, theo dõi cá nhân, chi tiết giá cả và thực đơn gia đình vào một trải nghiệm rõ ràng. Thay vì nhảy qua lại giữa nhiều công cụ, bạn có thể tìm kiếm món ăn, lập kế hoạch và tối ưu hóa ngân sách.' : 'SonE combines meal discovery, personal tracking, pricing insight, and family planning into one clear experience. Instead of jumping between separate tools, you can search a meal, add structure to your eating routine, and keep your decisions grounded in both nutrition and budget.')}
          </p>
          <p>
            {isAdmin
              ? (language === 'vi' ? 'Điều đó giữ vai trò Admin tập trung vào bảo trì hệ thống thay vì tiêu thụ nội dung. Các tính năng lập kế hoạch cá nhân và thực đơn tuần gia đình vẫn được ưu tiên riêng cho các tài khoản người dùng.' : 'That keeps the admin role aligned with system maintenance rather than user consumption. Personal meal planning, family budget creation, and daily routine features stay reserved for regular accounts.')
              : (language === 'vi' ? 'Giao diện tương thích cao với người dùng: Một người dùng quay lại sẽ thấy nhịp độ lưu trữ của riêng họ, Admin thấy vị trí cần kiểm soát giá cả, còn người dùng gia đình nhận được kế hoạch cân đối ngân sách.' : 'That makes the product feel more personal for each account. A returning user sees their own saved rhythm. An admin sees where pricing control matters. A family-focused user gets budget-aware planning. The interface becomes less generic and more reflective of how each person actually uses food data day to day.')}
          </p>
        </div>
      </section>

      <section className="panel panel--full">
        <SectionHeading
          eyebrow={language === 'vi' ? 'Khám phá theo danh mục' : 'Browse by mood'}
          title={language === 'vi' ? `Chúng tôi có ${formatNumber(meals.length)} món ăn phân chia qua ${formatNumber(mealGroups.length)} nhóm đa dạng` : `We already have ${formatNumber(meals.length)} meals across ${formatNumber(mealGroups.length)} diverse groups`}
          description={language === 'vi' ? 'Mỗi danh mục mở ra góc nhìn trực quan về các món ăn, hiển thị một số công thức tiêu biểu để người dùng dễ lựa chọn.' : "Each collection opens a cleaner view into SonE's meal diversity, with a few real dishes surfaced so users understand what each shelf actually contains."}
        />

        <div className="home-collections-grid">
          {highlightedGroups.map((item) => (
            <Link
              className="collection-card tw-lift caustic-emerald gradient-border-card"
              key={item.group}
              to={`/library?group=${encodeURIComponent(item.group)}`}
              onClick={() => setMealQuery('')}
            >
              <div className="collection-card__image-wrap">
                <img
                  alt={item.group}
                  className="collection-card__image"
                  src={resolveImageUrl(item.cover?.image_url, item.cover?.name || item.group, item.group)}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = '/images/Salad%20rau%20c%E1%BB%A7.jpg';
                  }}
                />
              </div>
              <div className="collection-card__content">
                <span className="chip chip--outline">{item.count} {language === 'vi' ? 'món ăn' : 'meals'}</span>
                <h3>{getGroupLabel(item.group)}</h3>
                <p>
                  {language === 'vi' ? 'Món tiêu biểu: ' : 'Example meals: '}{item.samples[0] || 'Sample meal'}
                  {item.samples[1] ? `, ${item.samples[1]}` : ''}.
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel panel--full home-feature-layout">
        <div className="home-feature-main">
          <SectionHeading
            eyebrow={language === 'vi' ? 'Gợi ý cho bạn' : 'Personal picks'}
            title={user ? (language === 'vi' ? `Lựa chọn mới cho ${accountName}` : `Fresh choices for ${accountName}`) : (language === 'vi' ? 'Gợi ý món ăn để bắt đầu tuần mới' : 'Fresh choices to start your week')}
            description={language === 'vi' ? 'Nguồn cấp dữ liệu món ăn giúp trang chủ sống động, hữu ích và trực quan hơn.' : 'A tighter visual feed that makes the homepage feel alive, useful, and worth coming back to.'}
          />

          <div className="home-meal-grid">
            {personalizedMeals.map((meal) => (
                <Link
                  className="home-meal-card tw-lift caustic-blue"
                  key={meal._id || meal.name}
                  to={`/library?meal=${encodeURIComponent(meal._id || meal.name)}&search=${encodeURIComponent(meal.name)}`}
                  onClick={() => setMealQuery(meal.name)}
                >
                  <div className="home-meal-card__image-wrap">
                  <img
                    alt={meal.name}
                    className="home-meal-card__image"
                    src={resolveImageUrl(meal.image_url, meal.name, meal.group)}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = '/images/Salad%20rau%20c%E1%BB%A7.jpg';
                    }}
                  />
                  </div>
                <div className="home-meal-card__body">
                  <span className="chip chip--outline">{getGroupLabel(meal.group)}</span>
                  <h3>{meal.name}</h3>
                  <p>{meal.instructions}</p>
                  <div className="home-meal-card__meta">
                    <span>{meal.calories || 0} kcal</span>
                    <strong>{language === 'vi' ? 'Xem món ăn' : 'Open meal'}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="home-feature-side">
          <span className="eyebrow eyebrow--soft">{language === 'vi' ? 'Xu hướng tại SonE' : 'Trending inside SonE'}</span>
          {editorialMeals.map((meal, index) => (
            <Link
              className="story-mini-card tw-lift caustic-purple"
              key={meal._id || meal.name}
              to={`/library?meal=${encodeURIComponent(meal._id || meal.name)}&search=${encodeURIComponent(meal.name)}`}
              onClick={() => setMealQuery(meal.name)}
            >
              <div className="story-mini-card__text">
                <span>{language === 'vi' ? `Gợi ý ${index + 1}` : `Story ${index + 1}`}</span>
                <h3>{meal.name}</h3>
                <p>
                  {language === 'vi' 
                    ? `Món ăn thuộc nhóm ${getGroupLabel(meal.group)} chứa khoảng ${meal.calories || 0} calo với dưỡng chất tối ưu.`
                    : `${getGroupLabel(meal.group)} meal with ${meal.calories || 0} kcal and a strong visual identity.`}
                </p>
              </div>
              <img
                alt={meal.name}
                className="story-mini-card__image"
                src={resolveImageUrl(meal.image_url, meal.name, meal.group)}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/images/Salad%20rau%20c%E1%BB%A7.jpg';
                }}
              />
            </Link>
          ))}
        </aside>
      </section>

      <section className="panel panel--full">
        <SectionHeading
          eyebrow={language === 'vi' ? 'Phổ biến nhất tuần này' : 'Most popular this week'}
          title={language === 'vi' ? 'Những công thức được nhiều người tìm kiếm lại' : 'A wider rail of meals people would actually want to revisit'}
          description={language === 'vi' ? 'Các lựa chọn dinh dưỡng nổi bật giúp nâng cao sức khỏe và duy trì cân nặng.' : 'This section gives your homepage a more modern, product-led rhythm instead of looking like a static admin page.'}
        />

        <div className="popular-rail">
          {popularMeals.map((meal) => (
            <Link
              className="popular-rail__card tw-lift caustic-emerald"
              key={meal._id || meal.name}
              to={`/library?meal=${encodeURIComponent(meal._id || meal.name)}&search=${encodeURIComponent(meal.name)}`}
              onClick={() => setMealQuery(meal.name)}
            >
              <img
                alt={meal.name}
                className="popular-rail__image"
                src={resolveImageUrl(meal.image_url, meal.name, meal.group)}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/images/Salad%20rau%20c%E1%BB%A7.jpg';
                }}
              />
              <div className="popular-rail__content">
                <h3>{meal.name}</h3>
                <p>{getGroupLabel(meal.group)}</p>
                <div className="popular-rail__meta">
                  <span>{meal.calories || 0} kcal</span>
                  <span>{meal.protein || 0}g {language === 'vi' ? 'đạm' : 'protein'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {isAdmin ? null : (
        <section className="panel panel--full newsletter-panel caustic-blue">
          <div className="newsletter-panel__copy">
            <span className="eyebrow eyebrow--soft">{language === 'vi' ? 'Theo sát tiến trình của bạn' : 'Stay close to your progress'}</span>
            <h2>{language === 'vi' ? 'Giúp SonE đồng hành cùng bạn tiện lợi, nhất quán mỗi ngày.' : 'Keep SonE feeling personal, practical, and consistent every week.'}</h2>
            <p>
              {user
                ? (language === 'vi' 
                    ? `Tài khoản ${maskEmail(user.email)} đã lưu trữ ${historyRecords.length} thực đơn. Hãy quay lại thường xuyên để tối ưu kế hoạch ăn uống và kiểm soát chi tiêu tốt hơn.`
                    : `${maskEmail(user.email)} currently has ${historyRecords.length} saved meal plans. Come back often to refine your planner, compare your history, and keep your food budget more intentional.`)
                : (language === 'vi'
                    ? 'Đăng ký tài khoản để lưu lại nhật ký dinh dưỡng, lên thực đơn tuần tự động và cá nhân hóa trải nghiệm của bạn.'
                    : 'Create an account to save your meal rhythm, revisit your favorite dishes, and make the homepage feel tailored to you instead of generic to everyone.')}
            </p>
          </div>

          <div className="newsletter-panel__actions">
            <Link className="primary-button" to={user ? '/planner' : '/auth'}>
              {user ? (language === 'vi' ? 'Tiếp tục lập thực đơn' : 'Continue with planner') : (language === 'vi' ? 'Đăng ký tài khoản' : 'Create your account')}
            </Link>
            <Link className="ghost-button" to="/family">
              {language === 'vi' ? 'Bảng giá gia đình' : 'Open family budget'}
            </Link>
          </div>
        </section>
      )}
    </>
  )
}

export default OverviewPage
