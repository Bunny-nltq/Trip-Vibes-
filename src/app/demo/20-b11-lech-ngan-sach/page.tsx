import React from "react";
import "@/app/wireframes.css"; // We will create this

export default function Page_20b11lechngansach() {
  return (
    <div className="wireframe-container">
      

<div className="TopBar">
  <div className="Logo">Trip Vibes</div>
  <div className="TripTitle">TP.HCM → Đà Nẵng · 3 ngày 2 đêm · 2 người</div>
  <div className="TopActions"><div className="User">Khách</div></div>
</div><div className="Layout"><div className="SideNav"><div className="NavItem NavOn">Kế hoạch</div><div className="NavItem NavOn">Chuyến đi</div><div className="NavItem NavActive">Ngân sách</div></div><div className="MainWide"><div className="Row" style={{"justifyContent": "space-between"}}><div><div className="H1">Ngân sách thực tế</div><div className="Sub">Kế hoạch so với chi tiêu bạn đã ghi.</div></div><div className="Btn BtnPrimary">Thêm chi tiêu</div></div>
<div className="Grid4"><div className="Stat"><div className="Label">Ngân sách</div><div className="StatNum">10.000.000 đ</div></div>
<div className="Stat"><div className="Label">Đã đặt trước (di chuyển, chỗ ở)</div><div className="StatNum">6.120.000 đ</div></div>
<div className="Stat"><div className="Label">Đã chi thực tế</div><div className="StatNum">2.196.000 đ</div></div>
<div className="Stat"><div className="Label">Còn lại</div><div className="StatNum">1.684.000 đ</div></div></div><div className="Banner BannerWarn"><div className="BannerMark">!</div><div><div className="BannerTitle">Chi tiêu đang lệch kế hoạch</div><div className="BannerText">Ngày 3 có thể vượt khoảng 216.000 đ.</div><div className="BannerText">Vui chơi đã vượt kế hoạch 900.000 đ do khoản chi ngoài kế hoạch.</div></div></div><div className="Btn BtnPrimary" style={{"width": "240px", "margin": "-6px 0 20px"}}>Xem đề xuất điều chỉnh</div><div className="Card" style={{"padding": "8px"}}><table className="Table"><tr><th>Hạng mục (đến hết ngày 2)</th><th className="Num">Kế hoạch</th><th className="Num">Thực tế</th><th className="Num">Chênh lệch</th><th className="Num">%</th></tr><tr><td>Ăn uống</td><td className="Num">1.200.000 đ</td><td className="Num">976.000 đ</td><td className="Num">−224.000 đ</td><td className="Num">−18,7%</td></tr><tr><td>Vui chơi</td><td className="Num">320.000 đ</td><td className="Num">1.220.000 đ</td><td className="Num">+900.000 đ</td><td className="Num">+281,3%</td></tr><tr><td><b>Cộng</b></td><td className="Num">1.520.000 đ</td><td className="Num">2.196.000 đ</td><td className="Num">+676.000 đ</td><td className="Num">+44,5%</td></tr></table></div>
<div className="SectionTitle" style={{"marginTop": "8px"}}>Các khoản chi</div>
<div className="Card" style={{"padding": "8px"}}><table className="Table"><tr><th>Ngày</th><th>Nội dung</th><th>Hạng mục</th><th className="Num">Số tiền</th><th>Nguồn</th><th className="Num"></th></tr><tr><td>Ngày 1</td><td>Bữa trưa hải sản</td><td>Ăn uống</td><td className="Num">560.000 đ</td><td><span className="Pill">Ảnh bill</span></td><td className="Num">Sửa · Xóa</td></tr><tr><td>Ngày 1</td><td>Cà phê Góc Phố</td><td>Ăn uống</td><td className="Num">108.000 đ</td><td><span className="Pill">Ảnh bill</span></td><td className="Num">Sửa · Xóa</td></tr><tr><td>Ngày 2</td><td>Vé Khu tham quan Sơn Thủy</td><td>Vui chơi</td><td className="Num">80.000 đ</td><td><span className="Pill">Ảnh bill</span></td><td className="Num">Sửa · Xóa</td></tr><tr><td>Ngày 2</td><td>Vé phố cổ Hội An</td><td>Vui chơi</td><td className="Num">240.000 đ</td><td><span className="Pill">Nhập tay</span></td><td className="Num">Sửa · Xóa</td></tr><tr><td>Ngày 2</td><td>Bữa tối Quán Ăn Phố Cổ</td><td>Ăn uống</td><td className="Num">308.000 đ</td><td><span className="Pill">Ảnh bill</span></td><td className="Num">Sửa · Xóa</td></tr><tr><td>Ngày 2</td><td>Massage thư giãn</td><td>Vui chơi</td><td className="Num">900.000 đ</td><td><span className="Pill">Nhập tay</span></td><td className="Num">Sửa · Xóa</td></tr></table></div></div></div>


    </div>
  );
}
