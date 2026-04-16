import { useParams } from 'react-router-dom';
import { ResourceMapWidget } from '@/widgets/ResourceMapWidget';

export default function ResourceDetails() {
    const { id } = useParams();

    if (!id) return null;

    return <ResourceMapWidget id={id} />;
}