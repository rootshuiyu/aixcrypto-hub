"use client";

import React, { useState, useEffect } from "react";
import { 
  FileCode2, 
  Network, 
  Plus, 
  Check, 
  X, 
  Power, 
  Star,
  ExternalLink,
  RefreshCw,
  Trash2,
  Edit,
  TestTube,
  Download,
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../lib/api";

// 忽略 MetaMask 扩展错误
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(" ");
    if (
      message.includes("MetaMask") ||
      message.includes("ethereum") ||
      message.includes("chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn")
    ) {
      // 静默忽略 MetaMask 错误
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

const BACKEND_URL = "http://localhost:3001";

// API 函数
const contractApi = {
  getAll: () => adminApi.get(`${BACKEND_URL}/super-admin-api-contracts`),
  add: (data: any) => adminApi.post(`${BACKEND_URL}/super-admin-api-contracts`, data),
  update: (id: string, data: any) => adminApi.put(`${BACKEND_URL}/super-admin-api-contracts/${id}`, data),
  delete: (id: string) => adminApi.delete(`${BACKEND_URL}/super-admin-api-contracts/${id}`),
  setPrimary: (id: string) => adminApi.post(`${BACKEND_URL}/super-admin-api-contracts/${id}/primary`),
  toggle: (id: string) => adminApi.post(`${BACKEND_URL}/super-admin-api-contracts/${id}/toggle`),
  verify: (data: { chainId: number; address: string }) => adminApi.post(`${BACKEND_URL}/super-admin-api-contracts/verify`, data),
  fetchAbi: (data: { chainId: number; address: string }) => adminApi.post(`${BACKEND_URL}/super-admin-api-contracts/fetch-abi`, data),
  test: (id: string) => adminApi.post(`${BACKEND_URL}/super-admin-api-contracts/${id}/test`),
  refreshCache: () => adminApi.post(`${BACKEND_URL}/super-admin-api-contracts/cache/refresh`),
};

export default function ContractManager() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminContracts"],
    queryFn: contractApi.getAll,
  });

  const addMutation = useMutation({
    mutationFn: contractApi.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminContracts"] });
      setShowAddModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => contractApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminContracts"] });
      setEditingContract(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: contractApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminContracts"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: contractApi.toggle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminContracts"] }),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: contractApi.setPrimary,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminContracts"] }),
  });

  const testMutation = useMutation({
    mutationFn: contractApi.test,
    onSuccess: (result) => setTestResult(result),
  });

  const contracts = data?.contracts || [];
  const supportedChains = data?.supportedChains || [];
  const contractTypes = data?.contractTypes || {};

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">Contract_Config_Manager</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-2">
            Smart Contract Address & ABI Configuration
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="h-10 px-4 border border-border hover:bg-muted/50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 px-4 bg-admin-accent hover:bg-admin-accent/80 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">Add_Contract</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total_Contracts" 
          value={contracts.length} 
          icon={<FileCode2 className="w-5 h-5 text-admin-accent" />}
        />
        <StatCard 
          label="Active_Contracts" 
          value={contracts.filter((c: any) => c.isActive).length}
          icon={<Power className="w-5 h-5 text-green-500" />}
        />
        <StatCard 
          label="Primary_Configs" 
          value={contracts.filter((c: any) => c.isPrimary).length}
          icon={<Star className="w-5 h-5 text-yellow-500" />}
        />
        <StatCard 
          label="Supported_Chains" 
          value={supportedChains.length}
          icon={<Network className="w-5 h-5 text-admin-secondary" />}
        />
      </div>

      {/* Contract Types */}
      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-background/30">
          <h3 className="text-[10px] font-black uppercase tracking-widest">Contract_Types</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(contractTypes).map(([key, value]) => (
            <div key={key} className="p-4 bg-background border border-border">
              <p className="text-[9px] font-black uppercase text-muted-foreground">{key}</p>
              <p className="text-sm font-mono mt-1">{value as string}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contracts List */}
      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-background/30">
          <h3 className="text-[10px] font-black uppercase tracking-widest">Registered_Contracts</h3>
        </div>
        <div className="p-6 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No contracts configured</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add_Contract" to add your first contract</p>
            </div>
          ) : (
            contracts.map((contract: any) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onToggle={() => toggleMutation.mutate(contract.id)}
                onSetPrimary={() => setPrimaryMutation.mutate(contract.id)}
                onEdit={() => setEditingContract(contract)}
                onDelete={() => {
                  if (confirm('Are you sure you want to delete this contract?')) {
                    deleteMutation.mutate(contract.id);
                  }
                }}
                onTest={() => testMutation.mutate(contract.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Supported Chains */}
      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-background/30">
          <h3 className="text-[10px] font-black uppercase tracking-widest">Supported_Chains</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supportedChains.map((chain: any) => (
              <div key={chain.id} className="p-4 bg-background border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black">{chain.name}</span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    chain.type === 'mainnet' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {chain.type}
                  </span>
                </div>
                <p className="text-[9px] font-mono text-muted-foreground">Chain ID: {chain.id}</p>
                <p className="text-[9px] font-mono text-muted-foreground truncate">{chain.rpcUrl}</p>
                <a 
                  href={chain.explorer} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] text-admin-secondary hover:underline flex items-center gap-1 mt-2"
                >
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingContract) && (
        <ContractModal
          contract={editingContract}
          chains={supportedChains}
          contractTypes={contractTypes}
          onClose={() => {
            setShowAddModal(false);
            setEditingContract(null);
          }}
          onSave={(data) => {
            if (editingContract) {
              updateMutation.mutate({ id: editingContract.id, data });
            } else {
              addMutation.mutate(data);
            }
          }}
          isLoading={addMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Test Result Modal */}
      {testResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase">Connection Test Result</h3>
              <button onClick={() => setTestResult(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`p-4 rounded ${testResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <p className={`text-sm font-black ${testResult.success ? 'text-green-500' : 'text-red-500'}`}>
                {testResult.success ? '✓ Connection Successful' : '✗ Connection Failed'}
              </p>
              {testResult.latency && (
                <p className="text-xs text-muted-foreground mt-2">Latency: {testResult.latency}ms</p>
              )}
              {testResult.error && (
                <p className="text-xs text-red-400 mt-2">{testResult.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-[9px] font-black uppercase text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-black italic tracking-tighter">{value}</p>
    </div>
  );
}

function ContractCard({ contract, onToggle, onSetPrimary, onEdit, onDelete, onTest }: {
  contract: any;
  onToggle: () => void;
  onSetPrimary: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}) {
  return (
    <div className={`p-4 bg-background border ${contract.isPrimary ? 'border-yellow-500/50' : 'border-border'} hover:border-admin-secondary transition-colors group`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black">{contract.name}</span>
            {contract.isPrimary && (
              <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded">
                Primary
              </span>
            )}
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
              contract.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
            }`}>
              {contract.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-[8px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {contract.type}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-mono text-muted-foreground">
              <span className="text-muted-foreground/60">Address:</span> {contract.address}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              <span className="text-muted-foreground/60">Chain:</span> {contract.chainName} (ID: {contract.chainId})
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              <span className="text-muted-foreground/60">Version:</span> {contract.version}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onTest}
            className="p-2 hover:bg-muted rounded"
            title="Test Connection"
          >
            <TestTube className="w-4 h-4 text-admin-secondary" />
          </button>
          {!contract.isPrimary && (
            <button
              onClick={onSetPrimary}
              className="p-2 hover:bg-muted rounded"
              title="Set as Primary"
            >
              <Star className="w-4 h-4 text-yellow-500" />
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-muted rounded"
            title={contract.isActive ? 'Disable' : 'Enable'}
          >
            <Power className={`w-4 h-4 ${contract.isActive ? 'text-green-500' : 'text-red-500'}`} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-muted rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-admin-accent" />
          </button>
          {!contract.isPrimary && (
            <button
              onClick={onDelete}
              className="p-2 hover:bg-muted rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
          {contract.chain?.explorer && (
            <a
              href={`${contract.chain.explorer}/address/${contract.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-muted rounded"
              title="View on Explorer"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ContractModal({ contract, chains, contractTypes, onClose, onSave, isLoading }: {
  contract: any;
  chains: any[];
  contractTypes: Record<string, string>;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: contract?.name || '',
    type: contract?.type || 'vault',
    version: contract?.version || '1.0.0',
    chainId: contract?.chainId || 11155111,
    address: contract?.address || '',
    abi: contract?.abi || '',
    isPrimary: contract?.isPrimary || false,
    notes: contract?.notes || '',
  });

  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFetchingAbi, setIsFetchingAbi] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await contractApi.verify({ chainId: formData.chainId, address: formData.address });
      setVerifyResult(result);
    } catch (error) {
      setVerifyResult({ valid: false, error: 'Verification failed' });
    }
    setIsVerifying(false);
  };

  const handleFetchAbi = async () => {
    setIsFetchingAbi(true);
    try {
      const result = await contractApi.fetchAbi({ chainId: formData.chainId, address: formData.address });
      if (result.success && result.abi) {
        setFormData(prev => ({ ...prev, abi: result.abi }));
      }
    } catch (error) {
      console.error('Failed to fetch ABI');
    }
    setIsFetchingAbi(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border bg-background/30 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase">
            {contract ? 'Edit_Contract' : 'Add_New_Contract'}
          </h3>
          <button onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase text-muted-foreground block mb-2">
                Contract_Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border text-sm"
                placeholder="SuperoctopVault"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-muted-foreground block mb-2">
                Contract_Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border text-sm"
              >
                {Object.entries(contractTypes).map(([key, value]) => (
                  <option key={key} value={value as string}>{key} ({value as string})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase text-muted-foreground block mb-2">
                Chain
              </label>
              <select
                value={formData.chainId}
                onChange={(e) => setFormData(prev => ({ ...prev, chainId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-background border border-border text-sm"
                disabled={!!contract}
              >
                {chains.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name} ({chain.type}) - ID: {chain.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-muted-foreground block mb-2">
                Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border text-sm"
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-2">
              Contract_Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="flex-1 px-3 py-2 bg-background border border-border text-sm font-mono"
                placeholder="0x..."
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying || !formData.address}
                className="px-4 py-2 bg-admin-secondary text-white text-[10px] font-black uppercase disabled:opacity-50"
              >
                {isVerifying ? '...' : 'Verify'}
              </button>
            </div>
            {verifyResult && (
              <div className={`mt-2 p-2 text-xs ${verifyResult.valid ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {verifyResult.valid ? '✓ Valid contract address' : `✗ ${verifyResult.error}`}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-black uppercase text-muted-foreground">
                ABI (Optional)
              </label>
              <button
                onClick={handleFetchAbi}
                disabled={isFetchingAbi || !formData.address}
                className="text-[9px] text-admin-secondary hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                {isFetchingAbi ? 'Fetching...' : 'Fetch from Explorer'}
              </button>
            </div>
            <textarea
              value={formData.abi}
              onChange={(e) => setFormData(prev => ({ ...prev, abi: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border text-sm font-mono h-32"
              placeholder="[{...}] or leave empty to use default ABI"
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border text-sm h-20"
              placeholder="Optional notes about this contract..."
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="isPrimary" className="text-[10px] font-black uppercase">
              Set as Primary Contract for this Type/Chain
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-background/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-[10px] font-black uppercase hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={isLoading || !formData.name || !formData.address}
            className="px-4 py-2 bg-admin-accent text-[10px] font-black uppercase disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (contract ? 'Update' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}

