import { notFound } from "next/navigation";
import RoomClient from "./room-client";
export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
    // Private room data is loaded only after the browser obtains a guest identity.
    return <RoomClient key={id} roomId={id} />;
}
