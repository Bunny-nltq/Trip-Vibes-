import React from "react";
import "@/app/wireframes.css"; // We will create this

export default function Page_01b1chonnhanh() {
  return (
    <div className="wireframe-container">
      

<div className="TopBar">
  <div className="Logo">Trip Vibes</div>
  <div className="TripTitle"></div>
  <div className="TopActions"><div className="User">Khách</div></div>
</div><div className="Center"><div className="H1">Chuyến Đà Nẵng của bạn</div>
<div className="Sub">3 ngày 2 đêm từ TP.HCM. Chạm để chọn, hoặc bấm Lập kế hoạch ngay.</div>
<div className="Label" style={{"marginBottom": "8px"}}>Chọn nhanh</div><div className="Presets">
<div className="Preset"><div className="PresetName">Cặp đôi</div><div className="InfoSub">2 người · 10 triệu</div></div>
<div className="Preset"><div className="PresetName">Nhóm bạn</div><div className="InfoSub">4 người · 20 triệu</div></div>
<div className="Preset"><div className="PresetName">Đi một mình</div><div className="InfoSub">1 người · 5 triệu</div></div></div>
<div className="Label" style={{"marginBottom": "12px"}}>Hoặc tự chọn</div>
<div className="Field"><div className="FieldLabel">Mấy người đi?</div><div className="Stepper"><div className="Step">−</div><div className="StepNum">2</div><div className="Step">+</div></div></div>
<div className="Field"><div className="FieldLabel">Ngân sách cả chuyến</div><div className="Chips"><div className="Chip">5 triệu</div><div className="Chip">8 triệu</div><div className="Chip ChipOn">10 triệu</div><div className="Chip">15 triệu</div><div className="Chip">20 triệu</div></div></div>
<div className="Field"><div className="FieldLabel">Muốn tránh gì?</div><div className="Chips"><div className="Chip ChipOn">Không dậy sớm</div><div className="Chip">Không đi đêm</div><div className="Chip">Tránh đi lâu</div><div className="Chip">Tránh chỗ đông</div><div className="Chip">Tránh đi bộ nhiều</div></div></div>
<div className="Field"><div className="FieldLabel">Muốn nói rõ hơn? <span style={{"fontWeight": "400", "color": "var(--color-text-sub)"}}>Không bắt buộc</span></div>
<div className="Textarea">Ví dụ: đi cùng ba mẹ, thích ăn hải sản, không muốn đi bộ nhiều</div><div className="Hint">Bỏ trống cũng được, AI sẽ tự gợi ý.</div></div>
<div className="Hint" style={{"marginBottom": "10px"}}>2 người · 10 triệu · không dậy sớm · AI tự gợi ý hoạt động</div>
<div className="Btn BtnPrimary BtnFull">Lập kế hoạch</div></div>


    </div>
  );
}
