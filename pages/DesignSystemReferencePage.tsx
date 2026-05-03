import React from 'react';
import Card from '@/components/common/Card';
import Chip from '@/components/common/Chip';
import NavItem from '@/components/common/NavItem';
import HeaderAction from '@/components/common/HeaderAction';
import { uiTokens } from '@/components/common/uiTokens';

const DesignSystemReferencePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Authenticated UI Reference</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Frozen component variants for future implementation and visual regression tracking.
        </p>
      </header>

      <Card variant="surface" className="p-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Canonical tokens</h3>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <li><strong>Corner radius:</strong> {uiTokens.radius.surface} (16px surface / 12px interactive)</li>
          <li><strong>Card elevation:</strong> {uiTokens.elevation.card}</li>
          <li><strong>Icon stroke width:</strong> {uiTokens.icon.strokeWidth} default, {uiTokens.icon.activeStrokeWidth} active</li>
          <li><strong>Chip height:</strong> {uiTokens.chip.height} (32px)</li>
        </ul>
      </Card>

      <Card variant="surface" className="p-5 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Component variants</h3>
        <div className="flex flex-wrap gap-3">
          <Chip variant="brand" active>Active Brand</Chip>
          <Chip variant="brand">Idle Brand</Chip>
          <Chip variant="neutral" active>Active Neutral</Chip>
          <Chip variant="danger">Danger</Chip>
          <Chip variant="success">Success</Chip>
        </div>

        <div className="flex items-center gap-3">
          <HeaderAction icon="search" aria-label="search" />
          <HeaderAction icon="menu" active aria-label="menu" />
          <HeaderAction icon="arrowLeft" aria-label="back" />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <NavItem to="/dashboard" icon="dashboard" label="Dashboard item" exact />
          <NavItem to="/settings" icon="settings" label="Settings item" />
        </div>
      </Card>

      <Card variant="muted" className="p-5 space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Visual diff checklist</h3>
        <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-200 space-y-1">
          <li>Compare light vs dark surfaces for header, sidebar, cards, and chip contrast.</li>
          <li>Validate authenticated routes (/dashboard, /explore, /settings) for token usage only.</li>
          <li>Validate unauthenticated screens (/ and /login) for token parity where shared components appear.</li>
          <li>Confirm active navigation icon stroke weight matches tokenized active width.</li>
        </ul>
      </Card>
    </div>
  );
};

export default DesignSystemReferencePage;
