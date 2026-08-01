// Format helpers dùng chung cho UI

/** 25000 -> "25.000đ" */
export function formatVnd(n: number): string {
  return `${Math.round(n).toLocaleString("vi-VN")}đ`;
}

/** Date -> "YYYY-MM-DD" theo giờ địa phương */
export function toDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "YYYY-MM-DD" -> "Thứ x, dd/mm" */
export function formatDateVi(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const weekdays = [
    "Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7",
  ];
  return `${weekdays[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

/** 1234 -> "1,2km" | 850 -> "850m" */
export function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1).replace(".", ",")}km`;
  return `${m}m`;
}
