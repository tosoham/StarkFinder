"use client"
import { useState } from 'react';

interface DeploymentResponse {
  success: boolean;
  contractAddress?: string;
  classHash?: string;
  transactionHash?: string;
  error?: string;
  details?: string;
}

export default function DeploymentPage() {
  const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [result, setResult] = useState<DeploymentResponse | null>(null);

    const addLog = (message: string) => {
      setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
    };

  const handleDeploy = async () => {
    setIsLoading(true);
    setResult(null);
    setLogs([]);
    addLog('Starting deployment process...');

    try {
      addLog('Compiling and deploying contract...');
      const response = await fetch('/api/deploy-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractName: 'contract_contract' })
      });

      const data: DeploymentResponse = await response.json();
      setResult(data);
      
      if (data.success) {
        addLog('✅ Deployment successful!');
      } else {
        addLog(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResult({
        success: false,
        error: 'Deployment failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Deploy Cairo Contract</h1>
        
        <button 
          onClick={handleDeploy} 
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Deploying...' : 'Deploy Contract'}
        </button>

        {logs.length > 0 && (
          <div className="mt-4 bg-gray-50 rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">Deployment Logs:</h3>
            <div className="space-y-1 font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className="text-gray-700">{log}</div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            {result.success ? (
              <div className="space-y-2">
                <p className="font-medium text-green-800">Contract deployed successfully!</p>
                <div className="text-sm space-y-1 text-green-700">
                  <p><span className="font-medium">Contract Address:</span> {result.contractAddress}</p>
                  <p><span className="font-medium">Class Hash:</span> {result.classHash}</p>
                  <p><span className="font-medium">Transaction Hash:</span> {result.transactionHash}</p>
                </div>
              </div>
            ) : (
              <div className="text-red-800">
                <p className="font-medium">Deployment failed</p>
                <p className="text-sm mt-1">{result.details}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}