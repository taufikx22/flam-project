'use client';

import React, { useState } from 'react';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react';

interface ClusterNode {
  id: string;
  name: string;
  zone: string;
  ip: string;
  instanceType: string;
  status: 'healthy' | 'warning' | 'degraded';
  cpuUsage: number;
  memUsage: number;
  throughput: string;
  uptime: string;
  agentVersion: string;
}

const NODES: ClusterNode[] = [
  {
    id: 'node-01',
    name: 'telem-worker-use1-01',
    zone: 'us-east-1a',
    ip: '10.0.12.44',
    instanceType: 'c6i.4xlarge (16 vCPU, 32GB)',
    status: 'healthy',
    cpuUsage: 28.4,
    memUsage: 41.2,
    throughput: '12,450 ev/s',
    uptime: '42d 18h',
    agentVersion: 'v2.4.11-rc4',
  },
  {
    id: 'node-02',
    name: 'telem-worker-use1-02',
    zone: 'us-east-1a',
    ip: '10.0.12.45',
    instanceType: 'c6i.4xlarge (16 vCPU, 32GB)',
    status: 'healthy',
    cpuUsage: 31.8,
    memUsage: 44.0,
    throughput: '11,980 ev/s',
    uptime: '42d 18h',
    agentVersion: 'v2.4.11-rc4',
  },
  {
    id: 'node-03',
    name: 'telem-worker-use1-03',
    zone: 'us-east-1b',
    ip: '10.0.14.88',
    instanceType: 'c6i.4xlarge (16 vCPU, 32GB)',
    status: 'healthy',
    cpuUsage: 24.1,
    memUsage: 39.5,
    throughput: '13,100 ev/s',
    uptime: '38d 04h',
    agentVersion: 'v2.4.11-rc4',
  },
  {
    id: 'node-04',
    name: 'telem-worker-use1-04',
    zone: 'us-east-1b',
    ip: '10.0.14.89',
    instanceType: 'c6i.4xlarge (16 vCPU, 32GB)',
    status: 'warning',
    cpuUsage: 79.6,
    memUsage: 82.1,
    throughput: '18,400 ev/s',
    uptime: '14d 09h',
    agentVersion: 'v2.4.11-rc4',
  },
  {
    id: 'node-05',
    name: 'telem-worker-euw1-01',
    zone: 'eu-west-1a',
    ip: '10.4.10.12',
    instanceType: 'c6i.4xlarge (16 vCPU, 32GB)',
    status: 'healthy',
    cpuUsage: 22.0,
    memUsage: 36.8,
    throughput: '9,840 ev/s',
    uptime: '67d 22h',
    agentVersion: 'v2.4.11-rc4',
  },
  {
    id: 'node-06',
    name: 'telem-worker-euw1-02',
    zone: 'eu-west-1b',
    ip: '10.4.11.34',
    instanceType: 'c6i.4xlarge (16 vCPU, 32GB)',
    status: 'healthy',
    cpuUsage: 19.5,
    memUsage: 35.2,
    throughput: '9,420 ev/s',
    uptime: '67d 22h',
    agentVersion: 'v2.4.11-rc4',
  },
  {
    id: 'node-07',
    name: 'telem-worker-apse1-01',
    zone: 'ap-southeast-1a',
    ip: '10.8.20.04',
    instanceType: 'c6i.4xlarge (16 vCPU, 32GB)',
    status: 'healthy',
    cpuUsage: 34.2,
    memUsage: 48.6,
    throughput: '14,200 ev/s',
    uptime: '21d 15h',
    agentVersion: 'v2.4.11-rc4',
  },
  {
    id: 'node-08',
    name: 'telem-worker-apse1-02',
    zone: 'ap-southeast-1b',
    ip: '10.8.21.19',
    instanceType: 'c6i.4xlarge (16 vCPU, 32GB)',
    status: 'healthy',
    cpuUsage: 29.8,
    memUsage: 43.1,
    throughput: '12,750 ev/s',
    uptime: '21d 15h',
    agentVersion: 'v2.4.11-rc4',
  },
];

export default function ClusterNodesView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');

  const filteredNodes = NODES.filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.ip.includes(searchTerm) ||
      node.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = zoneFilter === 'all' || node.zone.startsWith(zoneFilter);
    return matchesSearch && matchesZone;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-[#111827] font-display flex items-center gap-2">
            <Server className="w-4 h-4 text-[#1b9aaa]" />
            Cluster Shards & Ingestion Nodes
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            8/8 nodes participating in distributed RingBuffer consensus • Zero packet drop
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter nodes or IPs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#1b9aaa] font-mono"
            />
          </div>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:border-[#1b9aaa] font-sans font-bold"
          >
            <option value="all">All Regions (3)</option>
            <option value="us-east-1">us-east-1 (N. Virginia)</option>
            <option value="eu-west-1">eu-west-1 (Ireland)</option>
            <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
          </select>
        </div>
      </div>

      {/* Nodes Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-sans">
                <th className="py-3 px-4 font-bold">Node ID & Name</th>
                <th className="py-3 px-4 font-bold">Availability Zone</th>
                <th className="py-3 px-4 font-bold">Internal IP</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">CPU Utilization</th>
                <th className="py-3 px-4 font-bold">Memory</th>
                <th className="py-3 px-4 font-bold">Rate</th>
                <th className="py-3 px-4 font-bold">Uptime</th>
                <th className="py-3 px-4 font-bold">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNodes.map((node) => (
                <tr
                  key={node.id}
                  className="hover:bg-slate-50 transition-colors duration-150 group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#06d6a0] shadow-[0_0_8px_rgba(6,214,160,0.5)]" />
                      <div>
                        <div className="font-bold text-[#111827] font-sans group-hover:text-[#1b9aaa] transition-colors">
                          {node.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {node.instanceType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{node.zone}</td>
                  <td className="py-3.5 px-4 text-slate-500">{node.ip}</td>
                  <td className="py-3.5 px-4">
                    {node.status === 'healthy' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#06d6a0]/15 text-[#065f46] border border-[#06d6a0]/30 font-sans">
                        <CheckCircle2 className="w-3 h-3" />
                        Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffc43d]/20 text-[#854d0e] border border-[#ffc43d]/40 font-sans">
                        <AlertTriangle className="w-3 h-3" />
                        High Load
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            node.cpuUsage > 75 ? 'bg-[#ffc43d]' : 'bg-[#06d6a0]'
                          }`}
                          style={{ width: `${node.cpuUsage}%` }}
                        />
                      </div>
                      <span className="text-slate-800 font-bold">{node.cpuUsage}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            node.memUsage > 80 ? 'bg-[#ef476f]' : 'bg-[#1b9aaa]'
                          }`}
                          style={{ width: `${node.memUsage}%` }}
                        />
                      </div>
                      <span className="text-slate-800 font-bold">{node.memUsage}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#1b9aaa] font-bold">{node.throughput}</td>
                  <td className="py-3.5 px-4 text-slate-500">{node.uptime}</td>
                  <td className="py-3.5 px-4 text-slate-400">{node.agentVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
