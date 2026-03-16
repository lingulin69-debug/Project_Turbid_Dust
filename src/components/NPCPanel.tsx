import React, { useState, useEffect, useCallback } from 'react';
import { UserData } from './ReportSystemLogic';
import { FACTION_COLORS } from '@/lib/constants';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const CURRENT_CHAPTER = '1.0';

// ── Types ────────────────────────────────────────────────────────────────────

interface MarketSlot {
  id: string;
  item_type: string;
  item_id: string | null;
  custom_name: string | null;
  custom_description: string | null;
  price: number;
  is_sold: boolean;
  dice_type: string | null;
  listed_at: string;
}

interface PetEntry {
  id: string;
  name: string;
  description: string;
  price: number;
  is_listed: boolean;
  is_preset: boolean;
}

interface Landmark {
  id: string;
  name: string;
  status: string;
}

interface DiceResult {
  min: number;
  max: number;
  coins_delta: number;
  status_tag: string;
  message: string;
}

// ── Shared: Move Button ───────────────────────────────────────────────────────

const MoveSection: React.FC<{
  npcOc: string;
  movementPoints: number;
  onMoved: (newPoints: number, newLandmarkId: string) => void;
}> = ({ npcOc, movementPoints, onMoved }) => {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [targetId, setTargetId] = useState('');
  const [moving, setMoving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/landmarks`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Landmark[]) => setLandmarks(data.filter(l => l.status === 'open')))
      .catch(() => {});
  }, []);

  const handleMove = async () => {
    if (!targetId) return;
    setMoving(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/npc/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npc_oc: npcOc, target_landmark_id: targetId }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || '移動失敗'); return; }
      onMoved(data.remaining_points, targetId);
      setMsg('移動成功');
      setTargetId('');
    } catch { setMsg('連線失敗'); }
    finally { setMoving(false); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#737065' }}>移動</span>
        <span className="text-xs font-mono" style={{ color: movementPoints > 0 ? '#403E34' : '#737065' }}>
          剩餘 {movementPoints} 步
        </span>
      </div>
      <div className="flex gap-2">
        <select
          value={targetId}
          onChange={e => setTargetId(e.target.value)}
          className="flex-1 text-xs px-2 py-1.5 focus:outline-none"
          style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
        >
          <option value="">選擇目標據點</option>
          {landmarks.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button
          onClick={handleMove}
          disabled={moving || !targetId || movementPoints < 1}
          className="px-3 py-1.5 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: '1px solid #737065', color: '#403E34', backgroundColor: 'transparent' }}
        >
          {moving ? '...' : '移動'}
        </button>
      </div>
      {msg && <p className={`text-[11px] font-mono ${msg.includes('成功') ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>}
    </div>
  );
};

// ── Item Merchant / Black Merchant Panel ──────────────────────────────────────

const MerchantPanel: React.FC<{
  currentUser: UserData;
  onUpdate: (updates: Partial<UserData>) => void;
}> = ({ currentUser, onUpdate }) => {
  const [listings, setListings] = useState<MarketSlot[]>([]);
  const [itemType, setItemType] = useState<string>('custom');
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [price, setPrice] = useState(3);
  const [diceType, setDiceType] = useState<'D6' | 'D20'>('D6');
  const [diceResults, setDiceResults] = useState<DiceResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const isBlack = currentUser.npc_role === 'black_merchant';

  const D6_TIERS: DiceResult[] = [
    { min: 1, max: 2, coins_delta: 0, status_tag: '', message: '' },
    { min: 3, max: 4, coins_delta: 0, status_tag: '', message: '' },
    { min: 5, max: 6, coins_delta: 0, status_tag: '', message: '' },
  ];
  const D20_TIERS: DiceResult[] = [
    { min: 1, max: 5, coins_delta: 0, status_tag: '', message: '' },
    { min: 6, max: 10, coins_delta: 0, status_tag: '', message: '' },
    { min: 11, max: 18, coins_delta: 0, status_tag: '', message: '' },
    { min: 19, max: 20, coins_delta: 0, status_tag: '', message: '' },
  ];

  useEffect(() => {
    if (itemType === 'dice_item') {
      setDiceResults(diceType === 'D6' ? D6_TIERS.map(t => ({ ...t })) : D20_TIERS.map(t => ({ ...t })));
    }
  }, [itemType, diceType]);

  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/npc/merchant/my-listings?oc_name=${encodeURIComponent(currentUser.oc_name)}&chapter=${CURRENT_CHAPTER}`);
      if (res.ok) setListings(await res.json());
    } catch {}
  }, [currentUser.oc_name]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const updateDiceResult = (idx: number, field: keyof DiceResult, value: string | number) => {
    setDiceResults(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async () => {
    if (!customName && ['custom', 'r18', 'dice_item'].includes(itemType)) {
      setMsg('請填寫商品名稱');
      return;
    }
    setSubmitting(true);
    setMsg('');
    try {
      const body: any = {
        merchant_oc: currentUser.oc_name,
        item_type: itemType,
        custom_name: customName || undefined,
        custom_description: customDesc || undefined,
        price,
        chapter_version: CURRENT_CHAPTER,
      };
      if (itemType === 'dice_item') {
        body.dice_type = diceType;
        body.dice_results = diceResults;
      }
      const res = await fetch(`${API_BASE}/npc/merchant/list-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || '上架失敗'); return; }
      setMsg('商品已上架');
      setCustomName('');
      setCustomDesc('');
      setPrice(3);
      fetchListings();
    } catch { setMsg('連線失敗'); }
    finally { setSubmitting(false); }
  };

  const itemTypeLabel: Record<string, string> = {
    item: '一般道具',
    outfit: '衣裝',
    custom: '自製商品',
    r18: 'R18服裝',
    dice_item: '骰子判定商品',
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: isBlack ? '#ef4444' : FACTION_COLORS.Turbid.highlight }} />
        <span className="text-xs tracking-[0.2em] uppercase" style={{ color: isBlack ? '#ef4444' : FACTION_COLORS.Turbid.highlight }}>
          {isBlack ? '黑心商人' : '道具商人'}
        </span>
      </div>

      {/* Move */}
      <MoveSection
        npcOc={currentUser.oc_name}
        movementPoints={currentUser.movement_points ?? 10}
        onMoved={(pts, id) => onUpdate({ movement_points: pts, current_landmark_id: id })}
      />

      <div style={{ borderTop: '1px solid #BFBAA8' }} />

      {/* Listing Form */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#737065' }}>上架商品</p>

        {/* Item Type */}
        <div className="space-y-1">
          <label className="text-[10px]" style={{ color: '#737065' }}>商品類型</label>
          <select
            value={itemType}
            onChange={e => setItemType(e.target.value)}
            className="w-full text-xs px-2 py-1.5 focus:outline-none"
            style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
          >
            {Object.entries(itemTypeLabel)
              .filter(([k]) => isBlack || !['dice_item', 'r18'].includes(k))
              .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-[10px]" style={{ color: '#737065' }}>商品名稱</label>
          <input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="商品名稱"
            className="w-full text-xs px-2 py-1.5 focus:outline-none"
            style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-[10px]" style={{ color: '#737065' }}>描述（最多30字）</label>
          <textarea
            value={customDesc}
            onChange={e => setCustomDesc(e.target.value.slice(0, 30))}
            rows={2}
            placeholder="商品描述"
            className="w-full text-xs px-2 py-1.5 focus:outline-none resize-none"
            style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
          />
          <p className="text-[10px] text-right" style={{ color: '#737065' }}>{customDesc.length}/30</p>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <label className="text-[10px]" style={{ color: '#737065' }}>定價（幣）</label>
          <input
            type="number"
            min={1}
            max={8}
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full text-xs px-2 py-1.5 focus:outline-none"
            style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
          />
        </div>

        {/* Dice Settings */}
        {itemType === 'dice_item' && (
          <div className="space-y-3 p-3 rounded" style={{ border: '1px solid #BFBAA8' }}>
            <div className="flex items-center gap-3">
              <span className="text-[10px]" style={{ color: '#737065' }}>骰子類型</span>
              {(['D6', 'D20'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDiceType(d)}
                  className="text-xs px-2 py-0.5 transition-colors"
                  style={{
                    border: `1px solid ${diceType === d ? '#c0392b' : '#737065'}`,
                    color: diceType === d ? '#c0392b' : '#737065',
                    backgroundColor: diceType === d ? 'rgba(192,57,43,0.1)' : 'transparent',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {diceResults.map((r, i) => (
                <div key={i} className="space-y-1.5 p-2 rounded" style={{ backgroundColor: 'rgba(191,186,168,0.3)' }}>
                  <p className="text-[10px]" style={{ color: '#737065' }}>{r.min}–{r.max}</p>
                  <input
                    placeholder="結果描述"
                    value={r.message}
                    onChange={e => updateDiceResult(i, 'message', e.target.value)}
                    className="w-full text-xs px-2 py-1 focus:outline-none"
                    style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
                  />
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-0.5">
                      <p className="text-[9px]" style={{ color: '#737065' }}>貨幣增減</p>
                      <input
                        type="number"
                        value={r.coins_delta}
                        onChange={e => updateDiceResult(i, 'coins_delta', Number(e.target.value))}
                        className="w-full text-xs px-2 py-1 focus:outline-none"
                        style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
                      />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-[9px]" style={{ color: '#737065' }}>狀態標籤（可空）</p>
                      <input
                        placeholder="例：鼻挺中 ✦"
                        value={r.status_tag}
                        onChange={e => updateDiceResult(i, 'status_tag', e.target.value)}
                        className="w-full text-xs px-2 py-1 focus:outline-none"
                        style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {msg && <p className={`text-[11px] font-mono ${msg.includes('成功') || msg.includes('上架') ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-2 text-xs transition-colors disabled:opacity-30"
          style={{ border: '1px solid #737065', color: '#403E34', backgroundColor: 'transparent' }}
        >
          {submitting ? '上架中...' : '確認上架'}
        </button>
      </div>

      <div style={{ borderTop: '1px solid #BFBAA8' }} />

      {/* Current Listings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#737065' }}>本章已上架</p>
          <button onClick={fetchListings} className="text-[10px] transition-colors" style={{ color: '#737065' }}>刷新</button>
        </div>
        {listings.length === 0 ? (
          <p className="text-xs italic" style={{ color: '#737065' }}>尚無上架商品</p>
        ) : (
          <div className="space-y-1.5">
            {listings.map(s => (
              <div
                key={s.id}
                className={`text-[11px] font-mono px-3 py-2 ${s.is_sold ? 'opacity-40' : ''}`}
                style={{ border: '1px solid #BFBAA8', backgroundColor: 'rgba(191,186,168,0.2)' }}
              >
                <div className="flex justify-between">
                  <span style={{ color: '#403E34' }}>{s.custom_name || s.item_id || s.item_type}</span>
                  <span style={{ color: '#737065' }}>{s.price} 幣</span>
                </div>
                <div className="flex gap-2 mt-0.5">
                  <span style={{ color: '#737065' }}>{s.item_type}</span>
                  {s.dice_type && <span style={{ color: '#737065' }}>{s.dice_type}</span>}
                  {s.is_sold && <span className="text-green-700">已售出</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Trafficker Panel ──────────────────────────────────────────────────────────

const TraffickerPanel: React.FC<{
  currentUser: UserData;
  onUpdate: (updates: Partial<UserData>) => void;
}> = ({ currentUser, onUpdate }) => {
  const [kidnpTarget, setKidnapTarget] = useState('');
  const [intelResult, setIntelResult] = useState<string[]>([]);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const prestige = currentUser.prestige ?? 0;

  const callApi = async (endpoint: string, body: object) => {
    setLoading(true);
    setMsg('');
    setIntelResult([]);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || '操作失敗'); return null; }
      return data;
    } catch { setMsg('連線失敗'); return null; }
    finally { setLoading(false); }
  };

  const handleDeliver = async () => {
    const data = await callApi('/npc/trafficker/villager-mission', {
      trafficker_oc: currentUser.oc_name,
      chapter_version: CURRENT_CHAPTER,
    });
    if (data) {
      setMsg(`+3 聲望。${data.mission_text || ''}`);
      onUpdate({ prestige: Math.min(10, prestige + 3) });
    }
  };

  const handleKidnap = async () => {
    if (!kidnpTarget.trim()) { setMsg('請輸入目標OC名稱'); return; }
    const data = await callApi('/npc/trafficker/skill/kidnap', {
      trafficker_oc: currentUser.oc_name,
      target_oc: kidnpTarget.trim(),
      chapter_version: CURRENT_CHAPTER,
    });
    if (data) {
      setMsg('綁架成功');
      onUpdate({ prestige: prestige - 5 });
      setKidnapTarget('');
    }
  };

  const handleIntel = async () => {
    const data = await callApi('/npc/trafficker/skill/intel', {
      trafficker_oc: currentUser.oc_name,
      chapter_version: CURRENT_CHAPTER,
    });
    if (data) {
      setIntelResult(data.players_in_landmark || data.visitors || []);
      onUpdate({ prestige: prestige - 3 });
    }
  };

  const handlePickpocket = async () => {
    const data = await callApi('/npc/trafficker/skill/pickpocket', {
      trafficker_oc: currentUser.oc_name,
      chapter_version: CURRENT_CHAPTER,
    });
    if (data) {
      setMsg(data.message || `扒竊完成，取得 ${data.amount_stolen ?? 0} 幣`);
      onUpdate({ prestige: prestige - 8 });
    }
  };

  const skills = [
    { id: 'kidnap', label: '綁架', cost: 5, desc: '目標失蹤6小時', color: '#ef4444' },
    { id: 'intel', label: '黑市情報', cost: 3, desc: '查看本據點本章到訪名單', color: '#d97706' },
    { id: 'pickpocket', label: '扒竊', cost: 8, desc: '隨機偷取某玩家10%貨幣', color: '#7c3aed' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#d97706' }} />
        <span className="text-xs tracking-[0.2em] uppercase" style={{ color: '#d97706' }}>人販子</span>
      </div>

      {/* Prestige */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#737065' }}>聲望</span>
          <span className="text-xs font-mono" style={{ color: '#d97706' }}>{prestige} / 10</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-sm"
              style={{ backgroundColor: i < prestige ? '#d97706' : '#BFBAA8' }}
            />
          ))}
        </div>
      </div>

      {/* Move */}
      <MoveSection
        npcOc={currentUser.oc_name}
        movementPoints={currentUser.movement_points ?? 10}
        onMoved={(pts, id) => onUpdate({ movement_points: pts, current_landmark_id: id })}
      />

      <div style={{ borderTop: '1px solid #BFBAA8' }} />

      {/* Village Mission */}
      <div className="space-y-2">
        <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#737065' }}>村民任務</p>
        <p className="text-[11px]" style={{ color: '#737065' }}>
          在當前據點執行村民任務，獲得 +3 聲望（上限10）
        </p>
        <button
          onClick={handleDeliver}
          disabled={loading}
          className="w-full py-2 text-xs transition-colors disabled:opacity-30"
          style={{ border: '1px solid #d97706', color: '#d97706', backgroundColor: 'transparent' }}
        >
          執行村民任務
        </button>
      </div>

      <div style={{ borderTop: '1px solid #BFBAA8' }} />

      {/* Skills */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#737065' }}>技能</p>
        {skills.map(skill => {
          const canUse = prestige >= skill.cost;
          return (
            <div key={skill.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono" style={{ color: canUse ? skill.color : '#BFBAA8' }}>
                    {skill.label}
                  </span>
                  <span className="text-[10px] ml-2" style={{ color: '#737065' }}>（{skill.cost}點）</span>
                </div>
                <button
                  onClick={() => setActiveSkill(activeSkill === skill.id ? null : skill.id)}
                  disabled={!canUse}
                  className="text-[10px] px-2 py-0.5 transition-colors disabled:cursor-not-allowed"
                  style={{
                    border: `1px solid ${canUse ? '#737065' : '#BFBAA8'}`,
                    color: canUse ? '#403E34' : '#BFBAA8',
                    backgroundColor: 'transparent',
                  }}
                >
                  {canUse ? (activeSkill === skill.id ? '收起' : '展開') : '聲望不足'}
                </button>
              </div>
              <p className="text-[10px]" style={{ color: '#737065' }}>{skill.desc}</p>

              {activeSkill === skill.id && (
                <div className="pl-2 space-y-2" style={{ borderLeft: '1px solid #BFBAA8' }}>
                  {skill.id === 'kidnap' && (
                    <div className="flex gap-2">
                      <input
                        value={kidnpTarget}
                        onChange={e => setKidnapTarget(e.target.value)}
                        placeholder="目標OC名稱"
                        className="flex-1 text-xs px-2 py-1.5 focus:outline-none"
                        style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
                      />
                      <button
                        onClick={handleKidnap}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs transition-colors disabled:opacity-30"
                        style={{ border: '1px solid #ef4444', color: '#ef4444', backgroundColor: 'transparent' }}
                      >
                        執行
                      </button>
                    </div>
                  )}
                  {skill.id === 'intel' && (
                    <div className="space-y-1.5">
                      <button
                        onClick={handleIntel}
                        disabled={loading}
                        className="w-full py-1.5 text-xs transition-colors disabled:opacity-30"
                        style={{ border: '1px solid #d97706', color: '#d97706', backgroundColor: 'transparent' }}
                      >
                        查詢本據點名單
                      </button>
                      {intelResult.length > 0 && (
                        <div className="text-[11px] font-mono" style={{ color: '#403E34' }}>
                          {intelResult.map((name, i) => (
                            <div key={i} className="py-0.5">· {name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {skill.id === 'pickpocket' && (
                    <button
                      onClick={handlePickpocket}
                      disabled={loading}
                      className="w-full py-1.5 text-xs transition-colors disabled:opacity-30"
                      style={{ border: '1px solid #7c3aed', color: '#7c3aed', backgroundColor: 'transparent' }}
                    >
                      {loading ? '執行中...' : '執行扒竊'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {msg && <p className={`text-[11px] font-mono ${msg.includes('成功') || msg.includes('聲望') || msg.includes('完成') ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>}
    </div>
  );
};

// ── Inn Owner Panel ───────────────────────────────────────────────────────────

const InnPanel: React.FC<{
  currentUser: UserData;
  onUpdate: (updates: Partial<UserData>) => void;
}> = ({ currentUser, onUpdate }) => {
  const [toggling, setToggling] = useState(false);
  const [msg, setMsg] = useState('');
  const isOpen = currentUser.is_shop_open ?? false;

  const handleToggle = async () => {
    setToggling(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/npc/inn/toggle-open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inn_owner_oc: currentUser.oc_name, is_open: !isOpen, chapter_version: CURRENT_CHAPTER }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || '操作失敗'); return; }
      onUpdate({ is_shop_open: data.is_shop_open });
      setMsg(data.is_shop_open ? '旅店已開放' : '旅店已關閉');
    } catch { setMsg('連線失敗'); }
    finally { setToggling(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#0d9488' }} />
        <span className="text-xs tracking-[0.2em] uppercase" style={{ color: '#0d9488' }}>旅店老闆</span>
      </div>

      <div className="space-y-3 p-4" style={{ border: '1px solid #BFBAA8' }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#737065' }}>當前狀態</span>
          <span className="text-xs font-mono px-2 py-0.5"
            style={{
              border: `1px solid ${isOpen ? '#0d9488' : '#737065'}`,
              color: isOpen ? '#0d9488' : '#737065',
              backgroundColor: isOpen ? 'rgba(13,148,136,0.1)' : 'transparent',
            }}
          >
            {isOpen ? '● 營業中' : '○ 休息中'}
          </span>
        </div>

        <button
          onClick={handleToggle}
          disabled={toggling}
          className="w-full py-2.5 text-xs transition-colors disabled:opacity-30"
          style={{
            border: `1px solid ${isOpen ? '#737065' : '#0d9488'}`,
            color: isOpen ? '#737065' : '#0d9488',
            backgroundColor: 'transparent',
          }}
        >
          {toggling ? '...' : isOpen ? '關閉旅店' : '開放旅店'}
        </button>

        {msg && <p className={`text-[11px] font-mono ${msg.includes('開放') ? 'text-green-700' : msg.includes('關閉') ? 'text-gray-500' : 'text-red-600'}`}>{msg}</p>}
      </div>

      <div className="text-[11px] leading-relaxed space-y-1" style={{ color: '#737065' }}>
        <p>· 開放時玩家可來此治療HP（2幣，D20判定）</p>
        <p>· 也可委託你救援失蹤玩家（5幣）</p>
        <p>· 關閉時地圖顯示「今日休息」</p>
      </div>
    </div>
  );
};

// ── Pet Merchant Panel ────────────────────────────────────────────────────────

const PRESET_PETS = [
  { id: 'pet_001', name: '白鴉雛鳥', price: 3 },
  { id: 'pet_002', name: '霧中蜘蛛', price: 2 },
  { id: 'pet_003', name: '裂紋石龜', price: 2 },
  { id: 'pet_004', name: '低語貓', price: 3 },
  { id: 'pet_005', name: '黑泥蛙', price: 1 },
  { id: 'pet_006', name: '空心兔', price: 2 },
  { id: 'pet_007', name: '鏡面魚', price: 3 },
  { id: 'pet_008', name: '骨翼蝙蝠', price: 2 },
  { id: 'pet_009', name: '苔蘚熊', price: 3 },
  { id: 'pet_010', name: '鏽鐵狐', price: 2 },
  { id: 'pet_011', name: '晶體蜥蜴', price: 3 },
  { id: 'pet_012', name: '無臉鳥', price: 4 },
  { id: 'pet_013', name: '煙霧水母', price: 3 },
  { id: 'pet_014', name: '紅眼鼴鼠', price: 2 },
  { id: 'pet_015', name: '金線蠶', price: 4 },
  { id: 'pet_016', name: '雙頭烏鴉', price: 3 },
];

const PetMerchantPanel: React.FC<{
  currentUser: UserData;
  onUpdate: (updates: Partial<UserData>) => void;
}> = ({ currentUser, onUpdate }) => {
  const [pets, setPets] = useState<PetEntry[]>([]);
  const [toggling, setToggling] = useState(false);
  const [shopMsg, setShopMsg] = useState('');
  const [specialName, setSpecialName] = useState('');
  const [specialDesc, setSpecialDesc] = useState('');
  const [specialPrice, setSpecialPrice] = useState(2);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [togglingPet, setTogglingPet] = useState<string | null>(null);

  const isOpen = currentUser.is_shop_open ?? false;
  const listedCount = pets.filter(p => p.is_listed).length;

  const fetchPets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/pets/available?chapter_version=${CURRENT_CHAPTER}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.pets || []);
        setPets(list.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price ?? 2,
          is_listed: p.is_listed ?? false,
          is_preset: p.is_preset ?? true,
        })));
      }
    } catch {}
  }, []);

  useEffect(() => { fetchPets(); }, [fetchPets]);

  const handleToggleShop = async () => {
    setToggling(true);
    setShopMsg('');
    try {
      const res = await fetch(`${API_BASE}/npc/pet-merchant/toggle-open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet_merchant_oc: currentUser.oc_name, is_open: !isOpen, chapter_version: CURRENT_CHAPTER }),
      });
      const data = await res.json();
      if (!res.ok) { setShopMsg(data.error || '操作失敗'); return; }
      onUpdate({ is_shop_open: data.is_shop_open });
      setShopMsg(data.is_shop_open ? '店鋪已開放' : '店鋪已關閉');
    } catch { setShopMsg('連線失敗'); }
    finally { setToggling(false); }
  };

  const handleToggleListing = async (petId: string, currentListed: boolean) => {
    if (!isOpen) { return; }
    if (!currentListed && listedCount >= 3) { return; }
    setTogglingPet(petId);
    try {
      if (currentListed) {
        setPets(prev => prev.map(p => p.id === petId ? { ...p, is_listed: false } : p));
      } else {
        const res = await fetch(`${API_BASE}/npc/pet-merchant/list-default-pet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pet_merchant_oc: currentUser.oc_name,
            pet_id: petId,
            chapter_version: CURRENT_CHAPTER,
          }),
        });
        if (res.ok) {
          setPets(prev => prev.map(p => p.id === petId ? { ...p, is_listed: true } : p));
        }
      }
    } catch {}
    finally { setTogglingPet(null); }
  };

  const handleCreateSpecial = async () => {
    if (!specialName.trim()) { setCreateMsg('請填寫名稱'); return; }
    setCreating(true);
    setCreateMsg('');
    try {
      const res = await fetch(`${API_BASE}/npc/pet-merchant/list-custom-pet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_merchant_oc: currentUser.oc_name,
          name: specialName,
          description: specialDesc,
          price: specialPrice,
          chapter_version: CURRENT_CHAPTER,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateMsg(data.error || '新增失敗'); return; }
      setCreateMsg('特別款已新增上架');
      setSpecialName('');
      setSpecialDesc('');
      setSpecialPrice(2);
      fetchPets();
    } catch { setCreateMsg('連線失敗'); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: FACTION_COLORS.Pure.highlight }} />
        <span className="text-xs tracking-[0.2em] uppercase" style={{ color: FACTION_COLORS.Pure.highlight }}>寵物商人</span>
      </div>

      {/* Shop Toggle */}
      <div className="flex items-center justify-between p-3" style={{ border: '1px solid #BFBAA8' }}>
        <div>
          <span className="text-xs font-mono" style={{ color: isOpen ? '#0d9488' : '#737065' }}>
            {isOpen ? '● 店鋪開放中' : '○ 今日休息'}
          </span>
          {isOpen && <span className="text-[10px] ml-2" style={{ color: '#737065' }}>已上架 {listedCount}/3</span>}
        </div>
        <button
          onClick={handleToggleShop}
          disabled={toggling}
          className="text-xs px-3 py-1 transition-colors disabled:opacity-30"
          style={{ border: '1px solid #737065', color: '#403E34', backgroundColor: 'transparent' }}
        >
          {toggling ? '...' : isOpen ? '關店' : '開店'}
        </button>
      </div>
      {shopMsg && <p className={`text-[11px] font-mono ${shopMsg.includes('開放') ? 'text-green-700' : shopMsg.includes('關閉') ? 'text-gray-500' : 'text-red-600'}`}>{shopMsg}</p>}

      <div style={{ borderTop: '1px solid #BFBAA8' }} />

      {/* Preset Pets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#737065' }}>預設寵物（勾選最多3隻上架）</p>
          <button onClick={fetchPets} className="text-[10px] transition-colors" style={{ color: '#737065' }}>刷新</button>
        </div>
        {!isOpen && (
          <p className="text-[11px] italic" style={{ color: '#737065' }}>請先開店才能管理上架</p>
        )}
        <div className="space-y-1">
          {PRESET_PETS.map(preset => {
            const dbPet = pets.find(p => p.id === preset.id);
            const isListed = dbPet?.is_listed ?? false;
            const isLoadingThis = togglingPet === preset.id;
            const canToggle = isOpen && (isListed || listedCount < 3);
            return (
              <div
                key={preset.id}
                className="flex items-center justify-between px-3 py-1.5 transition-colors"
                style={{
                  border: `1px solid ${isListed ? '#BFBAA8' : '#D9D7C5'}`,
                  backgroundColor: isListed ? 'rgba(191,186,168,0.3)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] w-10" style={{ color: '#737065' }}>{preset.id.replace('pet_', '#')}</span>
                  <span className="text-xs" style={{ color: '#403E34' }}>{preset.name}</span>
                  <span className="text-[10px]" style={{ color: '#737065' }}>{preset.price}幣</span>
                </div>
                <button
                  onClick={() => handleToggleListing(preset.id, isListed)}
                  disabled={!canToggle || isLoadingThis}
                  className="text-[10px] px-2 py-0.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    border: `1px solid ${isListed ? '#d97706' : canToggle ? '#737065' : '#BFBAA8'}`,
                    color: isListed ? '#d97706' : canToggle ? '#403E34' : '#BFBAA8',
                    backgroundColor: 'transparent',
                  }}
                >
                  {isLoadingThis ? '...' : isListed ? '下架' : '上架'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #BFBAA8' }} />

      {/* Create Special Pet */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#737065' }}>新增特別款（每章限3隻）</p>
        <div className="space-y-2">
          <input
            value={specialName}
            onChange={e => setSpecialName(e.target.value)}
            placeholder="寵物名稱"
            className="w-full text-xs px-2 py-1.5 focus:outline-none"
            style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
          />
          <textarea
            value={specialDesc}
            onChange={e => setSpecialDesc(e.target.value.slice(0, 50))}
            rows={2}
            placeholder="描述（最多50字）"
            className="w-full text-xs px-2 py-1.5 focus:outline-none resize-none"
            style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
          />
          <p className="text-[10px] text-right" style={{ color: '#737065' }}>{specialDesc.length}/50</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: '#737065' }}>定價</span>
            <input
              type="number"
              min={1}
              max={10}
              value={specialPrice}
              onChange={e => setSpecialPrice(Number(e.target.value))}
              className="w-20 text-xs px-2 py-1 focus:outline-none"
              style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
            />
            <span className="text-[10px]" style={{ color: '#737065' }}>幣</span>
          </div>
        </div>
        {createMsg && <p className={`text-[11px] font-mono ${createMsg.includes('新增') ? 'text-green-700' : 'text-red-600'}`}>{createMsg}</p>}
        <button
          onClick={handleCreateSpecial}
          disabled={creating || !isOpen}
          className="w-full py-2 text-xs transition-colors disabled:opacity-30"
          style={{ border: '1px solid #d97706', color: '#d97706', backgroundColor: 'transparent' }}
        >
          {creating ? '新增中...' : '新增並上架'}
        </button>
      </div>
    </div>
  );
};

// ── Main NPC Panel ────────────────────────────────────────────────────────────

interface NPCPanelProps {
  currentUser: UserData;
  onUpdate: (updates: Partial<UserData>) => void;
}

export const NPCPanel: React.FC<NPCPanelProps> = ({ currentUser, onUpdate }) => {
  const role = currentUser.npc_role;

  if (!role) return null;

  return (
    <div>
      {(role === 'item_merchant' || role === 'black_merchant') && (
        <MerchantPanel currentUser={currentUser} onUpdate={onUpdate} />
      )}
      {role === 'trafficker' && (
        <TraffickerPanel currentUser={currentUser} onUpdate={onUpdate} />
      )}
      {role === 'inn_owner' && (
        <InnPanel currentUser={currentUser} onUpdate={onUpdate} />
      )}
      {role === 'pet_merchant' && (
        <PetMerchantPanel currentUser={currentUser} onUpdate={onUpdate} />
      )}
    </div>
  );
};
