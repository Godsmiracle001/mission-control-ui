import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Radio,
  MapPin,
  Moon,
  Sun,
  Filter,
  Search,
  Bell,
  X,
  BarChart3,
  Layers,
  Signal,
  Battery,
  Zap,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default Leaflet marker icons in bundlers like Vite
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type MissionStatus = 'active' | 'completed' | 'standby' | 'charging' | 'maintenance';
type Priority = 'high' | 'medium' | 'low';

type ToastType = 'success' | 'warning' | 'info';

interface Location {
  lat: number;
  lng: number;
}

interface Mission {
  id: string;
  name: string;
  status: MissionStatus;
  progress: number;
  asset: string;
  priority: Priority;
  eta: string;
  location: Location;
  altitude: number;
  speed: number;
  battery: number;
}

interface Asset {
  id: string;
  type: string;
  status: string;
  battery: number;
  signal: number;
  missions: number;
}

type AlertSeverity = 'high' | 'medium' | 'low';
type AlertKind = 'warning' | 'critical' | 'info';

interface Alert {
  id: number;
  type: AlertKind;
  message: string;
  time: string;
  severity: AlertSeverity;
}

type ActivityType = 'mission' | 'asset' | 'system';

interface ActivityItem {
  id: number;
  event: string;
  time: string;
  type: ActivityType;
}

interface Stats {
  activeMissions: number;
  totalAssets: number;
  systemHealth: number;
  successRate: number;
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface Theme {
  bg: string;
  text: string;
  textSecondary: string;
  card: string;
  cardHover: string;
  input: string;
}

const MissionControl: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics' | 'assets' | 'map' | 'timeline'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | MissionStatus | 'completed'>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 'M-001',
      name: 'Phoenix Recon',
      status: 'active',
      progress: 67,
      asset: 'UAV-7',
      priority: 'high',
      eta: '12m',
      location: { lat: 6.5244, lng: 3.3792 },
      altitude: 120,
      speed: 45,
      battery: 67,
    },
    {
      id: 'M-002',
      name: 'Atlas Survey',
      status: 'active',
      progress: 34,
      asset: 'UAV-3',
      priority: 'medium',
      eta: '28m',
      location: { lat: 6.4698, lng: 3.5852 },
      altitude: 95,
      speed: 38,
      battery: 82,
    },
    {
      id: 'M-003',
      name: 'Titan Delivery',
      status: 'completed',
      progress: 100,
      asset: 'UAV-12',
      priority: 'low',
      eta: '0m',
      location: { lat: 6.6018, lng: 3.3515 },
      altitude: 0,
      speed: 0,
      battery: 34,
    },
    {
      id: 'M-004',
      name: 'Orion Patrol',
      status: 'standby',
      progress: 0,
      asset: 'UAV-5',
      priority: 'medium',
      eta: '45m',
      location: { lat: 6.4333, lng: 3.4167 },
      altitude: 0,
      speed: 0,
      battery: 100,
    },
    {
      id: 'M-005',
      name: 'Hermes Express',
      status: 'active',
      progress: 89,
      asset: 'UAV-9',
      priority: 'high',
      eta: '6m',
      location: { lat: 6.5355, lng: 3.3087 },
      altitude: 110,
      speed: 52,
      battery: 45,
    },
  ]);

  const [assets] = useState<Asset[]>([
    { id: 'UAV-7', type: 'Reconnaissance', status: 'active', battery: 67, signal: 95, missions: 127 },
    { id: 'UAV-3', type: 'Survey', status: 'active', battery: 82, signal: 88, missions: 98 },
    { id: 'UAV-12', type: 'Delivery', status: 'charging', battery: 34, signal: 100, missions: 203 },
    { id: 'UAV-5', type: 'Patrol', status: 'standby', battery: 100, signal: 100, missions: 156 },
    { id: 'UAV-9', type: 'Express', status: 'active', battery: 45, signal: 92, missions: 87 },
    { id: 'UAV-14', type: 'Cargo', status: 'maintenance', battery: 0, signal: 0, missions: 234 },
  ]);

  const [alerts] = useState<Alert[]>([
    { id: 1, type: 'warning', message: 'Low battery detected on UAV-7', time: '2m ago', severity: 'medium' },
    { id: 2, type: 'critical', message: 'Weather alert in Zone B', time: '5m ago', severity: 'high' },
    { id: 3, type: 'info', message: 'Mission M-003 completed successfully', time: '8m ago', severity: 'low' },
  ]);

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([
    { id: 1, event: 'Mission M-001 entered Zone A', time: '1m ago', type: 'mission' },
    { id: 2, event: 'UAV-7 battery at 70%', time: '3m ago', type: 'asset' },
    { id: 3, event: 'New mission M-005 initiated', time: '7m ago', type: 'mission' },
    { id: 4, event: 'System health check completed', time: '10m ago', type: 'system' },
  ]);

  const [stats, setStats] = useState<Stats>({
    activeMissions: 3,
    totalAssets: 24,
    systemHealth: 97,
    successRate: 94.2,
  });

  const chartData = [
    { time: '00:00', missions: 4, efficiency: 92 },
    { time: '04:00', missions: 2, efficiency: 95 },
    { time: '08:00', missions: 8, efficiency: 88 },
    { time: '12:00', missions: 12, efficiency: 91 },
    { time: '16:00', missions: 9, efficiency: 94 },
    { time: '20:00', missions: 6, efficiency: 96 },
  ];

  const statusData = [
    { name: 'Active', value: 3, color: '#10b981' },
    { name: 'Standby', value: 2, color: '#f59e0b' },
    { name: 'Charging', value: 1, color: '#3b82f6' },
  ];

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMissions((prev) =>
        prev.map((m) => {
          if (m.status === 'active' && m.progress < 100) {
            const newProgress = Math.min(100, m.progress + Math.random() * 2);
            if (newProgress >= 100 && m.progress < 100) {
              showToast(`Mission ${m.id} completed!`, 'success');
            }
            return {
              ...m,
              progress: newProgress,
              battery: Math.max(20, m.battery - Math.random() * 0.5),
            };
          }
          return m;
        }),
      );

      setStats((prev) => ({
        ...prev,
        systemHealth: Math.max(95, Math.min(99, prev.systemHealth + (Math.random() - 0.5) * 0.5)),
      }));

      if (Math.random() > 0.7) {
        const events = ['Telemetry update received', 'Route optimized', 'Weather sync', 'Position updated'];
        const newActivity: ActivityItem = {
          id: Date.now(),
          event: events[Math.floor(Math.random() * events.length)],
          time: 'Just now',
          type: ['mission', 'asset', 'system'][Math.floor(Math.random() * 3)] as ActivityType,
        };
        setActivityFeed((prev) => [newActivity, ...prev.slice(0, 9)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: MissionStatus) => {
    const colors: Record<MissionStatus, string> = {
      active: 'from-emerald-500 to-teal-500',
      completed: 'from-blue-500 to-cyan-500',
      standby: 'from-amber-500 to-orange-500',
      charging: 'from-purple-500 to-pink-500',
      maintenance: 'from-gray-500 to-slate-500',
    };
    return colors[status] || 'from-gray-500 to-slate-500';
  };

  const getPriorityColor = (priority: Priority) => {
    const colors: Record<Priority, string> = {
      high: 'text-red-400 bg-red-950/30 border-red-800',
      medium: 'text-amber-400 bg-amber-950/30 border-amber-800',
      low: 'text-emerald-400 bg-emerald-950/30 border-emerald-800',
    };
    return colors[priority];
  };

  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || m.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const theme: Theme = {
    bg: darkMode
      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
      : 'bg-slate-50',
    text: darkMode ? 'text-gray-100' : 'text-slate-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-slate-500',
    card: darkMode
      ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50'
      : 'bg-white border-slate-200',
    cardHover: darkMode ? 'hover:border-slate-600/50' : 'hover:border-slate-300',
    input: darkMode
      ? 'bg-slate-800 border-slate-700 text-gray-100'
      : 'bg-white border-slate-300 text-slate-900',
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-4 md:p-6 transition-colors duration-500`}>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-lg border ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 border-emerald-700'
                : toast.type === 'warning'
                  ? 'bg-amber-900/90 border-amber-700'
                  : 'bg-blue-900/90 border-blue-700'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1
                className={`text-2xl md:text-3xl font-bold ${
                  darkMode
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'
                    : 'text-slate-900'
                }`}
              >
                NEXUS Command Center
              </h1>
              <p className={`text-xs md:text-sm ${theme.textSecondary}`}>Real-time Operations Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${theme.card} border backdrop-blur-sm ${theme.cardHover} transition-all`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-emerald-950/30 border-emerald-800'
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  darkMode ? 'bg-emerald-400' : 'bg-emerald-500'
                }`}
              />
              <span className="text-sm text-emerald-500 font-medium">Operational</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', icon: Activity, label: 'Dashboard' },
            { id: 'timeline', icon: Clock, label: 'Timeline' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'assets', icon: Layers, label: 'Assets' },
            { id: 'map', icon: MapPin, label: 'Live Map' },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as typeof activeView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeView === view.id
                  ? 'bg-cyan-600 text-white'
                  : `${theme.card} border backdrop-blur-sm ${theme.cardHover}`
              }`}
            >
              <view.icon className="w-4 h-4" />
              <span className="text-sm">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
        {[
          { icon: Activity, label: 'Active', value: stats.activeMissions, color: 'from-emerald-500 to-teal-500', suffix: '' },
          { icon: Globe, label: 'Assets', value: stats.totalAssets, color: 'from-blue-500 to-cyan-500', suffix: '' },
          { icon: Zap, label: 'Health', value: stats.systemHealth, color: 'from-purple-500 to-pink-500', suffix: '%' },
          { icon: TrendingUp, label: 'Success', value: stats.successRate, color: 'from-amber-500 to-orange-500', suffix: '%' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl ${theme.card} border backdrop-blur-sm p-4 md:p-6 ${theme.cardHover} transition-all group`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-inner`}>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className={`w-8 md:w-10 h-8 md:h-10 rounded-lg bg-gradient-to-br ${stat.color} opacity-20`} />
              </div>
              <div className="text-xl md:text-3xl font-bold mb-1">
                {typeof stat.value === 'number'
                  ? stat.value.toFixed(stat.suffix ? 1 : 0)
                  : stat.value}
                {stat.suffix}
              </div>
              <div className={`text-xs md:text-sm ${theme.textSecondary}`}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 rounded-xl ${theme.card} border backdrop-blur-sm p-4 md:p-6`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className={`text-lg md:text-xl font-bold ${theme.text}`}>Active Missions</h2>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:flex-initial">
                  <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textSecondary}`}
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full md:w-64 pl-10 pr-4 py-2 rounded-lg ${theme.input} border focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm`}
                  />
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg ${theme.card} border ${theme.cardHover} transition-all`}
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['all', 'active', 'standby', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as typeof filterStatus)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      filterStatus === status ? 'bg-cyan-600 text-white' : `${theme.card} border`
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3 md:space-y-4 max-h-[600px] overflow-y-auto">
              {filteredMissions.map((mission) => (
                <div
                  key={mission.id}
                  className={`group relative overflow-hidden rounded-lg ${theme.card} border backdrop-blur-sm p-4 ${theme.cardHover} transition-all`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${getStatusColor(mission.status)} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs md:text-sm ${theme.textSecondary} font-mono`}>
                            {mission.id}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(
                              mission.priority,
                            )}`}
                          >
                            {mission.priority.toUpperCase()}
                          </span>
                        </div>
                        <h3 className={`text-base md:text-lg font-semibold ${theme.text} mb-2`}>
                          {mission.name}
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <MapPin className={`w-3 h-3 ${theme.textSecondary}`} />
                            <span className={`text-xs ${theme.textSecondary}`}>{mission.asset}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Battery
                              className={`w-3 h-3 ${
                                mission.battery < 30 ? 'text-red-400' : theme.textSecondary
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                mission.battery < 30 ? 'text-red-400' : theme.textSecondary
                              }`}
                            >
                              {Math.round(mission.battery)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Signal className={`w-3 h-3 ${theme.textSecondary}`} />
                            <span className={`text-xs ${theme.textSecondary}`}>
                              {mission.speed} km/h
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {mission.status === 'active' && (
                          <>
                            <Clock className={`w-4 h-4 ${theme.textSecondary}`} />
                            <span className={`text-sm ${theme.textSecondary}`}>{mission.eta}</span>
                          </>
                        )}
                        {mission.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={theme.textSecondary}>Progress</span>
                        <span className={`${theme.text} font-medium`}>
                          {Math.round(mission.progress)}%
                        </span>
                      </div>
                      <div
                        className={`h-2 ${
                          darkMode ? 'bg-slate-900' : 'bg-gray-200'
                        } rounded-full overflow-hidden`}
                      >
                        <div
                          className={`h-full bg-gradient-to-r ${getStatusColor(
                            mission.status,
                          )} transition-all duration-500`}
                          style={{ width: `${mission.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-xl ${theme.card} border backdrop-blur-sm p-4 md:p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className={`text-base md:text-lg font-bold ${theme.text}`}>Alerts</h2>
              </div>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-lg p-3 border ${
                      alert.severity === 'high'
                        ? 'bg-red-950/30 border-red-800'
                        : alert.severity === 'medium'
                          ? 'bg-amber-950/30 border-amber-800'
                          : 'bg-blue-950/30 border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 mt-2 rounded-full ${
                          alert.severity === 'high'
                            ? 'bg-red-400'
                            : alert.severity === 'medium'
                              ? 'bg-amber-400'
                              : 'bg-blue-400'
                        }`}
                      />
                      <div className="flex-1">
                        <p className={`text-xs md:text-sm ${theme.text}`}>{alert.message}</p>
                        <p className={`text-xs ${theme.textSecondary} mt-1`}>{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-xl ${theme.card} border backdrop-blur-sm p-4 md:p-6`}>
              <h2 className={`text-base md:text-lg font-bold ${theme.text} mb-4`}>Activity</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 mt-2 rounded-full ${
                        activity.type === 'mission'
                          ? 'bg-cyan-400'
                          : activity.type === 'asset'
                            ? 'bg-emerald-400'
                            : 'bg-purple-400'
                      }`}
                    />
                    <div className="flex-1">
                      <p className={`text-xs md:text-sm ${theme.text}`}>{activity.event}</p>
                      <p className={`text-xs ${theme.textSecondary}`}>{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {activeView === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-xl ${theme.card} border backdrop-blur-sm p-6`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-6`}>Mission Activity (24h)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? '#334155' : '#e5e7eb'}
                />
                <XAxis dataKey="time" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#fff',
                    border: '1px solid #334155',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="missions"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#colorMissions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-xl ${theme.card} border backdrop-blur-sm p-6`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-6`}>Efficiency Score</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? '#334155' : '#e5e7eb'}
                />
                <XAxis dataKey="time" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                <YAxis
                  stroke={darkMode ? '#94a3b8' : '#6b7280'}
                  domain={[80, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#fff',
                    border: '1px solid #334155',
                  }}
                />
                <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-xl ${theme.card} border backdrop-blur-sm p-6`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-6`}>Asset Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-xl ${theme.card} border backdrop-blur-sm p-6`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-6`}>Performance Metrics</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className={theme.textSecondary}>Uptime</span>
                  <span className={theme.text}>99.7%</span>
                </div>
                <div
                  className={`h-2 ${
                    darkMode ? 'bg-slate-900' : 'bg-gray-200'
                  } rounded-full overflow-hidden`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: '99.7%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className={theme.textSecondary}>Avg Response Time</span>
                  <span className={theme.text}>124ms</span>
                </div>
                <div
                  className={`h-2 ${
                    darkMode ? 'bg-slate-900' : 'bg-gray-200'
                  } rounded-full overflow-hidden`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: '88%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className={theme.textSecondary}>Mission Success</span>
                  <span className={theme.text}>94.2%</span>
                </div>
                <div
                  className={`h-2 ${
                    darkMode ? 'bg-slate-900' : 'bg-gray-200'
                  } rounded-full overflow-hidden`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: '94.2%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mission Timeline View */}
      {activeView === 'timeline' && (
        <div className={`rounded-xl ${theme.card} border backdrop-blur-sm p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className={`text-xl font-bold ${theme.text}`}>Mission Timeline</h2>
            </div>
            <span className={`text-xs ${theme.textSecondary}`}>
              Visualizing lifecycle from standby to completion.
            </span>
          </div>

          <div className="space-y-4 max-h-[520px] overflow-y-auto">
            {missions
              .slice()
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((mission) => {
                const stages: { key: MissionStatus | 'completed'; label: string }[] = [
                  { key: 'standby', label: 'Standby' },
                  { key: 'active', label: 'Active' },
                  { key: 'completed', label: 'Completed' },
                ];

                const currentStageIndex =
                  mission.status === 'completed'
                    ? 2
                    : mission.status === 'active'
                      ? 1
                      : 0;

                return (
                  <div
                    key={mission.id}
                    className={`rounded-xl ${theme.card} border p-4 md:p-5 ${theme.cardHover} transition-all`}
                  >
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-mono ${theme.textSecondary}`}>
                            {mission.id}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(
                              mission.priority,
                            )}`}
                          >
                            {mission.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className={`text-sm md:text-base font-semibold ${theme.text}`}>
                          {mission.name}
                        </p>
                      </div>
                      <div className="text-right text-xs md:text-sm">
                        <p className={theme.textSecondary}>ETA</p>
                        <p className={theme.text}>{mission.eta}</p>
                      </div>
                    </div>

                    {/* Stage timeline */}
                    <div className="flex items-center gap-3 md:gap-4 mb-3">
                      {stages.map((stage, index) => {
                        const isActive = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;

                        return (
                          <div key={stage.key} className="flex items-center gap-2 flex-1">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${
                                isActive
                                  ? 'bg-cyan-600/90 border-cyan-400 text-white'
                                  : darkMode
                                    ? 'bg-slate-900 border-slate-600 text-slate-400'
                                    : 'bg-gray-100 border-gray-300 text-gray-500'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p
                                className={`text-xs font-medium ${
                                  isCurrent
                                    ? 'text-cyan-400'
                                    : isActive
                                      ? theme.text
                                      : theme.textSecondary
                                }`}
                              >
                                {stage.label}
                              </p>
                              {isCurrent && (
                                <p className={`text-[11px] ${theme.textSecondary}`}>
                                  {mission.status === 'active'
                                    ? `In progress — ${Math.round(mission.progress)}%`
                                    : mission.status === 'completed'
                                      ? 'Successfully completed'
                                      : 'Awaiting activation'}
                                </p>
                              )}
                            </div>

                            {index < stages.length - 1 && (
                              <div
                                className={`hidden md:block h-px flex-1 ${
                                  isActive
                                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                                    : darkMode
                                      ? 'bg-slate-700'
                                      : 'bg-gray-300'
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] md:text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span className={theme.textSecondary}>{mission.asset}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Battery
                          className={`w-3 h-3 ${
                            mission.battery < 30 ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        />
                        <span
                          className={
                            mission.battery < 30 ? 'text-red-400' : theme.textSecondary
                          }
                        >
                          {Math.round(mission.battery)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Signal className="w-3 h-3 text-sky-400" />
                        <span className={theme.textSecondary}>{mission.speed} km/h</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span className={theme.textSecondary}>
                          {mission.status === 'active'
                            ? 'Telemetry live'
                            : mission.status === 'completed'
                              ? 'Mission closed'
                              : 'On standby'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Simple placeholders for Assets and Map views so navigation feels complete */}
      {activeView === 'assets' && (
        <div className={`rounded-xl ${theme.card} border backdrop-blur-sm p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2 className={`text-xl font-bold ${theme.text}`}>Assets Overview</h2>
            </div>
            <span className={`text-sm ${theme.textSecondary}`}>{assets.length} Assets</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className={`rounded-lg ${theme.card} border backdrop-blur-sm p-4 ${theme.cardHover} transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={`text-sm font-semibold ${theme.text}`}>{asset.id}</p>
                    <p className={`text-xs ${theme.textSecondary}`}>{asset.type}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      asset.status === 'active'
                        ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-700'
                        : asset.status === 'standby'
                          ? 'bg-amber-950/30 text-amber-400 border border-amber-700'
                          : asset.status === 'charging'
                            ? 'bg-blue-950/30 text-blue-400 border border-blue-700'
                            : 'bg-slate-900/50 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {asset.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={theme.textSecondary}>Battery</span>
                    <span
                      className={
                        asset.battery < 30 ? 'text-red-400' : theme.textSecondary
                      }
                    >
                      {asset.battery}%
                    </span>
                  </div>
                  <div
                    className={`h-1.5 ${
                      darkMode ? 'bg-slate-900' : 'bg-gray-200'
                    } rounded-full overflow-hidden`}
                  >
                    <div
                      className={`h-full bg-gradient-to-r ${
                        asset.battery < 30
                          ? 'from-red-500 to-rose-500'
                          : 'from-emerald-500 to-teal-500'
                      }`}
                      style={{ width: `${asset.battery}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={theme.textSecondary}>Signal</span>
                    <span className={theme.textSecondary}>{asset.signal}%</span>
                  </div>
                  <div
                    className={`h-1.5 ${
                      darkMode ? 'bg-slate-900' : 'bg-gray-200'
                    } rounded-full overflow-hidden`}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-blue-500"
                      style={{ width: `${asset.signal}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={theme.textSecondary}>Missions</span>
                    <span className={theme.text}>{asset.missions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'map' && (
        <div className={`rounded-xl ${theme.card} border backdrop-blur-sm p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <h2 className={`text-xl font-bold ${theme.text}`}>Live Asset Map</h2>
            </div>
            <span className={`text-xs ${theme.textSecondary}`}>
              Click a marker to inspect mission context.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <div className="relative h-[320px] md:h-[420px] rounded-xl overflow-hidden border border-slate-700/60">
                <MapContainer
                  center={[6.52, 3.4]}
                  zoom={11}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {missions.map((mission) => (
                    <Marker
                      key={mission.id}
                      position={[mission.location.lat, mission.location.lng]}
                    >
                      <Popup>
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{mission.name}</p>
                          <p>ID: {mission.id}</p>
                          <p>Status: {mission.status}</p>
                          <p>Asset: {mission.asset}</p>
                          <p>Progress: {Math.round(mission.progress)}%</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className={`font-semibold ${theme.text}`}>Legend</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className={theme.textSecondary}>Active missions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className={theme.textSecondary}>Standby / patrol</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span className={theme.textSecondary}>Recently completed</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className={`font-semibold ${theme.text}`}>Quick Glance</p>
                <p className={theme.textSecondary}>
                  {missions.filter((m) => m.status === 'active').length} assets currently in
                  flight around your Lagos AOI.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionControl;


