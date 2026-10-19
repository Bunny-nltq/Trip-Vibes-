import React from "react";
import "@/app/wireframes.css"; // We will create this

export default function Page_02b2agentdangchay() {
  return (
    <div className="wireframe-container">
      

<div className="TopBar">
  <div className="Logo">Trip Vibes</div>
  <div className="TripTitle"></div>
  <div className="TopActions"><div className="User">Khách</div></div>
</div><div className="Center"><div className="H1">Đang lập kế hoạch cho bạn</div><div className="Sub">Thường mất vài chục giây.</div>
<div className="Card"><div className="FieldLabel">AI hiểu bạn muốn gì</div>
<div className="Chips"><div className="Chip">2 người</div><div className="Chip">3 ngày 2 đêm</div><div className="Chip">Ngân sách 10.000.000 đ</div><div className="Chip">AI tự gợi ý hoạt động</div></div>
<div className="Link">Sửa yêu cầu</div></div>
<div className="Card"><div className="Row" style={{"marginBottom": "14px"}}><div className="Step" style={{"borderRadius": "18px"}}>✓</div><div><div className="InfoTitle">Tìm phương tiện</div><div className="InfoSub">Đã tìm thấy 6 lựa chọn</div></div></div><div className="Row" style={{"marginBottom": "14px"}}><div className="Step" style={{"borderRadius": "18px"}}>✓</div><div><div className="InfoTitle">Tìm khách sạn</div><div className="InfoSub">Đã tìm thấy 4 lựa chọn</div></div></div><div className="Row" style={{"marginBottom": "14px"}}><div className="Step" style={{"borderRadius": "18px"}}>●</div><div><div className="InfoTitle">Gợi ý hoạt động</div><div className="InfoSub">Đang chọn hoạt động phù hợp...</div></div></div><div className="Row" style={{"marginBottom": "14px"}}><div className="Step" style={{"borderRadius": "18px"}}>○</div><div><div className="InfoTitle">Kiểm tra và tính chi phí</div><div className="InfoSub">Nếu vượt ngân sách, AI sẽ tự điều chỉnh (tối đa 2 lần)</div></div></div><div className="BarTrack" style={{"marginTop": "8px"}}><div className="BarFill" style={{"width": "55%"}}></div></div></div>
<div className="Btn" style={{"width": "120px"}}>Hủy</div></div>


    </div>
  );
}
