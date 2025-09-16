import { useEffect, useState } from 'react';

export default function useFlywayMigrationsOverTime() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      let intervalId;
      const fetchData = () => {
        fetch('/api/jdbc-connections/history')
          .then(res => res.json())
          .then(historyArr => {
            // Flatten all migrations with their installed_on date
            const allMigrations = (Array.isArray(historyArr) ? historyArr : []).flatMap(db =>
              (Array.isArray(db.history) ? db.history : []).map(row => ({
                installed_on: row.installed_on,
                db: db.dbName || (db.connStr || '').match(/databaseName=([^;]+)/)?.[1] || 'Unknown1',
              }))
            );
            // Group by month/year
            const counts = {};
            allMigrations.forEach(mig => {
              if (!mig.installed_on) return;
              const date = new Date(mig.installed_on);
              if (isNaN(date)) return;
              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              counts[key] = (counts[key] || 0) + 1;
            });
            // Convert to recharts format
            const chartData = Object.entries(counts).map(([name, migrations]) => ({ name, migrations }));
            chartData.sort((a, b) => a.name.localeCompare(b.name));
            setData(chartData);
            setLoading(false);
          })
          .catch(() => {
            setData([]);
            setLoading(false);
          });
      };
      fetchData();
      intervalId = setInterval(fetchData, 60000);
      return () => clearInterval(intervalId);
    }, []);

  return { data, loading };
}
