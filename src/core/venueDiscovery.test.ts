import {it,expect} from "vitest";import {uniqueNamedOsmVenues,balanceVenuesByCity} from "./venueDiscovery";

it("excludes species markers while keeping the zoo as a visitable destination", () => {
  const names = ["Vẹt Nam Mỹ", "Vet Nam My", "Cá sấu", "Hươu cao cổ", "Ngỗng", "Quạ đen", "Vườn thú Thủ Lệ"];
  const places = names.map((ten, index) => ({ ten, id: `osm:node:${index}` }));
  expect(uniqueNamedOsmVenues(places).map(place => place.ten)).toEqual(["Vườn thú Thủ Lệ"]);
});
it("does not propose several OSM fragments of the same bridge as different attractions",()=>{const places=[{id:"osm:way:1",ten:"Cầu An Hội"},{id:"osm:way:2",ten:"Cầu An Hội"},{id:"osm:node:3",ten:"Bảo tàng"}];expect(uniqueNamedOsmVenues(places).map(p=>p.id)).toEqual(["osm:way:1","osm:node:3"]);expect(places).toHaveLength(3);});
it("balances discovery across cities while preserving each city's order",()=>{expect(balanceVenuesByCity([{city:"A",id:1},{city:"A",id:2},{city:"B",id:3}]).map(p=>p.id)).toEqual([1,3,2]);});
