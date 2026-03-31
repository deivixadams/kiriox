import { DomainDetailView } from "@/modules/core";

export default function DomainPage({ params }: { params: { id: string } }) {
    return <DomainDetailView domainId={params.id} />;
}
