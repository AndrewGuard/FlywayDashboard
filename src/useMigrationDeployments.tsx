import { useEffect, useState } from 'react';

interface Deployment {
  dbName: string;
  count: number;
  error: string | null;
}

interface UseMigrationDeploymentsReturn {
  deployments: Deployment[];
  loading: boolean;
}

export default function useMigrationDeployments(): UseMigrationDeploymentsReturn {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
