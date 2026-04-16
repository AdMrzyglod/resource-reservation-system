import { useParams } from 'react-router-dom';
import { OrderDetailsWidget } from '@/widgets/OrderDetailsWidget';

export default function OrderDetails() {
    const { id } = useParams();

    if (!id) return null;

    return <OrderDetailsWidget id={id} />;
}