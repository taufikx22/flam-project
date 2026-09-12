'use client';

import React, { useTransition } from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/dataGenerator';
import { X, Check, Search, SlidersHorizontal } from 'lucide-react';

export default function FilterPanel() {
  const { filterState, setFilterState } = useDashboardData();
  const [, startTransition] = useTransition();

  const toggleCategory = (cat: string) => {
    startTransition(() => {
      setFilterState((prev) => {
        const current = prev.selectedCategories;
        const next = current.includes(cat)
          ? current.filter((c) => c !== cat)
          : [...current, cat];
        return { ...prev, selectedCategories: next };
      });
    });
  };

  const toggleStatus = (st: string) => {
    startTransition(() => {
      setFilterState((prev) => {
        const current = prev.selectedStatuses;
        const next = current.includes(st)
          ? current.filter((s) => s !== st)
          : [...current, st];
        return { ...prev, selectedStatuses: next };
      });
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setFilterState({
        selectedCategories: [...CATEGORIES],
        minValue: null,
        maxValue: null,
        selectedStatuses: ['ok', 'warn', 'error'],
        searchQuery: '',
      });
    });
  };

  const hasActiveFilters =
    filterState.selectedCategories.length < CATEGORIES.length ||
    filterState.selectedStatuses.length < 3 ||
    filterState.searchQuery !== '';

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm select-none">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-[#111827] text-[#06d6a0]">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-[#111827] font-display uppercase">
            Data Filters & Signals
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs text-[#ef476f] hover:text-[#d42c55] font-bold transition-colors px-2.5 py-1 rounded-full bg-[#ef476f]/10 border border-[#ef476f]/20 font-sans"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Category Toggles */}
        <div>
          <label className="text-xs font-bold text-slate-600 mb-2.5 block uppercase tracking-wider font-sans">
            Signal Streams
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = filterState.selectedCategories.includes(cat);
              const color = CATEGORY_COLORS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 font-sans ${
                    active
                      ? 'bg-[#111827] text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                  style={{
                    borderColor: active ? color : undefined,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Signals */}
        <div>
          <label className="text-xs font-bold text-slate-600 mb-2.5 block uppercase tracking-wider font-sans">
            Health State
          </label>
          <div className="flex items-center gap-2">
            {[
              { id: 'ok', label: 'Nominal', color: '#06d6a0', bg: 'bg-[#06d6a0]/15 text-[#065f46] border-[#06d6a0]/30' },
              { id: 'warn', label: 'Warning', color: '#ffc43d', bg: 'bg-[#ffc43d]/20 text-[#854d0e] border-[#ffc43d]/40' },
              { id: 'error', label: 'Critical', color: '#ef476f', bg: 'bg-[#ef476f]/15 text-[#9f1239] border-[#ef476f]/30' },
            ].map((st) => {
              const active = filterState.selectedStatuses.includes(st.id);
              return (
                <button
                  key={st.id}
                  onClick={() => toggleStatus(st.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 font-sans ${
                    active
                      ? `${st.bg} shadow-sm`
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Server Search Filter */}
        <div>
          <label className="text-xs font-bold text-slate-600 mb-2.5 block uppercase tracking-wider font-sans">
            Server Node Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. node-prod-1"
              value={filterState.searchQuery}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#1b9aaa] focus:ring-1 focus:ring-[#1b9aaa] transition-all font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
