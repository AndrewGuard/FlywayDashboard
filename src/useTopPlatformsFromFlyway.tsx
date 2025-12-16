import { useEffect, useState } from 'react';

interface HistoryItem {
  month: string;
  deployments: number;
}

interface Platform {
  platform: string;
  deployments: number;
  history: HistoryItem[];
  connStr?: string;
}

interface UseTopPlatformsReturn {
  platforms: Platform[];
  loading: boolean;
}

function getDbTypeFromJdbc(connStr: string | undefined): string {
    console.log("connStr: ", connStr)
  if (!connStr) return 'Unknown 4';
  if (/sqlserver/i.test(connStr)) return 'SQL Server';
  if (/postgres/i.test(connStr)) return 'PostgreSQL';
  if (/oracle/i.test(connStr)) return 'Oracle';
  if (/mysql/i.test(connStr)) return 'MySQL';
  if (/sqlite/i.test(connStr)) return 'SQLite';
  return 'Unknown 3';
}

export default function useTopPlatformsFromFlyway(): UseTopPlatformsReturn {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
      let intervalId;
      const fetchData = () => {
        fetch('/api/jdbc-connections/history')
          .then(res => res.json())
          .then(historyArr => {
            // Group by platform (from JDBC string)
            const byPlatform = {};
            (Array.isArray(historyArr) ? historyArr : []).forEach(db => {
              let connStr = db.connStr || db.connectionString;
              if (!connStr && db.dbName) {
                // Try to synthesize a JDBC string for type detection
                connStr = db.dbName;
              }
              if (!connStr) connStr = 'unknown 5';
              const platform = getDbTypeFromJdbc(connStr);
              if (!byPlatform[platform]) byPlatform[platform] = { platform, deployments: 0, history: [], connStr };
              const count = Array.isArray(db.history) ? db.history.length : 0;
              byPlatform[platform].deployments += count;
              // For mini chart: deployments per month (last 5 months)
              const months = Array.isArray(db.history)
                ? db.history.map(row => {
                    const d = new Date(row.installed_on);
                    if (isNaN(d.getTime())) return null;
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  }).filter(Boolean)
                : [];
              months.forEach(m => {
                const idx = byPlatform[platform].history.findIndex(h => h.month === m);
                if (idx === -1) byPlatform[platform].history.push({ month: m, deployments: 1 });
                else byPlatform[platform].history[idx].deployments += 1;
              });
            });
            // Sort months and fill missing months for mini chart
            Object.values(byPlatform).forEach((p: Platform) => {
              p.history.sort((a: HistoryItem, b: HistoryItem) => a.month.localeCompare(b.month));
              // Only keep last 5 months
              if (p.history.length > 5) p.history = p.history.slice(-5);
            });
            setPlatforms(Object.values(byPlatform) as Platform[]);
            setLoading(false);
          })
          .catch(() => {
            setPlatforms([]);
            setLoading(false);
          });
      };
      fetchData();
      intervalId = setInterval(fetchData, 60000);
      return () => clearInterval(intervalId);
    }, []);

  return { platforms, loading };
}
