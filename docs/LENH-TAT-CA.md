CHẾ ĐỘ TỰ CHẠY TOÀN BỘ. Làm theo AGENTS.md. Lệnh này CHẠY LẠI ĐƯỢC NHIỀU LẦN: đọc docs/bang-chung/tat-ca/TIEN-DO.md (nếu có) và BỎ QUA việc đã XONG. Không hỏi lại: gặp điều không rõ thì chọn phương án an toàn nhất, ghi vào TIEN-DO.md rồi làm việc khác. Làm lần lượt G0 đến G6.

LUẬT CỨNG
- CẤM: git push --force; git reset --hard (trừ đúng ngoại lệ ở G1); git clean; xóa hay dời tag hoặc nhánh (trừ nhánh tạm ghi rõ); cài thư viện mới; npm audit fix; sửa src/core, src/ai, prompt, đáp án test của người dùng, và tệp trong eval/results bằng tay; đọc hay in nội dung .env* (chỉ được in true/false cho "có khóa" và giá trị GEMINI_MODEL); commit .env*; gọi Gemini ngoài nhóm G3 (mọi chỗ khác LIVE_AI_ENABLED=false).
- Chỉ icon SVG, không emoji; màu và font chỉ từ tokens; ui không import ai hay data.
- Mỗi việc tối đa 90 phút (Get-Date). Quá giờ hoặc lỗi sau 2 lần sửa: git stash push -u -m "that-bai-<MÃ>", ghi LỖI, sang việc độc lập kế tiếp.
- Trước mỗi việc git status phải sạch (bẩn thì git stash push -u -m "truoc-<MÃ>"). Sau mỗi việc chạy powershell -File scripts/cong-kiem-tra.ps1 -MaNV <MÃ>; chỉ commit và push main khi dòng TONG trong docs/bang-chung/tat-ca/<MÃ>/KET-QUA.txt là DAT. Commit CHỈ tệp thuộc việc đó. Đầu ra thô ghi bằng [System.IO.File]::WriteAllText với UTF8Encoding($false) (không dùng Tee-Object hay > vì sinh UTF-16).
- Sau MỖI việc ghi một dòng vào docs/bang-chung/tat-ca/TIEN-DO.md (giờ, mã, XONG hoặc LỖI hoặc BỎ QUA, mã commit, lý do ngắn). Không sửa hay xóa dòng cũ.
- Mọi máy chủ thử (next start) phải dừng sau khi dùng; xác nhận cổng trống bằng Get-NetTCPConnection (không có đầu ra là trống).

G0 (10 phút). Chép NGUYÊN VĂN lệnh này vào docs/LENH-TAT-CA.md (nếu chưa có). git switch main; git status; git stash list; xác nhận cổng 3011, 3012, 3013 trống. Chạy cong-kiem-tra -MaNV G0. DAT thì commit "G0: ..." và push; LỖI thì DỪNG TOÀN BỘ (nền đỏ).

G1. GỘP TRANG CHỦ MỚI (nhánh dem-ui) VÀO main
- Nếu git branch --merged main đã chứa dem-ui: ghi XONG và sang G2.
- git tag truoc-gop-home. git merge --no-ff dem-ui. Liệt kê tệp xung đột (git diff --name-only --diff-filter=U).
- Chỉ khi MỌI tệp xung đột nằm dưới docs/bang-chung/dem/ hoặc là tệp .md dưới docs/: giữ phiên bản của main (git checkout --ours <tệp>; git add <tệp>), rồi git commit. Nếu có tệp xung đột trong src/, eval/, scripts/, package.json hay package-lock.json: git merge --abort, ghi LỖI kèm tên tệp, sang G2 (giữ main như cũ).
- Sau khi gộp: cong-kiem-tra -MaNV G1; VERCEL=1 DATA_MODE=snapshot npx next start -p 3012; npm run smoke -- http://localhost:3012 (lưu docs/bang-chung/tat-ca/G1/smoke.txt). Lần này GET /lap-ke-hoach phải là 200 (không còn là CẢNH BÁO). Dừng máy chủ.
- Mọi kiểm tra ĐẠT thì git push origin main. Còn LỖI: KHÔNG push; được phép git reset --hard truoc-gop-home MỘT LẦN DUY NHẤT (chưa push) rồi ghi LỖI kèm lý do.

G2. BẰNG CHỨNG TRANG CHỦ (không gọi Gemini)
- VERCEL=1 DATA_MODE=snapshot npx next start -p 3012. Bằng Invoke-WebRequest lấy HTML của "/" và "/lap-ke-hoach"; bằng regex (không gõ tay) in vào docs/bang-chung/tat-ca/G2/home-cau-truc.txt: mọi nội dung thẻ h1, h2, h3 của "/", số thẻ <a> và ba liên kết đầu, có chứa chuỗi "OpenStreetMap contributors" hay không (true/false), có chứa "Sắp có" hay không, có chứa chữ "emoji" hay ký tự emoji hay không (dùng scripts/lib/quetEmoji). Dừng máy chủ.
- Nếu công cụ trình duyệt của IDE (Browser task) dùng được: chụp "/" ở 1440 và 390, rồi luồng thật Home sang B1 sang B3 (quy tắc, AI tắt) vào docs/bang-chung/tat-ca/G2/*.png; kiểm tra hash khác nhau (Get-FileHash). Không chụp được thì ghi "chưa chụp" (KHÔNG giả).
- cong-kiem-tra -MaNV G2; commit "G2: ..." và push.

G3. ĐÁNH GIÁ BẰNG GEMINI (mỗi lần chạy xử lý tiếp hàng đợi; DỪNG TOÀN BỘ nhóm này ở lần gặp 429 đầu tiên, KHÔNG thử lại)
a) Điều kiện: viết scratch/kiem-tra-khoa.ts dùng @next/env loadEnvConfig; in "co_khoa: true/false" và GEMINI_MODEL. co_khoa false thì BỎ QUA toàn bộ G3. Đặt $env:GEMINI_MODEL="gemini-3.5-flash-lite" cho mọi lệnh G3 (KHÔNG sửa .env.local); xác nhận bằng script rằng sau loadEnvConfig process.env.GEMINI_MODEL vẫn là giá trị đó (nếu .env.local ghi đè được thì BỎ QUA G3 và ghi lý do). Không đặt biến PLAN_MAX_AI_CALLS.
b) Đo độ trễ: npx next start -p 3013 (đã build), Measure-Command { Invoke-WebRequest http://localhost:3013/api/ai-ping }. Lưu mã trạng thái và số giây vào docs/bang-chung/tat-ca/G3/ping.txt. Mã khác 200 hoặc quá 12 giây thì BỎ QUA G3 (ghi "API chậm hoặc hết hạn mức"). Dừng máy chủ.
c) Hàng đợi theo thứ tự, mỗi bộ chạy khi chưa XONG. Bộ XONG khi tệp eval/results/<bo>-*.json mới nhất có meta.quyTacVersion bằng QUY_TAC_VERSION hiện tại (ai-rate: tổng hợp in "8/8" kịch bản hợp lệ):
 1. npm run eval:ai-rate -- --toi-da=4 (nếu chạy trọn vẹn không 429 và còn kịch bản thì chạy thêm một lần nữa, rồi thôi)
 2. npm run eval:bill
 3. npm run eval:parse (đã có bộ chấm ngân sách mới)
 4. npm run eval:likes
 5. npm run eval:repair
d) Với mỗi bộ: đầu ra thô vào docs/bang-chung/tat-ca/G3/<bo>-<ngày>.txt. Bộ chạy trọn vẹn: commit CHỈ tệp trong eval/results/ và bằng chứng, thông điệp "G3: eval:<bo> ngày <ngày>". Bộ bị 429 giữa chừng: ai-rate thì giữ nguyên ai-rate-progress.json; các bộ khác thì XÓA tệp kết quả dở dang vừa sinh (không commit). Nếu hai kịch bản ai-rate mới liên tiếp bị "khong_do_duoc" thì bộ chạy tự dừng: ghi lại và thôi G3.
e) Ghi vào TIEN-DO.md: bộ nào đã trọn vẹn, bộ nào chưa, lượt Gemini ước tính, 429 xảy ra ở đâu. Push main.

G4. SỐ LIỆU VÀ TÀI LIỆU (không gọi Gemini)
- Nếu mạng ổn: npm run eval:diadiem và npm run eval:data (Overpass hay chậm: giới hạn 40 phút mỗi lệnh; quá giờ thì ghi BỎ QUA). Đầu ra thô vào docs/bang-chung/tat-ca/G4/. Kết quả xấu giữ nguyên, không sửa.
- npm run eval:tonghop; commit eval/results/SO-LIEU-BAO-CAO.md.
- CHANGELOG.md thêm các commit mới từ git log (không bịa). README.md: thêm scripts mới (smoke, check:env, eval:ai-rate tiếp tục). docs/GIOI-HAN-DA-BIET.md: dòng "Trang chủ có 6 khối; ảnh địa điểm, trang điểm đến và lịch trình mẫu chưa làm". docs/HUONG-DAN-DEPLOY.md: các bước Vercel cho người dùng (kết nối repo, Node 22, bảng biến môi trường: DATA_MODE=snapshot, LIVE_DATA_ENABLED=false, LIVE_AI_ENABLED=false, NOMINATIM_USER_AGENT có email thật, GEMINI_MODEL=gemini-3.5-flash-lite, không đặt khóa Gemini nếu để AI tắt; kiểm tra sau deploy: /api/health phải liệt kê 5 snapshot, /demo trả 404; hướng dẫn tạo docs/DEPLOY-URL.txt chứa địa chỉ để chạy smoke). Mọi số trong tài liệu phải đọc từ tệp hay lệnh, không viết từ trí nhớ.
- cong-kiem-tra -MaNV G4; commit "G4: ..." và push.

G5. KIỂM TRA BẢN TRỰC TUYẾN (chỉ khi docs/DEPLOY-URL.txt tồn tại; không thì BỎ QUA)
- Đọc địa chỉ (bỏ khoảng trắng, dấu / cuối). npm run smoke -- <địa chỉ>; lưu docs/bang-chung/tat-ca/G5/smoke-vercel.txt. Thêm: GET <địa chỉ>/api/health phải liệt kê 5 snapshot; nếu thiếu thì ghi "SNAPSHOT KHÔNG ĐƯỢC ĐÓNG GÓI" kèm nội dung phản hồi nguyên văn. KHÔNG sửa mã để cố khớp. Commit bằng chứng.

G6. KẾT THÚC
- git switch main; git status sạch; cổng 3011, 3012, 3013 trống; git stash list (nêu stash còn lại). Ghi vào TIEN-DO.md một mục "TỔNG KẾT LẦN CHẠY": mỗi việc G0 đến G5 ghi XONG, LỖI hoặc BỎ QUA; bộ eval nào đã đủ, bộ nào còn chờ đêm sau. Báo cáo trong tin nhắn tối đa 8 dòng: mỗi việc ghi trạng thái và mã commit; vitest (số tệp, số test) từ lần cong-kiem-tra cuối; git log -8 --oneline.
