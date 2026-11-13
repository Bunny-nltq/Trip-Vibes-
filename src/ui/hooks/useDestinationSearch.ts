import { useState } from "react";
import { DiemDenSchema, type DiemDen } from "@/contracts";
export function useDestinationSearch() {
    const [results, setResults] = useState<DiemDen[]>([]), [loading, setLoading] = useState(false), [message, setMessage] = useState("");
    async function search(query: string) {
        if (!query.trim())
            return;
        setLoading(true);
        setResults([]);
        setMessage("");
        try {
            const response = await fetch(`/api/destination?q=${encodeURIComponent(query.trim())}`);
            const raw = await response.json();
            if (!response.ok)
                throw new Error("Không thể tìm tọa độ lúc này. Bạn có thể tạo hành trình thủ công.");
            const values = [raw.diemDen, ...(Array.isArray(raw.ungVien) ? raw.ungVien : [])];
            const list = values.map(value => DiemDenSchema.safeParse(value)).filter(result => result.success).map(result => result.data!);
            setResults(list.filter((item, index) => list.findIndex(p => p.ten === item.ten && p.toaDo.lat === item.toaDo.lat) === index));
            setMessage(list.length ? "Chọn kết quả đúng để xác nhận điểm đến." : "Chưa xác định được địa điểm. Kiểm tra tên hoặc tạo hành trình thủ công; hệ thống không dùng tọa độ mặc định.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Không thể tìm điểm đến.");
        }
        finally {
            setLoading(false);
        }
    }
    return { results, loading, message, search };
}
