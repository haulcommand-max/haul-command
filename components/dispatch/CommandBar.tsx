'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   COMMAND BAR — Universal Dispatch + Execution Console
   
   Not a search bar. A command interface.
   
   Syntax:
     /dispatch Houston → Miami
     /price 120000lbs I-10 corridor
     /status LD-8891
     /operator find TX verified
     /corridor lock I-75
     /boost LD-9902 flash
     /recruit TX trust:90+
   ═══════════════════════════════════════════════════════════════ */

interface CommandResult {
  type: 'success' | 'error' | 'info' | 'loading';
  message: string;
  data?: unknown;
  timestamp: number;
}

interface Props {
  onExecute?: (command: string) => Promise<CommandResult>;
  recentCommands?: string[];
}

const COMMANDS = [
  { cmd: '/dispatch', desc: 'Dispatch a load', example: '/dispatch Houston → Miami 80000lbs' },
  { cmd: '/price', desc: 'Get instant pricing', example: '/price 120000lbs SE corridor superload' },
  { cmd: '/status', desc: 'Check load status', example: '/status LD-8891' },
  { cmd: '/operator', desc: 'Find operators', example: '/operator find TX verified trust:90+' },
  { cmd: '/corridor', desc: 'Corridor intelligence', example: '/corridor I-75 demand' },
  { cmd: '/boost', desc: 'Boost a load listing', example: '/boost LD-9902 flash' },
  { cmd: '/recruit', desc: 'Recruiter blast', example: '/recruit TX trust:90+ urgent' },
  { cmd: '/weather', desc: 'Weather impact check', example: '/weather route Dallas → Miami' },
  { cmd: '/rate', desc: 'Rate spy / competitor intel', example: '/rate I-10 SE superload' },
  { cmd: '/help', desc: 'Show all commands', example: '/help' },
];

export function CommandBar({ onExecute, recentCommands = [] }: Props) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const suggestions = command.startsWith('/')
    ? COMMANDS.filter(c => c.cmd.startsWith(command.split(' ')[0]))
    : [];

  const executeCommand = useCallback(async () => {
    if (!command.trim() || isProcessing) return;

    const cmdText = command.trim();
    setIsProcessing(true);
    setHistory(prev => [...prev, { type: 'info', message: `> ${cmdText}`, timestamp: Date.now() }]);

    try {
      if (onExecute) {
        const result = await onExecute(cmdText);
        setHistory(prev => [...prev, result]);
      } else {
        // Default local handler
        if (cmdText === '/help') {
          setHistory(prev => [...prev, {
            type: 'success',
            message: COMMANDS.map(c => `${c.cmd.padEnd(14)} ${c.desc}`).join('\n'),
            timestamp: Date.now(),
          }]);
        } else {
          // Send to API
          const res = await fetch('/api/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmdText }),
          });
          const data = await res.json();
          setHistory(prev => [...prev, {
            type: res.ok ? 'success' : 'error',
            message: data.message || JSON.stringify(data),
            data: data.result,
            timestamp: Date.now(),
          }]);
        }
      }
    } catch (err) {
      setHistory(prev => [...prev, {
        type: 'error',
        message: `Command failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsProcessing(false);
      setCommand('');
    }
  }, [command, isProcessing, onExecute]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        setCommand(suggestions[selectedSuggestion].cmd + ' ');
        setSelectedSuggestion(-1);
        setShowSuggestions(false);
      } else {
        executeCommand();
        setShowSuggestions(false);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.max(-1, prev - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  // Global keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="hc-cmd">
      {/* Output history */}
      {history.length > 0 && (
        <div className="hc-cmd-history" ref={historyRef}>
          {history.map((item, i) => (
            <div key={i} className={`hc-cmd-line hc-cmd-line--${item.type}`}>
              <pre>{item.message}</pre>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="hc-cmd-input-wrap">
        <span className="hc-cmd-prompt">⬡</span>
        <input
          ref={inputRef}
          className="hc-cmd-input"
          value={command}
          onChange={e => { setCommand(e.target.value); setShowSuggestions(e.target.value.startsWith('/')); }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (command.startsWith('/')) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="/dispatch Houston → Miami   or   ⌘K"
          disabled={isProcessing}
          autoComplete="off"
          spellCheck={false}
        />
        <button aria-label="Interactive Button" className="hc-cmd-run" onClick={executeCommand} disabled={isProcessing || !command.trim()}>
          {isProcessing ? <span className="hc-cmd-spinner" /> : '▶'}
        </button>
        <kbd className="hc-cmd-kbd">⌘K</kbd>
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="hc-cmd-suggestions">
          {suggestions.map((s, i) => (
            <div
              key={s.cmd}
              className={`hc-cmd-sug ${i === selectedSuggestion ? 'hc-cmd-sug--active' : ''}`}
              onMouseDown={() => { setCommand(s.cmd + ' '); setShowSuggestions(false); }}
            >
              <span className="hc-cmd-sug-cmd">{s.cmd}</span>
              <span className="hc-cmd-sug-desc">{s.desc}</span>
              <span className="hc-cmd-sug-ex">{s.example}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .hc-cmd {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: rgba(8,10,16,0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.06);
          font-family: 'SF Mono','Fira Code',monospace;
        }
        .hc-cmd-history {
          max-height: 200px;
          overflow-y: auto;
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .hc-cmd-line { padding: 2px 0; }
        .hc-cmd-line pre {
          margin: 0;
          font-size: 12px;
          font-family: inherit;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .hc-cmd-line--info pre { color: #888; }
        .hc-cmd-line--success pre { color: #22C55E; }
        .hc-cmd-line--error pre { color: #EF4444; }
        .hc-cmd-line--loading pre { color: #F59E0B; }
        .hc-cmd-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
        }
        .hc-cmd-prompt {
          color: #C6923A;
          font-size: 16px;
          flex-shrink: 0;
        }
        .hc-cmd-input {
          flex: 1;
          background: none;
          border: none;
          color: #F0F0F0;
          font-size: 15px;
          font-family: inherit;
          outline: none;
        }
        .hc-cmd-input::placeholder { color: rgba(255,255,255,0.2); }
        .hc-cmd-input:disabled { opacity: 0.5; }
        .hc-cmd-run {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg,#C6923A,#8A6428);
          border: none;
          border-radius: 8px;
          color: #000;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .hc-cmd-run:disabled { opacity: 0.3; cursor: not-allowed; }
        .hc-cmd-run:hover:not(:disabled) { box-shadow: 0 0 12px rgba(198,146,58,0.4); }
        .hc-cmd-kbd {
          font-size: 10px;
          color: #555;
          padding: 2px 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          font-family: inherit;
        }
        .hc-cmd-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: cmd-spin 0.6s linear infinite;
        }
        @keyframes cmd-spin { to { transform: rotate(360deg); } }
        .hc-cmd-suggestions {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          background: rgba(14,16,25,0.98);
          border-top: 1px solid rgba(255,255,255,0.06);
          max-height: 300px;
          overflow-y: auto;
        }
        .hc-cmd-sug {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          cursor: pointer;
          transition: background 0.1s;
        }
        .hc-cmd-sug:hover, .hc-cmd-sug--active {
          background: rgba(198,146,58,0.06);
        }
        .hc-cmd-sug-cmd {
          font-size: 13px;
          font-weight: 700;
          color: #C6923A;
          min-width: 100px;
        }
        .hc-cmd-sug-desc {
          font-size: 12px;
          color: #888;
          flex: 1;
        }
        .hc-cmd-sug-ex {
          font-size: 10px;
          color: #444;
        }
      `}</style>
    </div>
  );
}
