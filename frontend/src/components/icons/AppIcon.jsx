import {
  BookOutlined,
  CoffeeOutlined,
  DatabaseOutlined,
  HomeOutlined,
  LockOutlined,
  LogoutOutlined,
  MoonOutlined,
  ReadOutlined,
  SearchOutlined,
  SettingOutlined,
  StarOutlined,
  SunOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'

const iconMap = {
  auth: UserOutlined,
  family: TeamOutlined,
  history: BookOutlined,
  home: HomeOutlined,
  library: ReadOutlined,
  lock: LockOutlined,
  logout: LogoutOutlined,
  planner: CoffeeOutlined,
  pricing: DatabaseOutlined,
  search: SearchOutlined,
  settings: SettingOutlined,
  spark: StarOutlined,
  sun: SunOutlined,
  moon: MoonOutlined,
}

function AppIcon({ className = '', name, size = 20 }) {
  const IconComponent = iconMap[name] || StarOutlined

  return <IconComponent aria-hidden="true" className={className} style={{ fontSize: size }} />
}

export default AppIcon
