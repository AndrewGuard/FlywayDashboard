import { useEffect, useState } from 'react';

export default function useMigrationDeployments() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jdbc-connections/history')
      .then(res => res.json())
      .then(data => {
        // For each db, count successful migrations
        const envDeployments = data.map(db => ({
          dbName: db.dbName,
          count: db.history ? db.history.filter(row => row.success === 1).length : 0,
          error: db.error || null
        }));
        setDeployments(envDeployments);
        setLoading(false);
      });
  }, []);

  return { deployments, loading };
}
