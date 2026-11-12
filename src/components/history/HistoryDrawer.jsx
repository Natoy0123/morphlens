import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  Download,
  Trash2,
  Maximize2,
  Calendar,
} from 'lucide-react';
import {
  getAllGenerations,
  deleteGenerationRecord,
  clearAllGenerations,
} from '../../services/historyStorage';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function HistoryDrawer({
  isOpen,
  onClose,
  onSelectGeneration,
  onInspectImage,
  onNotify,
}) {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return undefined;

    const load = async () => {
      setIsLoading(true);
      try {
        const items = await getAllGenerations();
        if (isMounted) setHistoryItems(items);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await deleteGenerationRecord(id);
    if (ok) {
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      onNotify?.('Portrait deleted from history');
    }
  };

  const executeClearAll = async () => {
    const ok = await clearAllGenerations();
    if (ok) {
      setHistoryItems([]);
      onNotify?.('All history cleared');
    }
    setShowClearConfirm(false);
  };

  const handleDownload = (e, url, prompt) => {
    e.stopPropagation();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    const cleanPrompt = (prompt || 'portrait')
      .slice(0, 30)
      .replace(/[^a-z0-9]+/gi, '_')
      .toLowerCase();
    link.download = `morphlens_${cleanPrompt}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify?.('Portrait downloaded');
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <History size={17} className="text-zinc-300" />
            <h2 className="text-sm font-semibold text-zinc-100">Portrait History</h2>
            <span className="text-xs font-mono bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full text-zinc-300">
              {historyItems.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {historyItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-950/40 transition-colors"
                title="Clear all history"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label="Close history"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-xs text-zinc-400">
              Loading history...
            </div>
          ) : historyItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4">
              <History size={36} className="text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-300 mb-1">No portraits saved yet</p>
              <p className="text-xs text-zinc-400 max-w-xs">
                Generated portraits are automatically saved here with full before/after history and
                prompts.
              </p>
            </div>
          ) : (
            historyItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3 transition-all shadow-md hover:shadow-lg flex gap-3"
              >
                {/* Accessible Full-Card Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectGeneration?.(item);
                    onClose();
                  }}
                  className="absolute inset-0 w-full h-full rounded-2xl focus-visible:ring-2 focus-visible:ring-white/40 focus:outline-none z-0"
                  aria-label={`Select portrait from ${formatTimestamp(item.timestamp)}`}
                />

                {/* Thumbnail with Reference Badge */}
                <div className="relative w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-black border border-zinc-800 pointer-events-none">
                  <img
                    src={item.generatedUrl}
                    alt="Generated Portrait"
                    className="w-full h-full object-cover"
                  />
                  {item.originalUrl && (
                    <div
                      className="absolute bottom-1 right-1 w-6 h-6 rounded-md overflow-hidden border border-white/60 shadow"
                      title="Reference Photo"
                    >
                      <img
                        src={item.originalUrl}
                        alt="Reference"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pointer-events-none">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={12} />
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <span className="capitalize font-medium text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded text-xs">
                        {(item.framingMode || 'headshot').replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-200 line-clamp-2 leading-snug font-sans">
                      {item.prompt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/60 pointer-events-auto relative z-10">
                    <span className="text-xs text-zinc-400 font-mono truncate max-w-[130px]">
                      {item.model?.split('/').pop() || 'FLUX.1'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectImage?.(item.generatedUrl);
                        }}
                        className="min-h-[36px] min-w-[36px] p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center"
                        title="Inspect full resolution"
                        aria-label="Inspect portrait"
                      >
                        <Maximize2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDownload(e, item.generatedUrl, item.prompt)}
                        className="min-h-[36px] min-w-[36px] p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center"
                        title="Download image"
                        aria-label="Download portrait"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item.id)}
                        className="min-h-[36px] min-w-[36px] p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors flex items-center justify-center"
                        title="Delete from history"
                        aria-label="Delete portrait"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Accessible Clear All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear All History?"
        message="This will permanently delete all saved portraits from your local device storage. This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Keep History"
        isDestructive={true}
        onConfirm={executeClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
