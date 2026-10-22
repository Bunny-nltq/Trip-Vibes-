CHẾ ĐỘ LÀM VIỆC HÔM NAY (không dùng Gemini). Làm theo AGENTS.md. Làm lần lượt P0 đến P5. Gặp điều không rõ: chọn phương án an toàn nhất, ghi vào tiến độ rồi làm việc khác; KHÔNG hỏi lại.

LUẬT CỨNG
- CẤM: gọi Gemini (đặt LIVE_AI_ENABLED=false mọi lúc), git push --force, git reset --hard, git clean, xóa hay dời tag hoặc nhánh (trừ nhánh tạm ở P5), cài thư viện mới, npm audit fix, sửa src/core, src/ai, prompt, đáp án test của người dùng, đọc hay in nội dung .env*, merge nhánh dem-ui vào main.
- Mỗi việc tối đa 60 phút. Quá giờ hoặc lỗi sau 2 lần sửa: git stash push -u -m "that-bai-<MÃ>", ghi LỖI, sang việc kế tiếp.
- Trước mỗi việc git status phải sạch (bẩn thì git stash push -u -m "truoc-<MÃ>"). Sau mỗi việc chạy powershell -File scripts/cong-kiem-tra.ps1 -MaNV <MÃ>; chỉ commit và push main khi dòng TONG trong docs/bang-chung/hom-nay/<MÃ>/KET-QUA.txt là DAT. Commit CHỈ tệp của việc đó. Đầu ra thô ghi bằng [System.IO.File]::WriteAllText với UTF8Encoding($false).
- Sau MỖI việc ghi một dòng vào docs/bang-chung/hom-nay/TIEN-DO.md (giờ, mã, XONG hoặc LỖI hoặc BỎ QUA, mã commit, lý do ngắn). Không sửa dòng cũ.

P0 (5 phút): chép nguyên văn lệnh này vào docs/LENH-HOM-NAY.md (để đọc lại nếu mất ngữ cảnh). Xóa tệp cờ .dem-cho-phep-gemini nếu tồn tại (Remove-Item; tệp này nằm trong .gitignore) và ghi vào TIEN-DO.md: "đã gỡ cờ Gemini, người dùng tạo lại khi cần chạy eval". git status; commit "P0: ...".

P1: BỘ CHẤM eval:parse (stash "chuan-bi-eval-parse")
- git stash list và git stash show -p stash@{0}. Tóm tắt trong TIEN-DO.md: stash sửa gì trong eval/run-parse.ts và eval/run-parse.test.ts.
- Nếu stash chỉ sửa bộ chấm (hàm so sánh ngân sách) và KHÔNG sửa eval/parse-cases hay đáp án: git stash apply (KHÔNG pop). Test (đáp án do người dùng đặt) phải có và phải đạt: (20.000.000 với 20.000.000) khớp; (19.000.000 với 20.000.000) không khớp; (null với 20.000.000) không khớp; (null với null) khớp. Thiếu ca nào thì thêm. Commit "P1: ...", rồi mới git stash drop stash@{0}.
- Nếu stash khác mô tả hoặc test đỏ: KHÔNG áp dụng, KHÔNG xóa stash, ghi LỖI kèm tên tệp bị đụng.
- Không chạy eval:parse (cần Gemini).

P2: THU HẸP DÓNG GÓI VERCEL (next.config.ts)
- Hiện outputFileTracingIncludes dùng "./src/data/snapshots/**/*" và "./src/data/reference/**/*" (kéo cả tệp test vào gói). Đổi thành "./src/data/snapshots/*.json" và "./src/data/reference/*.json" cho cùng 8 route. Không đổi gì khác.
- Kiểm chứng: npm run build; dán thô vào docs/bang-chung/hom-nay/P2/: với tệp .nft.json của /api/health và /api/plan, liệt kê các dòng chứa "snapshot_" hoặc "timetable" hoặc ".test.ts". Kỳ vọng: có 5 tệp snapshot_*.json và timetable.json, KHÔNG có .test.ts. Rồi VERCEL=1 DATA_MODE=snapshot npx next start -p 3012 và GET /api/health (lưu .Content nguyên văn): phải liệt kê 5 snapshot. Dừng máy chủ, xác nhận cổng 3012 trống (Get-NetTCPConnection không có đầu ra).
- Nếu thiếu snapshot ở nft hoặc /api/health: hoàn nguyên next.config.ts (git checkout -- next.config.ts), ghi LỖI.

P3: KIỂM TRA NHANH BẢN TRIỂN KHAI (scripts/smoke.ts)
- npm run smoke -- <URL gốc>. Chỉ dùng fetch có sẵn của Node, không thêm thư viện, KHÔNG gọi Gemini. Các kiểm tra: GET /api/health trả 200 và liệt kê ít nhất 5 snapshot; GET /demo trả 404; GET / trả 200; GET /lap-ke-hoach (nếu 404 thì ghi CẢNH BÁO, không tính LỖI, vì tuyến này chỉ có trên nhánh dem-ui); POST /api/plan (TP.HCM đến Hà Nội, 2 người, 10.000.000, 3 ngày; diemDi và diemDen là ĐỐI TƯỢNG có toaDo: TP.HCM lat 10.7769 lng 106.7009, Hà Nội lat 21.0285 lng 105.8542, tienTe "VND", nguon "nominatim", ngayLay "2026-10-20", quocGia "Việt Nam", maQuocGia "VN"; schemaVersion 9; soNguoi 2; soNgay 3; ngansachTongVND 10000000; sothich, tranh, ghiChu, thieu, cauHoiLamRo, canhBao là mảng rỗng) phải trả 200, ok true, dataSourceUsed "snapshot", soLanGoiAI 0 và có ít nhất 1 mục trong plan.items. Kiểm rò khóa: nếu .env.local có GEMINI_API_KEY (nạp bằng @next/env loadEnvConfig), kiểm không phản hồi nào chứa giá trị đó; chỉ in "số khớp = N", TUYỆT ĐỐI không in giá trị khóa. In bảng: kiểm tra, kỳ vọng, thực tế, ĐẠT hoặc LỖI hoặc CẢNH BÁO; thoát mã 1 nếu có LỖI.
- Logic thành hàm thuần trong scripts/lib/smokeRules.ts kèm test (đáp án người dùng): danhGiaHealth: {"mode":"snapshot","snapshots":[5 phần tử]} thành true; {"mode":"snapshot","snapshots":[]} thành false; chuỗi không phải JSON thành false. danhGiaPlan: {ok:true,dataSourceUsed:"snapshot",soLanGoiAI:0,plan:{items:[{}]}} thành true; cùng dữ liệu nhưng dataSourceUsed "live" thành false; ok false thành false; items rỗng thành false. chuaChuoi(body, chuoi): true khi body chứa chuoi và chuoi dài từ 8 ký tự trở lên; chuoi rỗng hoặc ngắn hơn 8 ký tự thành false.
- Chạy với bản build cục bộ: VERCEL=1 DATA_MODE=snapshot npx next start -p 3012, rồi npm run smoke -- http://localhost:3012; lưu đầu ra thô vào docs/bang-chung/hom-nay/P3/smoke-local.txt. Dừng máy chủ, xác nhận cổng 3012 trống. Đầu ra không khớp kỳ vọng thì dừng, KHÔNG sửa kỳ vọng cho khớp, ghi LỖI.

P4: TÀI LIỆU (chỉ docs, không sửa mã)
- docs/GIOI-HAN-DA-BIET.md: thêm đúng các dòng sau (không thêm số liệu nào khác): (a) "Danh sách thành phố có ga tàu (src/data/reference/tuyen-tau.json) chưa đối chiếu với dsvn.vn." (b) "Phương tiện là ước tính theo quãng đường chim bay (tàu và xe khách nhân hệ số đường bộ 1,5); giá và thời gian không phải số liệu của hãng." (c) "Hạn mức Gemini miễn phí đã quan sát: khoảng 20 lượt gọi mỗi ngày; các bộ eval phải chạy rải nhiều ngày." (d) "Trên bản triển khai mặc định AI tắt; kế hoạch lập bằng quy tắc (phuongThucLap quy_tac)."
- docs/KE-HOACH-LAM.md: thêm đầu tệp mục "Trạng thái 22/10" gồm: các nhiệm vụ HOÃN và không làm trước 15/11 (ảnh địa điểm D1 đến D7, lịch trình mẫu E7, trang điểm đến E6, E9, E10, E11); lịch eval mới: 23/10 eval:ai-rate 4 kịch bản, 24/10 eval:ai-rate 4 kịch bản (đủ 8 kịch bản có snapshot), 25/10 eval:bill, 26/10 eval:parse, 27/10 eval:likes, 28/10 eval:repair; và ghi nhận trang chủ gọn nằm ở nhánh dem-ui, chưa gộp vào main. Không xóa nội dung cũ.

P5: THỬ GỘP dem-ui (không push)
- git switch -c tam-gop-thu main; git merge --no-ff dem-ui. Nếu có xung đột: git merge --abort, liệt kê các tệp xung đột vào TIEN-DO.md, ghi LỖI.
- Nếu gộp sạch: chạy powershell -File scripts/cong-kiem-tra.ps1 -MaNV P5 và VERCEL=1 DATA_MODE=snapshot npx next start -p 3012 với npm run smoke -- http://localhost:3012 (lưu vào docs/bang-chung/hom-nay/P5/). KHÔNG push nhánh tam-gop-thu.
- Cuối cùng: git switch main; git branch -D tam-gop-thu (đây là nhánh tạm duy nhất được xóa). Đừng đụng nhánh dem-ui.
- Chỉ commit lên main các tệp bằng chứng trong docs/bang-chung/hom-nay/P5/ và TIEN-DO.md.

KẾT THÚC: git switch main; git status sạch; cổng 3011 và 3012 trống; git stash list (nêu stash còn lại). Báo cáo trong tin nhắn tối đa 8 dòng: mỗi việc P0 đến P5 ghi XONG hoặc LỖI hoặc BỎ QUA và mã commit; vitest (số tệp, số test) sau việc cuối; git log -8 --oneline. Ghi thêm tệp docs/bang-chung/hom-nay/TIEN-DO.md (người dùng sẽ mở tệp này).
