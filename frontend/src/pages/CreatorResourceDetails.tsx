import { useParams } from 'react-router-dom';
import { CreatorResourceDetailsWidget } from '@/widgets/CreatorResourceDetailsWidget';

export default function CreatorResourceDetails() {
    const { id } = useParams();

    if (!id) return null;

    return <CreatorResourceDetailsWidget id={id} />;
}