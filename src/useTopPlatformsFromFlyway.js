import { useEffect, useState } from 'react';

export default function useTopPlatformsFromFlyway() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jdbc-connections/history')
      .then(res => res.json())
      .then(historyArr => {
        // Group by platform (from JDBC string)
        const byPlatform = {};
        (Array.isArray(historyArr) ? historyArr : []).forEach(db => {
          const connStr = db.connStr || db.connectionString || '';
          let platform = 'Unknown';
          if (/sqlserver/i.test(connStr)) platform = 'SQL Server';
          else if (/postgres/i.test(connStr)) platform = 'PostgreSQL';
          else if (/oracle/i.test(connStr)) platform = 'Oracle';
          else if (/mysql/i.test(connStr)) platform = 'MySQL';
          else if (/sqlite/i.test(connStr)) platform = 'SQLite';
          if (!byPlatform[platform]) byPlatform[platform] = { platform, deployments: 0, history: [] };
          const count = Array.isArray(db.history) ? db.history.length : 0;
          byPlatform[platform].deployments += count;
          // For mini chart: deployments per month (last 5 months)
          const months = Array.isArray(db.history)
            ? db.history.map(row => {
                const d = new Date(row.installed_on);
                if (isNaN(d)) return null;
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
        Object.values(byPlatform).forEach(p => {
          p.history.sort((a, b) => a.month.localeCompare(b.month));
          // Only keep last 5 months
          if (p.history.length > 5) p.history = p.history.slice(-5);
        });
        setPlatforms(Object.values(byPlatform));
        setLoading(false);
      })
      .catch(() => {
        setPlatforms([]);
        setLoading(false);
      });
  }, []);

  return { platforms, loading };
}
