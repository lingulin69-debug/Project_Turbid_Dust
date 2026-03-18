import React, { useState } from 'react';
import {
  WhiteCrowCard,
  WCListContent,
  WCTextContent,
  WCGridContent,
  WCTabBar,
  WCButton,
  WCInput
} from './WhiteCrowCard';
import { Shirt, Puzzle, Hourglass, Coins, Heart } from 'lucide-react';

/**
 * 各功能面板的白鴉之繭風格實作
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. 公告面板 (Announcement Panel)
// ═════════════════════════════════════════════════════════════════════════════

interface AnnouncementPanelProps {
  announcements: Array<{ id: string; title: string; content: string; date: string }>;
  onClose: () => void;
  faction?: "Turbid" | "Pure";
}

export const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({ announcements, onClose, faction }) => {
  return (
    <WhiteCrowCard
      title="觀測日誌"
      code="ANN-00"
      onClose={onClose}
      faction={faction}
    >
      <WCListContent items={announcements} />
    </WhiteCrowCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. 任務面板 (Quest Panel)
// ═════════════════════════════════════════════════════════════════════════════

interface Mission {
  id: string;
  title: string;
  description: string;
  current: number;
  max?: number;
  status: 'active' | 'full';
  faction: 'Turbid' | 'Pure' | 'Common';
  type: 'main' | 'side';
  chapterVersion: string;
}

interface QuestPanelProps {
  missions: Mission[];
  onClose: () => void;
  onJoinMission: (mission: Mission) => void;
  onSubmitReport: (subject: string) => void;
  isLocked: boolean;
  hasReportedMain: boolean;
  faction?: "Turbid" | "Pure";
}

export const QuestPanel: React.FC<QuestPanelProps> = ({
  missions,
  onClose,
  onJoinMission,
  onSubmitReport,
  isLocked,
  hasReportedMain,
  faction,
}) => {
  const [activeTab, setActiveTab] = useState('recruitment');
  const [reportSubject, setReportSubject] = useState('');

  return (
    <WhiteCrowCard
      title="任務徵集"
      code="QUEST-01"
      onClose={onClose}
      faction={faction}
      hasNavigation
      currentIndex={activeTab === 'recruitment' ? 0 : 1}
      totalPages={2}
      onNavigate={(i) => setActiveTab(i === 0 ? 'recruitment' : 'reporting')}
    >
      <WCTabBar
        tabs={[
          { id: 'recruitment', label: '現有任務' },
          { id: 'reporting', label: '回報任務' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'recruitment' && (
        <div className="space-y-6">
          <style>{`
            .mission-card {
              padding: 20px;
              border: 1px solid var(--wc-tab-border);
              border-radius: 6px;
              background: var(--wc-item-bg);
              transition: all 0.2s ease;
            }

            .mission-card.full {
              opacity: 0.7;
            }

            .mission-header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 12px;
            }

            .mission-title {
              font-size: 15px;
              font-weight: 500;
              color: var(--wc-text-primary);
              letter-spacing: 1.5px;
            }

            .mission-faction-tag {
              font-family: 'JetBrains Mono', monospace;
              font-size: 9px;
              padding: 4px 8px;
              border: 1px solid;
              border-radius: 4px;
              letter-spacing: 1px;
            }

            .mission-description {
              font-size: 13px;
              line-height: 1.6;
              color: var(--wc-text-secondary);
              margin-bottom: 16px;
              font-weight: 300;
            }

            .mission-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .mission-progress {
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              color: var(--wc-primary);
            }
          `}</style>

          {missions.map((m) => (
            <div key={m.id} className={`mission-card ${m.status === 'full' ? 'full' : ''}`}>
              <div className="mission-header">
                <h4 className="mission-title">{m.title}</h4>
                <span className={`mission-faction-tag`} style={{
                  borderColor: m.faction === 'Turbid' ? '#7c3aed' : m.faction === 'Pure' ? '#d4af37' : '#b89f86',
                  color: m.faction === 'Turbid' ? '#7c3aed' : m.faction === 'Pure' ? '#d4af37' : '#b89f86',
                }}>
                  {m.faction}
                </span>
              </div>
              <p className="mission-description">{m.description}</p>
              <div className="mission-footer">
                <span className="mission-progress">
                  {m.type === 'main' ? `人員: ${m.current}/${m.max}` : `匯聚人數: ${m.current} / ∞`}
                </span>
                <WCButton
                  onClick={() => onJoinMission(m)}
                  disabled={m.type === 'main' && (m.status === 'full' || hasReportedMain || isLocked)}
                  size="sm"
                >
                  {m.type === 'main' && m.status === 'full' ? '已滿額'
                   : m.type === 'main' && hasReportedMain ? '已記錄'
                   : m.type === 'main' && isLocked ? '鎖定中'
                   : '參與'}
                </WCButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reporting' && (
        <div>
          <WCInput
            value={reportSubject}
            onChange={setReportSubject}
            placeholder="[章節]-[據點名稱]-[OC名稱]"
            label="Mission Subject"
          />

          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderLeft: '2px solid var(--wc-tab-border)',
            paddingLeft: '16px',
          }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: 'var(--wc-primary)',
              lineHeight: '1.6',
            }}>
              * 格式範例:第一章-荒原裂隙-塞理安<br/>
              * 請確認據點名稱與當前位置一致。
            </p>
          </div>

          <WCButton
            onClick={() => onSubmitReport(reportSubject)}
            fullWidth
          >
            Submit Report
          </WCButton>
        </div>
      )}
    </WhiteCrowCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. 日誌面板 (Daily Log Panel)
// ═════════════════════════════════════════════════════════════════════════════

interface DailyPanelProps {
  echoes: Array<{ id: string; content: string; timestamp: string }>;
  snippets: Array<{ id: string; content: string; likes: number; isLiked: boolean }>;
  onClose: () => void;
  onLikeSnippet: (id: string) => void;
  faction?: "Turbid" | "Pure";
}

export const DailyPanel: React.FC<DailyPanelProps> = ({
  echoes,
  snippets,
  onClose,
  onLikeSnippet,
  faction,
}) => {
  const [activeTab, setActiveTab] = useState('echoes');

  return (
    <WhiteCrowCard
      title="靈魂足跡"
      code="LOG-72"
      onClose={onClose}
      faction={faction}
      hasNavigation
      currentIndex={activeTab === 'echoes' ? 0 : 1}
      totalPages={2}
      onNavigate={(i) => setActiveTab(i === 0 ? 'echoes' : 'snippets')}
    >
      <WCTabBar
        tabs={[
          { id: 'echoes', label: '小道消息' },
          { id: 'snippets', label: '觀察日報' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'echoes' && (
        <div className="space-y-4">
          <style>{`
            .echo-item {
              padding: 16px;
              border-left: 2px solid var(--wc-tab-border);
              padding-left: 16px;
              transition: all 0.2s ease;
            }

            .echo-item:hover {
              border-left-color: var(--wc-primary);
            }

            .echo-content {
              font-size: 13px;
              line-height: 1.7;
              color: var(--wc-text-secondary);
              margin-bottom: 8px;
            }

            .echo-time {
              font-family: 'JetBrains Mono', monospace;
              font-size: 9px;
              color: var(--wc-text-muted);
              letter-spacing: 1px;
            }
          `}</style>

          {echoes.map((echo) => (
            <div key={echo.id} className="echo-item">
              <p className="echo-content">{echo.content}</p>
              <span className="echo-time">{echo.timestamp}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'snippets' && (
        <div className="space-y-4">
          <style>{`
            .snippet-card {
              padding: 16px;
              background: var(--wc-item-bg);
              border: 1px solid var(--wc-tab-border);
              border-radius: 6px;
              transition: all 0.2s ease;
            }

            .snippet-card:hover {
              background: var(--wc-item-hover-bg);
            }

            .snippet-content {
              font-size: 13px;
              line-height: 1.7;
              color: var(--wc-text-primary);
              margin-bottom: 12px;
            }

            .snippet-footer {
              display: flex;
              justify-content: flex-end;
            }

            .like-button {
              display: flex;
              align-items: center;
              gap: 6px;
              background: transparent;
              border: none;
              cursor: pointer;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              color: var(--wc-primary);
              transition: all 0.2s ease;
            }

            .like-button:hover {
              color: #c0392b;
            }

            .like-button.liked {
              color: #c0392b;
            }
          `}</style>

          {snippets.map((snippet) => (
            <div key={snippet.id} className="snippet-card">
              <p className="snippet-content">{snippet.content}</p>
              <div className="snippet-footer">
                <button
                  onClick={() => onLikeSnippet(snippet.id)}
                  className={`like-button ${snippet.isLiked ? 'liked' : ''}`}
                >
                  <Heart className={`w-3 h-3 ${snippet.isLiked ? 'fill-current' : ''}`} />
                  <span>{snippet.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </WhiteCrowCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. 圖鑑面板 (Collection Panel)
// ═════════════════════════════════════════════════════════════════════════════

interface CollectionPanelProps {
  onClose: () => void;
  faction?: "Turbid" | "Pure";
}

export const CollectionPanel: React.FC<CollectionPanelProps> = ({ onClose, faction }) => {
  const [activeTab, setActiveTab] = useState<'raiment' | 'fragments' | 'relics'>('raiment');

  const getIcon = () => {
    switch (activeTab) {
      case 'raiment': return <Shirt className="w-6 h-6" style={{ color: '#BFBAA8' }} />;
      case 'fragments': return <Puzzle className="w-6 h-6" style={{ color: '#BFBAA8' }} />;
      case 'relics': return <Hourglass className="w-6 h-6" style={{ color: '#BFBAA8' }} />;
    }
  };

  const gridItems = Array.from({ length: 8 }).map((_, i) => ({
    id: `item-${i}`,
    label: `#${i + 1}`,
    icon: getIcon(),
    isEmpty: true,
  }));

  return (
    <WhiteCrowCard
      title="萬象圖鑑"
      code="COL-88"
      onClose={onClose}
      faction={faction}
      hasNavigation
      currentIndex={['raiment', 'fragments', 'relics'].indexOf(activeTab)}
      totalPages={3}
      onNavigate={(i) => setActiveTab(['raiment', 'fragments', 'relics'][i] as any)}
    >
      <WCTabBar
        tabs={[
          { id: 'raiment', label: '衣服' },
          { id: 'fragments', label: '碎片' },
          { id: 'relics', label: '遺物' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'raiment' && (
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          border: '1px solid var(--wc-tab-border)',
          borderRadius: '6px',
          background: 'var(--wc-item-bg)',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '12px',
            fontStyle: 'italic',
            color: 'var(--wc-text-secondary)',
            lineHeight: '1.8',
            marginBottom: '16px',
          }}>
            『命運的輪盤已不再此處轉動...<br/>
            舊日的衣裝已悉數移往據點商店。』
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '9px',
            color: 'var(--wc-primary)',
            letterSpacing: '2px',
          }}>
            Transferred to Landmark Shop
          </div>
        </div>
      )}

      <WCGridContent items={gridItems} columns={4} />

      <p style={{
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid var(--wc-tab-border)',
        fontSize: '10px',
        color: 'var(--wc-primary)',
        textAlign: 'center',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        * 圖片僅留存於 QQ 群聊相本，此處僅供感官回溯。
      </p>
    </WhiteCrowCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 5. 設定面板 (Settings Panel)
// ═════════════════════════════════════════════════════════════════════════════

interface SettingsPanelProps {
  bgmVolume: number;
  sfxVolume: number;
  onBgmVolumeChange: (value: number) => void;
  onSfxVolumeChange: (value: number) => void;
  onClose: () => void;
  faction?: "Turbid" | "Pure";
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  bgmVolume,
  sfxVolume,
  onBgmVolumeChange,
  onSfxVolumeChange,
  onClose,
  faction,
}) => {
  return (
    <WhiteCrowCard
      title="儀式設定"
      code="SET-00"
      onClose={onClose}
      faction={faction}
    >
      <style>{`
        .settings-group {
          margin-bottom: 32px;
        }

        .settings-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .settings-label-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: var(--wc-primary);
          text-transform: uppercase;
        }

        .settings-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--wc-text-primary);
        }

        .settings-slider {
          width: 100%;
          height: 2px;
          background: var(--wc-tab-border);
          border-radius: 1px;
          outline: none;
          appearance: none;
          cursor: pointer;
        }

        .settings-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: var(--wc-primary);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-slider::-webkit-slider-thumb:hover {
          opacity: 0.8;
          transform: scale(1.2);
        }

        .settings-footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid var(--wc-tab-border);
          text-align: center;
        }

        .settings-footer-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--wc-text-muted);
          letter-spacing: 2px;
          line-height: 1.6;
        }
      `}</style>

      <div className="settings-group">
        <div className="settings-label">
          <span className="settings-label-text">BGM Volume</span>
          <span className="settings-value">{bgmVolume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={bgmVolume}
          onChange={(e) => onBgmVolumeChange(Number(e.target.value))}
          className="settings-slider"
        />
      </div>

      <div className="settings-group">
        <div className="settings-label">
          <span className="settings-label-text">SFX Volume</span>
          <span className="settings-value">{sfxVolume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sfxVolume}
          onChange={(e) => onSfxVolumeChange(Number(e.target.value))}
          className="settings-slider"
        />
      </div>

      <div className="settings-footer">
        <p className="settings-footer-text">
          SACRED CANVAS HELPER v1.0<br/>
          SYSTEM INTEGRITY: STABLE
        </p>
      </div>
    </WhiteCrowCard>
  );
};
