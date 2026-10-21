/**
 * eval/lib/meta.ts
 *
 * Định nghĩa cấu trúc và hàm tạo trường "meta" chuẩn cho mọi tệp kết quả eval.
 * Bắt buộc ghi phiên bản quy tắc, phiên bản prompt agent, tên model, ngày chạy ISO và tên bộ kiểm thử.
 */

export interface TaoMetaEvalParams {
  quyTacVersion: string;
  agentPromptVersion: string;
  model: string;
  ngayChayISO: string;
  tenBo: string;
}

export interface MetaEval {
  quyTacVersion: string;
  agentPromptVersion: string;
  model: string;
  ngayChay: string;
  tenBo: string;
}

/**
 * Tạo đối tượng meta chuẩn cho tệp kết quả eval.
 * Lưu ý: ngayChay nhận giá trị từ ngayChayISO.
 */
export function taoMetaEval({
  quyTacVersion,
  agentPromptVersion,
  model,
  ngayChayISO,
  tenBo,
}: TaoMetaEvalParams): MetaEval {
  return {
    quyTacVersion,
    agentPromptVersion,
    model,
    ngayChay: ngayChayISO,
    tenBo,
  };
}
