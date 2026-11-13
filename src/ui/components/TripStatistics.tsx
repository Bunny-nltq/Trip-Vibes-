import React from "react";
import type { tripStatistics, nextTripIdeas } from "@/core/tripWorkspace";
import styles from "./Workspace.module.css";
const labels: Record<string, string> = { an_uong: "Ăn uống", vui_choi: "Vui chơi", di_chuyen: "Di chuyển", cho_o: "Chỗ ở", khac: "Khác" };
export function TripStatistics({ statistics, ideas = [] }: {
    statistics: ReturnType<typeof tripStatistics>;
    ideas?: ReturnType<typeof nextTripIdeas>;
}) {
    return <div className={styles.card}><h2>Thống kê nhật ký</h2><div className={styles.stats}>
    <div><small>Chuyến đã lưu</small><p><strong>{statistics.total}</strong></p></div><div><small>Đang diễn ra</small><p><strong>{statistics.ongoing}</strong></p></div><div><small>Đã hoàn thành</small><p><strong>{statistics.completed}</strong></p></div><div><small>Thực chi đã ghi (không gồm chuyến hủy)</small><p><strong>{statistics.actual.toLocaleString("vi-VN")} đ</strong></p></div>
  </div><div className={styles.grid}><div><h3>Theo hạng mục</h3>{Object.entries(statistics.categories).map(([key, value]) => <p key={key}>{labels[key] || key}: {value.toLocaleString("vi-VN")} đ</p>)}</div><div><h3>Theo tháng</h3>{Object.entries(statistics.monthly).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => <p key={key}>{key}: {value.toLocaleString("vi-VN")} đ</p>)}</div></div><div><h3>Ý tưởng cho chuyến tiếp theo</h3>{ideas.map(idea => <p key={idea.name}><strong>{idea.name}</strong> · {idea.reason}</p>)}</div><p>Chỉ tính khoản chi đã ghi nhận. Chưa nhập chi tiêu không đồng nghĩa đã tiết kiệm. Số liệu hiện được quy về VND theo sổ chi tiêu.</p></div>;
}
