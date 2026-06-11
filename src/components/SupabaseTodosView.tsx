/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface Todo {
  id: string | number;
  name: string;
  created_at?: string;
  completed?: boolean;
}

interface SupabaseTodosViewProps {
  isDarkMode?: boolean;
}

export default function SupabaseTodosView({ isDarkMode = false }: SupabaseTodosViewProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoName, setNewTodoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function getTodos() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.from('todos').select();
      if (error) {
        throw error;
      }
      if (data) {
        setTodos(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch todos. Ensure the table "todos" exists in Supabase.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodoName.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ name: newTodoName.trim() }])
        .select();

      if (error) {
        throw error;
      }

      setNewTodoName('');
      setSuccessMsg(`Successfully added "${newTodoName}"!`);
      // Refresh list
      getTodos();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to insert todo. Ensure "todos" table permits public inserts.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTodo(id: string | number) {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSuccessMsg('Successfully deleted todo!');
      getTodos();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete todo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getTodos();
  }, []);

  return (
    <div className={`p-6 max-w-4xl mx-auto rounded-xl border transition-all ${
      isDarkMode 
        ? 'bg-slate-900/50 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-800 shadow-sm'
    }`}>
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-6 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ClipboardList className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
              Supabase Live Todos Playground
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider">
              DIRECT API DATA RECONCILIATION • DATABASE CLOUD SYNC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={getTodos}
            disabled={loading}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border ${
              isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 active:bg-slate-650 border-slate-700 text-slate-200' 
                : 'bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Quick Setup instructions if table lacks schema */}
      <div className={`mb-6 p-3 rounded-lg border text-xs leading-relaxed ${
        isDarkMode 
          ? 'bg-blue-950/20 border-blue-900/40 text-blue-300' 
          : 'bg-blue-50 border-blue-100 text-blue-800 shadow-xs'
      }`}>
        <p className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-[10px] mb-1">
          <Database className="w-3.5 h-3.5" /> Supabase Schema Integration Tip
        </p>
        If your database is completely fresh, please execute this DDL command inside your Supabase 
        SQL Editor to support real-time reads/writes:
        <pre className="mt-2 p-2 rounded bg-slate-950 font-mono text-[10px] text-emerald-400 overflow-x-auto select-all">
{`CREATE TABLE IF NOT EXISTS todos (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (or bypass for quick demo)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write" ON todos FOR ALL USING (true);`}
        </pre>
      </div>

      {/* Alert panels for notices */}
      {errorMsg && (
        <div className="p-3.5 mb-5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 mb-5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleAddTodo} className="flex gap-2 mb-6">
        <input
          id="new-todo-input"
          type="text"
          value={newTodoName}
          onChange={(e) => setNewTodoName(e.target.value)}
          placeholder="Enter a new todo item name (e.g. Test SW-08 CT Circuit)..."
          className={`flex-1 p-2 rounded text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium ${
            isDarkMode 
              ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
          }`}
        />
        <button
          id="submit-todo-button"
          type="submit"
          disabled={loading || !newTodoName.trim()}
          className="cursor-pointer px-4.5 py-2 rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </form>

      {/* Direct mapping to satisfy list selection testing */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/50 border-slate-100'
      }`}>
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Active Todo Items List</span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-850 text-slate-500">
            {todos.length} Record(s) Retrieved
          </span>
        </h3>

        {todos.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 font-semibold italic">
            {loading ? 'Querying remote database...' : 'No todo items found in "todos" table.'}
          </div>
        ) : (
          <ul id="supabase-todos-list" className="space-y-2">
            {todos.map((todo) => (
              <li 
                key={todo.id} 
                id={`todo-item-${todo.id}`}
                className={`p-2.5 rounded border text-xs font-bold flex items-center justify-between transition-all group ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800/80 hover:bg-slate-850/60' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>{todo.name}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteTodo(todo.id)}
                  title="Remove record from remote table"
                  className="cursor-pointer p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
