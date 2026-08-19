'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteStoryButton({ storyId, storyTitle }: { storyId: string, storyTitle: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบเก็ง "${storyTitle}"?\n* การกระทำนี้จะลบประโยคทั้งหมดในเก็งนี้ด้วย และไม่สามารถกู้คืนได้`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      alert('ลบข้อมูลสำเร็จ');
      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="ลบข้อมูล"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
