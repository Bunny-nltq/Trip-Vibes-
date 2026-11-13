/** A fee flag is not a ticket amount. */
export function osmAdmissionPrice(tags:Record<string,string|undefined>){return tags.fee==="no"?{amount:0,known:true}:{amount:null,known:false};}
