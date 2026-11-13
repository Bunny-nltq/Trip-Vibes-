import {AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA,CAFE_MAC_DINH_MOI_NGUOI} from "./assumptions";
export function foodGroupEstimate(price:number|null,people:number,kind:"meal"|"cafe",estimated=false){const unit=price??(kind==="cafe"?CAFE_MAC_DINH_MOI_NGUOI:AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA);return {giaUocTinhNguoi:unit,tongTienChoNhom:unit*people,giaLaUocTinh:price===null||estimated};}
export function lodgingGroupCost(nightlyPrice:number,nights:number,rooms:number){return nightlyPrice*nights*rooms;}

export function perPersonGroupCost(price:number,people:number){return price*people;}
export function admissionGroupQuote(price:number,known:boolean|undefined,people:number,estimated=false){const priceKnown=known??price>0;return {giaVeNguoi:priceKnown?price:null,tongTienChoNhom:priceKnown?price*people:null,priceKnown,giaLaUocTinh:estimated};}
