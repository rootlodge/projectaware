import React, { useEffect, useState } from 'react';

interface ContextSnapshot {
  timestamp: string;
  recentActions: string[];
  currentPage: string;
  userId?: string;
  deviceType?: string;
  environment?: string;
}

interface OrchestrationTask {
  id: string;
  description: string;
  requiredAgents: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

export default function AgentOrchestrationDashboard() {
  const [context, setContext] = useState<ContextSnapshot | null>(null);
  const [pending, setPending] = useState<OrchestrationTask[]>([]);
  const [inProgress, setInProgress] = useState<OrchestrationTask[]>([]);
  const [completed, setCompleted] = useState<OrchestrationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const contextRes = await fetch('/api/agents/context');
        const contextData = await contextRes.json();
        const orchRes = await fetch('/api/agents/orchestrate', { method: 'POST' });
        const orchData = await orchRes.json();
        if (!mounted) return;
        setContext(contextData);
        setPending(orchData.pending || []);
        setInProgress(orchData.inProgress || []);
        setCompleted(orchData.completed || []);
      } catch (err) {
        setError('Unable to load orchestration data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-3xl font-bold text-white mb-6">Agent Orchestration Dashboard</h1>
      {loading ? (
        <div className="text-purple-300">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <>
          <section className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Current Context</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-purple-300">Timestamp</dt>
                <dd className="text-white mb-2">{context?.timestamp}</dd>
                <dt className="text-purple-300">Current Page</dt>
                <dd className="text-white mb-2">{context?.currentPage}</dd>
                {context?.userId && <><dt className="text-purple-300">User ID</dt><dd className="text-white mb-2">{context.userId}</dd></>}
                {context?.deviceType && <><dt className="text-purple-300">Device</dt><dd className="text-white mb-2">{context.deviceType}</dd></>}
                {context?.environment && <><dt className="text-purple-300">Environment</dt><dd className="text-white mb-2">{context.environment}</dd></>}
              </div>
              <div>
                <dt className="text-purple-300">Recent Actions</dt>
                <dd className="text-white mb-2">
                  {context?.recentActions?.length ? (
                    <ul className="list-disc ml-5">
                      {context.recentActions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  ) : 'None'}
                </dd>
              </div>
            </dl>
          </section>
          <section className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Orchestration Tasks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-lg font-bold text-yellow-300 mb-2">Pending</h3>
                {pending.length ? (
                  <ul className="space-y-2">
                    {pending.map(task => (
                      <li key={task.id} className="bg-yellow-500/10 rounded p-3 text-white">
                        <div className="font-medium">{task.description}</div>
                        <div className="text-xs text-yellow-200">Agents: {task.requiredAgents.join(', ')}</div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-purple-300">None</div>}
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-300 mb-2">In Progress</h3>
                {inProgress.length ? (
                  <ul className="space-y-2">
                    {inProgress.map(task => (
                      <li key={task.id} className="bg-blue-500/10 rounded p-3 text-white">
                        <div className="font-medium">{task.description}</div>
                        <div className="text-xs text-blue-200">Agents: {task.requiredAgents.join(', ')}</div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-purple-300">None</div>}
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-300 mb-2">Completed</h3>
                {completed.length ? (
                  <ul className="space-y-2">
                    {completed.map(task => (
                      <li key={task.id} className="bg-green-500/10 rounded p-3 text-white">
                        <div className="font-medium">{task.description}</div>
                        <div className="text-xs text-green-200">Agents: {task.requiredAgents.join(', ')}</div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-purple-300">None</div>}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
