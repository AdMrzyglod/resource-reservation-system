import { useParams } from 'react-router-dom';
import { ResourceFormWidget } from '@/widgets/ResourceFormWidget';

export default function ResourceForm() {
    const { id } = useParams();

    return <ResourceFormWidget id={id} />;
}