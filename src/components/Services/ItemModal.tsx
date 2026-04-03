import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import type { ServiceItem, ServiceCategory } from "../../types/service";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useModalAnimation } from "../../hooks/useModalAnimation";
import { modalAnimation, backdropAnimation } from "../../styles/modalAnimation";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ServiceItem) => void;
  item: ServiceItem | null;
  category: ServiceCategory | null;
  services: ServiceItem[];
}

const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  category,
  services,
}) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [duration, setDuration] = useState<number | "">("");
  const [isEditing, setIsEditing] = useState(false);
  const [id, setId] = useState<string | null>(null);

  const { shouldRender, isVisible } = useModalAnimation(isOpen);

  useEffect(() => {
    if (isOpen && item) {
      setIsEditing(true);
      setId(item.id);
      setName(item.name);
      setPrice(item.price);
      setDuration(item.duration);
    } else {
      setIsEditing(false);
      setId(null);
      setName("");
      setPrice("");
      setDuration("");
    }
  }, [isOpen, item]);

  const getNextOrder = useCallback(() => {
    if (!category) return 1;
    const itemsInCategory = services.filter(
      (s) => s.category_id === category.id
    );
    if (itemsInCategory.length === 0) return 1;
    return (
      Math.max(...itemsInCategory.map((item) => item.order)) + 1
    );
  }, [category, services]);

  const handleSave = () => {
    if (!name || price === "" || duration === "" || !category) return;

    const savedItem: ServiceItem = {
      id: isEditing && id ? id : new Date().toISOString(),
      name,
      price: Number(price),
      duration: Number(duration),
      category_id: category.id,
      order:
        isEditing && item ? item.order : getNextOrder(),
    };
    onSave(savedItem);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center`}
      onClick={onClose}
    >
      <div
        className={`
          absolute inset-0 bg-black/20
          ${backdropAnimation.base}
          ${isVisible ? backdropAnimation.enter : backdropAnimation.exit}
        `}
      />
      <div
        className={`
          relative bg-white rounded-lg shadow-xl w-full max-w-md m-4
          p-6 space-y-4
          ${modalAnimation.base}
          ${isVisible ? modalAnimation.enter : modalAnimation.exit}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isEditing ? "編輯項目" : "新增項目"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">名稱</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：基礎洗髮"
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">價格</label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="例如：250"
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">時長 (分鐘)</label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            placeholder="例如：30"
            className="mt-1"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>儲存</Button>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
