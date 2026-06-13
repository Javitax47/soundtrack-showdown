import { Song, RankedSong } from '../lib/supabase';
import { GripVertical, Play, Pause } from 'lucide-react';
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getTierForRank, TIERS } from '../lib/tierUtils';

interface RankingPanelProps {
  rankedSongs: (RankedSong & { song?: Song })[];
  isCompact?: boolean;
  isRankingMode?: boolean;
  onInsertAt?: (index: number) => void;
  onPreview?: (song: Song) => void;
  activePreviewId?: string | null;
  onDragEnd?: (event: DragEndEvent) => void;
  tutorialPhase?: string | null;
  onTutorialAdvance?: () => void;
  tierBounds: Record<string, number> | null;
}

export function RankingPanel({
  rankedSongs,
  isCompact = false,
  isRankingMode = false,
  onInsertAt,
  onPreview,
  activePreviewId,
  onDragEnd,
  tutorialPhase,
  tierBounds
}: RankingPanelProps) {
  const displaySongs = isCompact ? rankedSongs.slice(0, 10) : rankedSongs;
  const showMore = isCompact && rankedSongs.length > 10;

  const totalRanked = rankedSongs.length;

  // Compute mixed items for sortable context
  const mixedItems: string[] = [];
  if (tierBounds) {
    rankedSongs.forEach((item, index) => {
      if (index === tierBounds.A) mixedItems.push('tier-A');
      if (index === tierBounds.B) mixedItems.push('tier-B');
      if (index === tierBounds.C) mixedItems.push('tier-C');
      if (index === tierBounds.D) mixedItems.push('tier-D');
      mixedItems.push(item.song_id);
    });

    // Add any headers that might be at the very end
    if (rankedSongs.length === tierBounds.A) mixedItems.push('tier-A');
    if (rankedSongs.length === tierBounds.B) mixedItems.push('tier-B');
    if (rankedSongs.length === tierBounds.C) mixedItems.push('tier-C');
    if (rankedSongs.length === tierBounds.D) mixedItems.push('tier-D');
  } else {
    displaySongs.forEach(s => mixedItems.push(s.song_id));
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className={`glass-card rounded-[2rem] overflow-hidden flex flex-col h-full bg-slate-900/60 border border-white/5`}>
      <div className="bg-slate-900/80 border-b border-white/10 px-6 py-5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
          {isRankingMode && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
          {isRankingMode ? 'Leaderboard Ladder' : 'The Leaderboard'}
        </h3>
        <span className="bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/20">
          {rankedSongs.length} TRACKS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar leading-none relative min-h-0">
        {displaySongs.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <GripVertical size={24} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ladder Empty</p>
            <p className="text-slate-600 text-[10px] mt-2 max-w-[200px]">Begin ranking songs to climb the ladder.</p>
          </div>
        ) : (
          <div className="py-2">
            {/* Slot at the very top (Rank 1) */}
            {isRankingMode && onInsertAt && (
              <div
                className="h-6 -my-3 relative group/slot flex items-center justify-center cursor-pointer z-10 mx-4 active:scale-95 transition-transform mb-1 mt-1"
                onClick={() => onInsertAt(0)}
              >
                <div className="absolute inset-x-4 h-[1px] bg-yellow-500/20 group-hover/slot:bg-yellow-400/80 transition-colors" />
                <div className="bg-slate-900 border border-slate-700/50 text-slate-500 group-hover/slot:border-yellow-500/50 group-hover/slot:text-yellow-400 group-hover/slot:bg-slate-800 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full z-20 transition-all">
                  + #1 (TOP)
                </div>
              </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={mixedItems} strategy={verticalListSortingStrategy}>
                {mixedItems.map((id) => {
                  if (id.startsWith('tier-')) {
                    const tierId = id.replace('tier-', '');
                    const tier = TIERS[tierId];
                    return <SortableTierHeader key={id} id={id} tier={tier} />;
                  }

                  const item = rankedSongs.find(s => s.song_id === id);
                  if (!item) return null;

                  const index = rankedSongs.findIndex(s => s.song_id === id);
                  const tierId = getTierForRank(index + 1, totalRanked, tierBounds);
                  const tier = TIERS[tierId];

                  return (
                    <SortableSongItem
                      key={item.song_id}
                      item={item}
                      index={index}
                      isRankingMode={isRankingMode}
                      activePreviewId={activePreviewId}
                      onPreview={onPreview}
                      onInsertAt={onInsertAt}
                      tutorialPhase={tutorialPhase}
                      tier={tier}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {showMore && !isRankingMode && (
        <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            + {rankedSongs.length - 10} MORE TRACKS IN LIST
          </p>
        </div>
      )}
    </div>
  );
}

function SortableTierHeader({ id, tier }: { id: string, tier: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over
  } = useSortable({ id });

  const isOverSelf = over?.id === id;
  // We need to check the active item type. 
  // dnd-kit doesn't natively expose the active item easily here without context, 
  // but we can assume if it's over and NOT self-dragging.
  const showHighlight = isOverSelf && !isDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <div className={`mt-6 mb-3 px-4 py-2 rounded-xl border flex items-center justify-between animate-fade-in transition-all duration-300 ${showHighlight ? 'bg-white/20 border-white/40 scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]' : `${tier.bgColor} ${tier.borderColor}`} hover:bg-white/5`}>
        <div className="flex items-center gap-3">
          <span className={`text-xl shadow-sm transition-transform duration-300 ${showHighlight ? 'scale-125' : ''}`}>{tier.emoji}</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${tier.color}`}>{tier.label}</h4>
              {showHighlight && (
                <span className="text-[8px] bg-white text-slate-900 px-1.5 py-0.5 rounded-full font-black animate-pulse">SOLTAR AQUÍ</span>
              )}
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{tier.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-1">
          <div className={`h-[2px] flex-1 ml-6 rounded-full transition-colors ${showHighlight ? 'bg-white/40' : 'bg-slate-800/50'}`} />
          <GripVertical size={14} className={`${showHighlight ? 'text-white' : 'text-slate-600'}`} />
        </div>
      </div>
    </div>
  );
}

function SortableSongItem({ item, index, isRankingMode, activePreviewId, onPreview, onInsertAt, tutorialPhase, tier }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.song_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  const song = item.song;
  const isTop3 = index < 3;
  const isPreviewing = activePreviewId === song?.id;
  const isFirstItem = index === 0;
  const isReorderTutorial = tutorialPhase === 'REORDER' && isFirstItem;

  return (
    <React.Fragment>
      <div
        ref={setNodeRef}
        style={style}
        className={`group px-4 py-3 flex items-center gap-3 transition-all relative
          ${isPreviewing ? 'bg-blue-500/10' : 'hover:bg-white/5'}
          ${isDragging ? 'shadow-2xl shadow-blue-500/20 bg-slate-800 scale-[1.02] border border-white/10' : ''}
          ${isReorderTutorial ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 animate-pulse z-20' : ''}
        `}
      >
        <button
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing hover:text-white transition-colors p-1 rounded-md ${isReorderTutorial ? 'text-blue-400 bg-blue-500/20' : 'text-slate-600'}`}
          title="Drag to reposition"
        >
          <GripVertical size={16} />
        </button>

        {isPreviewing && (
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
        )}

        <div className="flex-shrink-0 relative">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all relative z-10
            ${isTop3
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-slate-900 shadow-lg shadow-yellow-500/20'
              : tier.bgColor + ' ' + tier.color + ' border ' + tier.borderColor}
          `}>
            {index + 1}
            {tier.label === 'Tier S' && index > 0 && (
              <div className="absolute -top-1.5 -right-1.5 text-[10px]">✨</div>
            )}
          </div>
          {isTop3 && (
            <div className="absolute inset-0 bg-yellow-400/30 blur-md rounded-full pulse-glow" />
          )}
        </div>

        <div className="relative flex-shrink-0">
          {song?.thumbnail_url ? (
            <img
              src={song.thumbnail_url}
              alt=""
              className={`w-10 h-10 rounded-xl object-cover shadow-lg border transition-all pointer-events-none select-none ${isPreviewing ? 'border-blue-400 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-white/10 group-hover:scale-105'
                }`}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-8 pointer-events-none select-none">
          <p className={`font-bold truncate text-sm tracking-tight transition-colors ${isPreviewing ? 'text-blue-400' : 'text-white group-hover:text-blue-300'}`}>
            {song?.title || 'Loading...'}
          </p>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest truncate mt-0.5">
            {song?.game || 'Unknown Game'}
          </p>
        </div>

        {/* Preview Button */}
        {isRankingMode && onPreview && song && (
          <div className={`absolute right-6 transition-all duration-300 ${isPreviewing ? 'opacity-100 scale-110' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(song); }}
              className={`p-2 rounded-full backdrop-blur-md transition-all border ${isPreviewing
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              title={isPreviewing ? "Stop Previewing" : "Preview to Compare"}
            >
              {isPreviewing ? <Pause size={14} className="fill-blue-400" /> : <Play size={14} className="translate-x-[1px]" />}
            </button>
          </div>
        )}
      </div>

      {/* Slot below this item */}
      {isRankingMode && onInsertAt && (
        <div
          className="h-6 -my-3 relative group/slot flex items-center justify-center cursor-pointer z-10 mx-4 active:scale-95 transition-transform"
          onClick={() => onInsertAt(index + 1)}
        >
          <div className="absolute inset-x-4 h-[1px] bg-blue-500/20 group-hover/slot:bg-blue-400/80 transition-colors" />
          <div className="bg-slate-900 border border-slate-700/50 text-slate-500 group-hover/slot:border-blue-500/50 group-hover/slot:text-blue-400 group-hover/slot:bg-slate-800 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full z-20 transition-all">
            + #{index + 2}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
