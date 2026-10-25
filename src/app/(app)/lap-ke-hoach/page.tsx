import React from "react";
import TripVibesApp from "@/ui/TripVibesApp";

export default async function LapKeHoachPage({
  searchParams,
}: {
  searchParams?: Promise<{
    screen?: string;
    mau?: string;
    dest?: string;
    den?: string;
    diemDen?: string;
    tu?: string;
    diemDi?: string;
  }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const initialDest = sp?.den || sp?.dest || sp?.diemDen;
  return (
    <TripVibesApp
      initialScreen={sp?.screen}
      initialMau={sp?.mau}
      initialDest={initialDest}
    />
  );
}
