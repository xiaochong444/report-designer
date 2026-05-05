import React from 'react';
import { Canvas } from '../Canvas';

export const DesignerCanvasFrame: React.FC = () => (
  <main className="rd-canvas-frame" data-testid="designer-canvas-frame">
    <div className="rd-canvas-ruler-corner" />
    <div className="rd-canvas-ruler rd-canvas-ruler-horizontal">
      {Array.from({ length: 22 }, (_, i) => (
        <span key={i}>{i * 10}</span>
      ))}
    </div>
    <div className="rd-canvas-ruler rd-canvas-ruler-vertical">
      {Array.from({ length: 30 }, (_, i) => (
        <span key={i}>{i * 10}</span>
      ))}
    </div>
    <div className="rd-canvas-workspace">
      <Canvas />
    </div>
  </main>
);
