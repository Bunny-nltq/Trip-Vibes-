import React from "react";
import Link from "next/link";

export default function DemoIndex() {
  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-8 text-[var(--color-primary-500)]">Trip Vibes - Giao diện Demo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <Link href="/demo/01-b1-chon-nhanh" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B1 Chọn nhanh</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/02-b2-agent-dang-chay" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B2 Agent đang chạy</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/03-b3-ke-hoach" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B3 Kế hoạch tổng quan</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/04-b4-chon-phuong-tien" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B4 Chọn phương tiện</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/05-b5-chon-khach-san" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B5 Chọn khách sạn</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/06-b6-xem-truoc-thay-doi" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B6 Xem trước thay đổi</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/07-b7-xac-nhan" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B7 Xác nhận</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/08-b8-chuyen-di" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B8 Chuyến đi</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/09-b9-chi-duong" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B9 Chọn chỉ đường</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/10-b10a-chon-nguon" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B10a Chọn ảnh bill</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/11-b10b-xac-nhan-ket-qua" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B10b Xác nhận kết quả đọc</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/12-b10c-nhap-tay" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B10c Nhập tay</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/13-b11-ngan-sach-thuc-te" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B11 Ngân sách thực tế</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/14-b1-can-lam-ro" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B1 AI hỏi thêm</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/15-b1-ngan-sach-khong-du" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B1 Ngân sách không đủ</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/16-b3-co-vi-pham" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B3 Có vi phạm</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/17-b6-vi-pham-nang" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B6 Xem trước có vi phạm</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/18-b7-da-chot" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B7 Đã chốt</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/19-b10-khong-doc-duoc" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B10 Không đọc được số tiền</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/20-b11-lech-ngan-sach" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">B11 Lệch ngân sách</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/21-a1-chat" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">A1 Chat</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/22-a2-ket-qua-van-ban" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">A2 Kết quả dạng văn bản</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/23-a3-chat-tiep" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">A3 Chat tiếp</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/24-w0-man-chao" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">W0 Màn chào</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/25-l1-dang-nhap" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">L1 Đăng nhập</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/26-l2-dang-ky" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">L2 Đăng ký</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/27-l3-quen-mat-khau" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">L3 Quên mật khẩu</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
        <Link href="/demo/28-ve-trip-vibes" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">Về Trip Vibes</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        
      </div>
    </div>
  );
}
