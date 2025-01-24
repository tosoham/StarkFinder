/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Steps } from '@/components/ui/steps';

interface DeploymentResponse {
  success: boolean;
  contractAddress?: string;
  classHash?: string;
  transactionHash?: string;
  error?: string;
  details?: string;
}

interface ContractCodeProps {
  nodes: any; // Update with proper type if available
  edges: any; // Update with proper type if available
  flowSummary: any; // Update with proper type if available
  sourceCode: string;
  setSourceCode: (code: string) => void;
  setDisplayState: (state: any) => void; // Update with proper type if available
}

interface DeploymentStep {
  title: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  details?: string;
  hash?: string;
}

const initialSteps: DeploymentStep[] = [
  { title: 'Building Contract', status: 'pending' },
  { title: 'Declaring Sierra Hash', status: 'pending' },
  { title: 'Declaring CASM Hash', status: 'pending' },
  { title: 'Deploying Contract', status: 'pending' },
  { title: 'Confirming Transaction', status: 'pending' }
];

const ContractCode: React.FC<ContractCodeProps> = ({
  nodes,
  edges,
  flowSummary,
  sourceCode,
  setSourceCode,
  setDisplayState,
}) => {
  const [steps, setSteps] = useState<DeploymentStep[]>(initialSteps);
  const [isDeploying, setIsDeploying] = useState(false);
  const [editable, setEditable] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<DeploymentResponse | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string): void => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toISOString().split("T")[1].split(".")[0]} - ${message}`,
    ]);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [sourceCode, logs]);

  const updateStep = (index: number, updates: Partial<DeploymentStep>) => {
    setSteps(current => 
      current.map((step, i) => 
        i === index ? { ...step, ...updates } : step
      )
    );
  };

  const compileContractHandler = async () => {
    setIsDeploying(true);
    
    try {
      // Step 1: Building Contract
      updateStep(0, { status: 'processing' });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate build time
      updateStep(0, { status: 'complete' });

      // Step 2: Declaring Sierra Hash
      updateStep(1, { status: 'processing' });
      const response = await fetch("/api/deploy-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractName: "contractww_contractww" }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update steps with actual data
        updateStep(1, { 
          status: 'complete',
          hash: data.classHash 
        });
        updateStep(2, { 
          status: 'complete',
          hash: data.casmHash 
        });
        updateStep(3, { 
          status: 'complete',
          details: data.contractAddress 
        });
        updateStep(4, { 
          status: 'complete',
          hash: data.transactionHash 
        });
      } else {
        throw new Error(data.error || 'Deployment failed');
      }
    } catch (error) {
      const currentStep = steps.findIndex(step => step.status === 'processing');
      if (currentStep !== -1) {
        updateStep(currentStep, { 
          status: 'error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const auditCodeHandler = async (): Promise<void> => {
    const fetchStreamedData = async () => {
      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceCode }),
      });
      setSourceCode("");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: isDone } = await reader.read();
          done = isDone;
          if (value) {
            const newSourceCode = sourceCode + decoder.decode(value);
            setSourceCode(newSourceCode);
          }
        }
      }
    };

    fetchStreamedData();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-black text-2xl font-bold">Contract Code</div>
        <div
          ref={containerRef}
          className={`text-black mt-1 overflow-y-auto pl-2 border-4 border-black rounded-xl min-h-[10vh] max-h-[40vh] ${
            editable ? "bg-yellow-200" : "bg-yellow-100"
          }`}
        >
          <pre>
            <code
              contentEditable={editable}
              spellCheck="false"
              style={{
                outline: "none",
                border: "none",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                padding: "0",
              }}
              suppressContentEditableWarning={true}
              onBlur={(e) => setSourceCode(e.currentTarget.textContent || "")}
            >
              {sourceCode}
            </code>
          </pre>
        </div>

        <div className="flex gap-4 mt-2">
          <button 
            className={`px-4 py-2 rounded-lg ${
              isDeploying ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={compileContractHandler}
            disabled={isDeploying || editable}
          >
            {isDeploying ? "Deploying..." : "Deploy"}
          </button>
          <button 
            className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white"
            onClick={() => setEditable(!editable)}
            disabled={isDeploying}
          >
            {editable ? "Save" : "Edit"}
          </button>
          <button 
            className={`px-4 py-2 rounded-lg ${
              editable || isDeploying 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            onClick={auditCodeHandler}
            disabled={editable || isDeploying}
          >
            Audit
          </button>
        </div>

        {/* Deployment Steps */}
        <Card className="mt-4 p-4">
          <Steps items={steps.map(step => ({
            title: step.title,
            status: step.status,
            description: step.details && (
              <div className="text-sm">
                {step.hash ? (
                  <a
                    href={`https://starkscan.co/tx/${step.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    {step.hash.slice(0, 6)}...{step.hash.slice(-4)}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  step.details
                )}
              </div>
            )
          }))} />
        </Card>
      </div>

      {/* Deployment Logs */}
      {logs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Deployment Logs</h3>
          <div 
            ref={logsContainerRef}
            className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-[200px] overflow-y-auto"
          >
            {logs.map((log, index) => (
              <div key={index} className="font-mono text-sm mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deployment Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg border ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {result.success ? (
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-green-700">
                Deployment Successful!
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Transaction:</span>
                <a
                  href={`https://sepolia.starkscan.co/tx/${result.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View on Starkscan
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="text-sm text-gray-600">
                <div className="mt-1">
                  <span className="font-medium">Contract Address:</span> {result.contractAddress}
                </div>
                <div className="mt-1">
                  <span className="font-medium">Class Hash:</span> {result.classHash}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-700">
              <div className="font-semibold">Deployment Failed</div>
              <div className="text-sm mt-1">{result.error}</div>
              {result.details && (
                <div className="text-sm mt-1 text-red-600">{result.details}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractCode;