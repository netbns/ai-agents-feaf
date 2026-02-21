import { create } from 'zustand';
import type { Component, Relationship } from '@/types';

interface CanvasState {
  selectedComponentId: string | null;
  selectedRelationshipId: string | null;
  isDragging: boolean;
  zoom: number;
  panX: number;
  panY: number;
  setSelectedComponent: (id: string | null) => void;
  setSelectedRelationship: (id: string | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  reset: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  selectedComponentId: null,
  selectedRelationshipId: null,
  isDragging: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  setSelectedComponent: (id) => set({ selectedComponentId: id }),
  setSelectedRelationship: (id) => set({ selectedRelationshipId: id }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  reset: () =>
    set({
      selectedComponentId: null,
      selectedRelationshipId: null,
      isDragging: false,
      zoom: 1,
      panX: 0,
      panY: 0,
    }),
}));
