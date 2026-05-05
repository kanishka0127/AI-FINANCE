import { Alert } from '../Dashboard';
import { AlertTriangle, AlertCircle, Info, Shield, CheckCircle } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface AlertsProps {
  alerts: Alert[];
  onRefresh: () => void;
}

export const Alerts = ({ alerts, onRefresh }: AlertsProps) => {
  const { user } = useAuth();

  const markAsRead = async (id: string) => {
    if (!user) return;
    const alertRef = ref(db, `alerts/${user.uid}/${id}`);
    await update(alertRef, { is_read: true });
    onRefresh();
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getAlertColors = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: 'text-orange-600',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
        };
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.is_read);
  const readAlerts = alerts.filter((a) => a.is_read);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Alerts & Notifications</h2>
        <p className="text-gray-600">
          {unreadAlerts.length} unread alert{unreadAlerts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">ML-Powered Fraud Detection Active</h3>
            <p className="text-emerald-50 text-sm">
              Isolation Forest and Anomaly Detection algorithms are continuously monitoring your transactions
            </p>
          </div>
        </div>
      </div>

      {unreadAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Unread Alerts</h3>
          {unreadAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.severity);
            const colors = getAlertColors(alert.severity);

            return (
              <div
                key={alert.id}
                className={`${colors.bg} ${colors.border} border rounded-xl p-4 transition-all hover:shadow-md`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`w-5 h-5 ${colors.icon} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-semibold ${colors.text} mb-1`}>{alert.title}</h4>
                        <p className={`text-sm ${colors.text} opacity-90`}>{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alert.created_at).toLocaleString()} • {alert.type}
                        </p>
                      </div>
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className={`ml-3 px-3 py-1 ${colors.icon} hover:opacity-80 transition-opacity text-sm font-medium whitespace-nowrap`}
                      >
                        Mark Read
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {readAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Read Alerts</h3>
          {readAlerts.map((alert) => {
            return (
              <div
                key={alert.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60"
              >
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-700 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(alert.created_at).toLocaleString()} • {alert.type}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {alerts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts</h3>
          <p className="text-gray-600">
            You're all set! No alerts or notifications at this time.
          </p>
        </div>
      )}
    </div>
  );
};
