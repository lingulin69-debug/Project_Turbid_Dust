import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/client';
import { FACTION_COLORS } from '@/lib/constants';

interface Decree {
  id: string;
  decree_type: string;
  content: string | null;
  target_oc: string | null;
  target_landmark_id: string | null;
  bounty_amount: number | null;
  bounty_completed: boolean;
  evil_points_cost: number;
  created_at: string;
}

interface LeaderStats {
  leader_evil_points: number;
  leader_treasury: number;
  is_taxed_this_chapter: boolean;
  faction: string;
}

interface LeaderTyrannyPanelProps {
  leaderOcName: string;
  chapter?: string;
  faction?: string;
}

// ── 陣營文字標籤 ────────────────────────────────────────────
const FACTION_LABELS = {
  Turbid: {
    statusSection:         '領主狀態',
    evilPoints:            '本章惡政點數',
    treasury:              '金庫',
    taxTitle:              '徵稅令',
    taxWarning:            '⚠ 本章已執行過徵稅令',
    taxBtn:                '發布徵稅令',
    taxFeedback:           (count: number) => `徵稅令發布。共向 ${count} 人徵收，金庫 +${count} 幣。`,
    curseTitle:            '命名詛咒',
    curseDesc:             '在指定本陣營玩家的匿名代號前強制加上詛咒前綴，持續本章。',
    cursePrefixPlaceholder:'詛咒前綴（如：腐朽的、被遺棄的）',
    curseBtn:              '發布詛咒',
    curseFeedback:         (prefix: string, target: string) => `詛咒已降下：「${prefix}」加諸於 ${target}。`,
    lawTitle:              '荒謬法令',
    lawBtn:                '發布法令',
    lawFeedback:           '荒謬法令已頒布。',
    bountyTitle:           '懸賞令',
    curseTreasuryTitle:    '詛咒金庫',
    curseTreasuryBtn:      '燒毀金庫',
    curseTreasuryConfirm:  '⚠ 金庫將清空至 0。敵方某人將受到詛咒。此操作不可撤銷。',
    curseTreasuryFeedback: '金庫焚盡。詛咒已落向敵方某人。',
    historyTitle:          '本章惡政紀錄',
    emptyHistory:          '本章尚未發布任何惡政。',
    decreeLabels: {
      tax:             '徵稅令',
      curse:           '命名詛咒',
      law:             '荒謬法令',
      bounty:          '懸賞令',
      curse_treasury:  '詛咒金庫',
    },
  },
  Pure: {
    statusSection:         '教皇狀態',
    evilPoints:            '本章神恩點數',
    treasury:              '聖庫',
    taxTitle:              '什一奉獻',
    taxWarning:            '⚠ 本章已執行過什一奉獻',
    taxBtn:                '發布什一奉獻',
    taxFeedback:           (count: number) => `什一奉獻發布。共向 ${count} 人徵收，聖庫 +${count} 幣。`,
    curseTitle:            '賜福',
    curseDesc:             '在指定本陣營玩家的匿名代號前強制加上賜福前綴，持續本章。',
    cursePrefixPlaceholder:'賜福前綴（如：蒙恩的、受庇護的）',
    curseBtn:              '賜予祝福',
    curseFeedback:         (prefix: string, target: string) => `賜福已降下：「${prefix}」加諸於 ${target}。`,
    lawTitle:              '教義頒布',
    lawBtn:                '頒布教義',
    lawFeedback:           '教義已頒布。',
    bountyTitle:           '懸賞令',
    curseTreasuryTitle:    '信仰忠誠',
    curseTreasuryBtn:      '燃盡聖庫',
    curseTreasuryConfirm:  '⚠ 聖庫將清空至 0。敵方某人將受到詛咒。此操作不可撤銷。',
    curseTreasuryFeedback: '聖庫焚盡。詛咒已落向敵方某人。',
    historyTitle:          '本章教令紀錄',
    emptyHistory:          '本章尚未發布任何教令。',
    decreeLabels: {
      tax:             '什一奉獻',
      curse:           '賜福',
      law:             '教義頒布',
      bounty:          '懸賞令',
      curse_treasury:  '信仰忠誠',
    },
  },
};

const leaderEvil = FACTION_COLORS.leaderEvil;

// ── 破損邊框效果 ─────────────────────────────────────────────
const SECTION_STYLE: React.CSSProperties = {
  border: `1px dashed ${leaderEvil}66`,
  borderRadius: 4,
  padding: '12px 14px',
  position: 'relative',
};

export const LeaderTyrannyPanel: React.FC<LeaderTyrannyPanelProps> = ({
  leaderOcName,
  chapter = 'current',
  faction,
}) => {
  const L = faction === 'Pure' ? FACTION_LABELS.Pure : FACTION_LABELS.Turbid;

  const [stats, setStats] = useState<LeaderStats | null>(null);
  const [decrees, setDecrees] = useState<Decree[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  // Curse inputs
  const [curseTarget, setCurseTarget] = useState('');
  const [cursePrefix, setCursePrefix] = useState('');

  // Law input
  const [lawContent, setLawContent] = useState('');

  // Bounty inputs
  const [bountyTarget, setBountyTarget] = useState('');
  const [bountyLandmark, setBountyLandmark] = useState('');
  const [bountyAmount, setBountyAmount] = useState<1 | 2>(1);

  // Confirm dialogs
  const [confirmTax, setConfirmTax] = useState(false);
  const [confirmCurseTreasury, setConfirmCurseTreasury] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([
        apiClient.leader.getStats(leaderOcName),
        apiClient.leader.getDecrees(leaderOcName, chapter),
      ]);
      setStats(s);
      setDecrees(d);
    } catch (_) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [leaderOcName, chapter]);

  useEffect(() => { refresh(); }, [refresh]);

  const showFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3500);
  };

  const doTax = async () => {
    setConfirmTax(false);
    setSubmitting(true);
    try {
      const r = await apiClient.leader.tax(leaderOcName);
      showFeedback(L.taxFeedback(r.taxed_count), true);
      await refresh();
    } catch (e: any) { showFeedback(e.message, false); }
    finally { setSubmitting(false); }
  };

  const doCurse = async () => {
    if (!curseTarget.trim() || !cursePrefix.trim()) return showFeedback('請填寫目標OC名與前綴', false);
    setSubmitting(true);
    try {
      await apiClient.leader.curse(leaderOcName, curseTarget.trim(), cursePrefix.trim());
      showFeedback(L.curseFeedback(cursePrefix.trim(), curseTarget.trim()), true);
      setCurseTarget(''); setCursePrefix('');
      await refresh();
    } catch (e: any) { showFeedback(e.message, false); }
    finally { setSubmitting(false); }
  };

  const doLaw = async () => {
    if (!lawContent.trim()) return showFeedback('請填寫內容', false);
    setSubmitting(true);
    try {
      await apiClient.leader.law(leaderOcName, lawContent.trim());
      showFeedback(L.lawFeedback, true);
      setLawContent('');
      await refresh();
    } catch (e: any) { showFeedback(e.message, false); }
    finally { setSubmitting(false); }
  };

  const doBounty = async () => {
    if (!bountyTarget.trim() || !bountyLandmark.trim()) return showFeedback('請填寫目標OC名與據點', false);
    setSubmitting(true);
    try {
      await apiClient.leader.bounty(leaderOcName, bountyTarget.trim(), bountyLandmark.trim(), bountyAmount);
      showFeedback(`懸賞令發布。目標：${bountyTarget}，據點：${bountyLandmark}，賞金：${bountyAmount} 幣。`, true);
      setBountyTarget(''); setBountyLandmark('');
      await refresh();
    } catch (e: any) { showFeedback(e.message, false); }
    finally { setSubmitting(false); }
  };

  const doCurseTreasury = async () => {
    setConfirmCurseTreasury(false);
    setSubmitting(true);
    try {
      await apiClient.leader.curseTreasury(leaderOcName);
      showFeedback(L.curseTreasuryFeedback, true);
      await refresh();
    } catch (e: any) { showFeedback(e.message, false); }
    finally { setSubmitting(false); }
  };

  const evilDots = (pts: number) =>
    Array.from({ length: 3 }).map((_, i) => (
      <span
        key={i}
        style={{
          display: 'inline-block',
          width: 10, height: 10,
          borderRadius: '50%',
          marginRight: 5,
          backgroundColor: i < pts ? '#dc2626' : '#2a0a0a',
          border: `1px solid ${leaderEvil}`,
          boxShadow: i < pts ? '0 0 6px #dc262688' : 'none',
        }}
      />
    ));

  const inputCls = 'w-full border text-xs font-mono px-2 py-1.5 rounded focus:outline-none focus:border-[#dc2626] placeholder-[#5a2020]';
  const inputStyle = { backgroundColor: '#0f0505', borderColor: `${leaderEvil}44`, color: '#f5c6c6' };
  const btnRed = 'px-3 py-1.5 rounded text-xs font-mono tracking-widest transition-all border hover:bg-[#991b1b] disabled:opacity-40 disabled:cursor-not-allowed';
  const btnRedStyle = { backgroundColor: leaderEvil, color: '#fca5a5', borderColor: '#dc2626' };
  const btnGhost = 'px-3 py-1.5 rounded text-xs font-mono tracking-widest transition-all bg-transparent hover:text-[#fca5a5] disabled:opacity-40 disabled:cursor-not-allowed';
  const btnGhostStyle = { color: '#7f3030', borderColor: `${leaderEvil}44` };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-xs font-mono tracking-[0.3em] animate-pulse" style={{ color: leaderEvil }}>讀取中...</span>
      </div>
    );
  }

  const evils = stats?.leader_evil_points ?? 0;
  const treasury = stats?.leader_treasury ?? 0;
  const isTaxed = stats?.is_taxed_this_chapter ?? false;

  return (
    <div className="space-y-4 font-mono text-[#f5c6c6] pb-4">

      {/* Feedback */}
      {feedback && (
        <div
          className="px-3 py-2 rounded text-xs border"
          style={{
            backgroundColor: feedback.ok ? '#0a1f0a' : '#1f0a0a',
            borderColor: feedback.ok ? '#166534' : leaderEvil,
            color: feedback.ok ? '#86efac' : '#fca5a5',
          }}
        >
          {feedback.msg}
        </div>
      )}

      {/* 1. 基本資訊 */}
      <div style={SECTION_STYLE}>
        <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: leaderEvil }}>{L.statusSection}</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#854040] mb-1.5 tracking-widest">{L.evilPoints}</div>
            <div className="flex items-center gap-1">
              {evilDots(evils)}
              <span className="text-xs text-[#dc2626] ml-1">{evils} / 3</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#854040] mb-1 tracking-widest">{L.treasury}</div>
            <div className="text-lg font-bold text-[#dc2626]">{treasury}</div>
            <div className="text-[10px] text-[#854040]">幣</div>
          </div>
        </div>
        {isTaxed && (
          <div
            className="mt-2 text-[10px] border rounded px-2 py-1"
            style={{ color: leaderEvil, borderColor: `${leaderEvil}33` }}
          >
            {L.taxWarning}
          </div>
        )}
      </div>

      {/* 2a. 徵稅令 / 什一奉獻 */}
      <div style={SECTION_STYLE}>
        <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: leaderEvil }}>
          {L.taxTitle} <span className="normal-case text-[#854040] tracking-normal">（消耗 1 點）</span>
        </div>
        <p className="text-[11px] text-[#854040] mb-3 leading-relaxed">
          對本陣營所有玩家強制扣 1 幣進{L.treasury}。被徵收玩家本章任務多 +1 幣補償。
        </p>
        {confirmTax ? (
          <div className="flex gap-2">
            <button onClick={doTax} disabled={submitting} className={btnRed} style={btnRedStyle}>確認發布</button>
            <button onClick={() => setConfirmTax(false)} className={btnGhost} style={btnGhostStyle}>取消</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmTax(true)}
            disabled={submitting || evils < 1 || isTaxed}
            className={btnRed}
            style={btnRedStyle}
          >
            {isTaxed ? '本章已使用' : L.taxBtn}
          </button>
        )}
      </div>

      {/* 2b. 命名詛咒 / 賜福 */}
      <div style={SECTION_STYLE}>
        <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: leaderEvil }}>
          {L.curseTitle} <span className="normal-case text-[#854040] tracking-normal">（消耗 1 點）</span>
        </div>
        <p className="text-[11px] text-[#854040] mb-3 leading-relaxed">
          {L.curseDesc}
        </p>
        <div className="space-y-2">
          <input
            className={inputCls}
            placeholder="目標 OC 名稱"
            value={curseTarget}
            onChange={e => setCurseTarget(e.target.value)}
            style={inputStyle}
          />
          <input
            className={inputCls}
            placeholder={L.cursePrefixPlaceholder}
            value={cursePrefix}
            onChange={e => setCursePrefix(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={doCurse}
            disabled={submitting || evils < 1}
            className={btnRed}
            style={btnRedStyle}
          >
            {L.curseBtn}
          </button>
        </div>
      </div>

      {/* 2c. 荒謬法令 / 教義頒布 */}
      <div style={SECTION_STYLE}>
        <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: leaderEvil }}>
          {L.lawTitle} <span className="normal-case text-[#854040] tracking-normal">（消耗 1 點）</span>
        </div>
        <p className="text-[11px] text-[#854040] mb-3 leading-relaxed">
          發布一條無機制效果的陣營公告，玩家登入後第一個畫面顯示。
        </p>
        <div className="space-y-2">
          <textarea
            className={`${inputCls} resize-none h-20`}
            placeholder="輸入內容..."
            value={lawContent}
            onChange={e => setLawContent(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={doLaw}
            disabled={submitting || evils < 1}
            className={btnRed}
            style={btnRedStyle}
          >
            {L.lawBtn}
          </button>
        </div>
      </div>

      {/* 3a. 懸賞令 */}
      <div style={SECTION_STYLE}>
        <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: leaderEvil }}>
          {L.bountyTitle} <span className="normal-case text-[#854040] tracking-normal">（消耗{L.treasury}貨幣）</span>
        </div>
        <div className="text-[11px] text-[#854040] mb-3 leading-relaxed space-y-0.5">
          <div>賞 1 幣 → 需 3 幣 ／ 賞 2 幣 → 需 5 幣</div>
          <div>指定玩家完成指定據點任務後自動從{L.treasury}轉帳。</div>
        </div>
        <div className="space-y-2">
          <input
            className={inputCls}
            placeholder="目標 OC 名稱"
            value={bountyTarget}
            onChange={e => setBountyTarget(e.target.value)}
            style={inputStyle}
          />
          <input
            className={inputCls}
            placeholder="指定據點名稱"
            value={bountyLandmark}
            onChange={e => setBountyLandmark(e.target.value)}
            style={inputStyle}
          />
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-[#854040]">賞金：</span>
            {([1, 2] as const).map(v => (
              <button
                key={v}
                onClick={() => setBountyAmount(v)}
                className="px-3 py-1 rounded text-xs font-mono border transition-all"
                style={{
                  backgroundColor: bountyAmount === v ? leaderEvil : 'transparent',
                  borderColor: bountyAmount === v ? '#dc2626' : `${leaderEvil}44`,
                  color: bountyAmount === v ? '#fca5a5' : '#854040',
                }}
              >
                {v} 幣
              </button>
            ))}
            <span className="text-[10px] text-[#5a2020] ml-1">
              (需 {bountyAmount === 1 ? 3 : 5} 庫幣)
            </span>
          </div>
          <button
            onClick={doBounty}
            disabled={submitting || treasury < (bountyAmount === 1 ? 3 : 5)}
            className={btnRed}
            style={btnRedStyle}
          >
            發布{L.bountyTitle}
          </button>
        </div>
      </div>

      {/* 3b. 詛咒金庫 / 信仰忠誠 */}
      <div style={{ ...SECTION_STYLE, borderColor: '#991b1b99', boxShadow: `0 0 12px ${leaderEvil}22` }}>
        <div className="text-[10px] tracking-[0.3em] uppercase text-[#dc2626] mb-2">
          {L.curseTreasuryTitle} <span className="normal-case text-[#854040] tracking-normal">（需 8 庫幣）</span>
        </div>
        <p className="text-[11px] text-[#854040] mb-3 leading-relaxed">
          燒掉{L.treasury}所有貨幣。隨機一名敵方玩家本章最大 HP 上限 -3。
        </p>
        {confirmCurseTreasury ? (
          <div className="space-y-2">
            <p className="text-[11px] text-[#dc2626] border rounded px-2 py-1.5" style={{ borderColor: `${leaderEvil}66` }}>
              {L.curseTreasuryConfirm}
            </p>
            <div className="flex gap-2">
              <button onClick={doCurseTreasury} disabled={submitting} className={btnRed} style={btnRedStyle}>確認燒毀</button>
              <button onClick={() => setConfirmCurseTreasury(false)} className={btnGhost} style={btnGhostStyle}>取消</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmCurseTreasury(true)}
            disabled={submitting || treasury < 8}
            className={btnRed}
            style={{ ...btnRedStyle, backgroundColor: '#991b1b', borderColor: '#dc2626' }}
          >
            {L.curseTreasuryBtn}
          </button>
        )}
      </div>

      {/* 4. 本章惡政紀錄 / 本章教令紀錄 */}
      <div style={SECTION_STYLE}>
        <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: leaderEvil }}>
          {L.historyTitle}
        </div>
        {decrees.length === 0 ? (
          <div className="text-xs text-[#5a2020] italic">{L.emptyHistory}</div>
        ) : (
          <div className="space-y-1.5">
            {decrees.map(d => (
              <div
                key={d.id}
                className="flex items-start gap-2 text-[11px] border-l-2 pl-2 py-0.5"
                style={{ borderColor: `${leaderEvil}66` }}
              >
                <span
                  className="shrink-0 text-[10px] px-1.5 py-0.5 rounded tracking-widest"
                  style={{ backgroundColor: `${leaderEvil}22`, color: '#dc2626', border: `1px solid ${leaderEvil}44` }}
                >
                  {L.decreeLabels[d.decree_type as keyof typeof L.decreeLabels] ?? d.decree_type}
                </span>
                <span className="text-[#854040] flex-1 truncate">
                  {d.target_oc ? `→ ${d.target_oc}` : ''}
                  {d.content ? `「${d.content.slice(0, 20)}${d.content.length > 20 ? '…' : ''}」` : ''}
                  {d.bounty_amount ? ` 賞${d.bounty_amount}幣 ${d.bounty_completed ? '✓' : '（進行中）'}` : ''}
                </span>
                <span className="text-[#5a2020] shrink-0">
                  {new Date(d.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
