import { useState, useEffect, useMemo, useRef, MouseEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import { reservationsApi } from '../reservations.api';

export interface Point { id: string; x: number; y: number; status?: string; }
const MAX_UNITS_PER_MAP = 10000;

export const useResourceEditor = (id: string | undefined) => {
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [price, setPrice] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [purchaseDeadline, setPurchaseDeadline] = useState('');
    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);

    const [city, setCity] = useState('');
    const [street, setStreet] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('Poland');

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [existingUnits, setExistingUnits] = useState<Point[]>([]);
    const [newUnits, setNewUnits] = useState<Point[]>([]);
    const [dotSize, setDotSize] = useState(12);

    const [loading, setLoading] = useState(isEditMode);

    const [zoom, setZoom] = useState(1);
    const [tool, setTool] = useState<'add' | 'erase'>('add');
    const [eraserSize, setEraserSize] = useState(40);
    const [isErasing, setIsErasing] = useState(false);
    const [eraserMousePos, setEraserMousePos] = useState({ x: -100, y: -100 });

    const [isGridMode, setIsGridMode] = useState(false);
    const [gridRows, setGridRows] = useState(10);
    const [gridCols, setGridCols] = useState(20);
    const [gridSpacingX, setGridSpacingX] = useState(3);
    const [gridSpacingY, setGridSpacingY] = useState(4);
    const [gridRotation, setGridRotation] = useState(0);
    const [gridOffset, setGridOffset] = useState({ x: 50, y: 50 });
    const [isDraggingGrid, setIsDraggingGrid] = useState(false);
    const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });

    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const [dragStartMap, setDragStartMap] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const formatDateForInput = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const formatToUTC = (localStr: string) => {
        if (!localStr) return '';
        return new Date(localStr).toISOString();
    };

    useEffect(() => {
        reservationsApi.getCategories().then(setCategories).catch(console.error);

        if (isEditMode && id) {
            reservationsApi.getMapDetails(id).then((data: any) => {
                setTitle(data.title);
                setDescription(data.description);
                setPrice(data.price);

                setStartDate(formatDateForInput(data.event_start_date));
                setEndDate(formatDateForInput(data.event_end_date));
                setPurchaseDeadline(data.purchase_deadline ? formatDateForInput(data.purchase_deadline) : '');

                setDotSize(data.dot_size);
                setImagePreview(`${import.meta.env.VITE_API_URL}${data.image_url}`);

                if (data.address) {
                    setStreet(data.address.street || '');
                    setCity(data.address.city || '');
                    setPostalCode(data.address.postal_code || '');
                    setCountry(data.address.country || 'Poland');
                }

                setExistingUnits(
                    data.units.map((u: any) => ({
                        id: u.id.toString(),
                        x: u.x_position,
                        y: u.y_position,
                        status: u.status
                    }))
                );

                reservationsApi.getCategories().then(r => {
                    const found = r.find((c:any) => c.name === data.category_name);
                    if (found) setCategoryId(found.id.toString());
                });

                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [id, isEditMode]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setNewUnits([]);
            setIsGridMode(false);
            setZoom(1);
        }
    };

    const getMousePosition = (e: MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current) return null;
        const rect = imageContainerRef.current.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        };
    };

    const dynamicGrid = useMemo(() => {
        if (!isGridMode) return [];
        const points: Point[] = [];
        const rad = (gridRotation * Math.PI) / 180;
        const cx = (gridCols - 1) * gridSpacingX / 2;
        const cy = (gridRows - 1) * gridSpacingY / 2;

        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                const dx = c * gridSpacingX - cx;
                const dy = r * gridSpacingY - cy;

                points.push({
                    id: `temp-grid-${r}-${c}`,
                    x: (dx * Math.cos(rad) - dy * Math.sin(rad)) + gridOffset.x,
                    y: (dx * Math.sin(rad) + dy * Math.cos(rad)) + gridOffset.y
                });
            }
        }
        return points;
    }, [isGridMode, gridRows, gridCols, gridSpacingX, gridSpacingY, gridRotation, gridOffset]);

    const handleZoomIn = () => setZoom(z => Math.min(4, Math.round((z + 0.1) * 10) / 10));
    const handleZoomOut = () => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10));

    const handleMapMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (isGridMode) {
            setIsDraggingGrid(true);
            const pos = getMousePosition(e);
            if (pos) setDragStartOffset({ x: pos.x - gridOffset.x, y: pos.y - gridOffset.y });
            return;
        }

        if (!containerRef.current) return;
        setIsDraggingMap(true);
        setDragStartMap({ x: e.pageX, y: e.pageY });
        setScrollStart({
            left: containerRef.current.scrollLeft,
            top: containerRef.current.scrollTop
        });

        if (tool === 'erase') setIsErasing(true);
    };

    const handleMapMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (isGridMode && isDraggingGrid) {
            const pos = getMousePosition(e);
            if (pos) setGridOffset({
                x: pos.x - dragStartOffset.x,
                y: pos.y - dragStartOffset.y
            });
            return;
        }

        if (isDraggingMap && containerRef.current && tool === 'add') {
            e.preventDefault();
            containerRef.current.scrollLeft = scrollStart.left - (e.pageX - dragStartMap.x);
            containerRef.current.scrollTop = scrollStart.top - (e.pageY - dragStartMap.y);
        }

        if (tool === 'erase') {
            const rect = imageContainerRef.current?.getBoundingClientRect();
            if (rect) setEraserMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }

        if (tool === 'erase' && isErasing) {
            const pos = getMousePosition(e);
            if (!pos) return;

            const containerWidth =
                imageContainerRef.current?.getBoundingClientRect().width || 1000;

            const eraserRadiusPct =
                ((eraserSize * zoom) / 2 / containerWidth) * 100;

            setNewUnits(prev =>
                prev.filter(unit =>
                    Math.sqrt(
                        Math.pow(unit.x - pos.x, 2) +
                        Math.pow(unit.y - pos.y, 2)
                    ) > eraserRadiusPct
                )
            );
        }
    };

    const handleMapMouseUp = () => {
        setIsDraggingMap(false);
        setIsDraggingGrid(false);
        setIsErasing(false);
    };

    const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
        if (
            Math.abs(e.pageX - dragStartMap.x) > 5 ||
            Math.abs(e.pageY - dragStartMap.y) > 5
        ) return;

        if (isGridMode || isDraggingGrid) return;

        if (
            existingUnits.length + newUnits.length >= MAX_UNITS_PER_MAP &&
            tool === 'add'
        ) return alert(`Limit reached. Max ${MAX_UNITS_PER_MAP} units.`);

        const pos = getMousePosition(e);
        if (!pos) return;

        if (tool === 'add') {
            setNewUnits(prev => [
                ...prev,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    x: pos.x,
                    y: pos.y
                }
            ]);
        }
    };

    const confirmGrid = () => {
        if (
            existingUnits.length +
            newUnits.length +
            dynamicGrid.length >
            MAX_UNITS_PER_MAP
        ) return alert(`Maximum ${MAX_UNITS_PER_MAP} units total allowed.`);

        setNewUnits(prev => [
            ...prev,
            ...dynamicGrid.map(p => ({
                ...p,
                id: Math.random().toString(36).substr(2, 9)
            }))
        ]);

        setIsGridMode(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (isGridMode) return alert('Please confirm or cancel the grid preview first.');
        if (existingUnits.length + newUnits.length > MAX_UNITS_PER_MAP)
            return alert(`Max ${MAX_UNITS_PER_MAP} units allowed.`);
        if (!isEditMode && !imageFile) return alert('Upload an image first.');
        if (!isEditMode && newUnits.length === 0)
            return alert('Add at least one unit to the map.');

        const addressData = {
            has_address: true,
            city,
            street,
            postal_code: postalCode,
            country
        };

        try {
            if (isEditMode && id) {
                const payload: any = {
                    title,
                    description,
                    price,
                    event_start_date: formatToUTC(startDate),
                    event_end_date: formatToUTC(endDate),
                    purchase_deadline: purchaseDeadline
                        ? formatToUTC(purchaseDeadline)
                        : null,
                    address_data: JSON.stringify(addressData)
                };

                if (categoryId) payload.category = categoryId;

                if (newUnits.length > 0) {
                    payload.new_units_data = JSON.stringify(
                        newUnits.map(u => ({ x: u.x, y: u.y }))
                    );
                }

                await apiClient.patch(`/reservations/maps/${id}/`, payload);
                alert('Resource updated successfully!');
                navigate(`/creator/map/${id}`);
            } else {
                const formData = new FormData();

                formData.append('title', title);
                formData.append('description', description);
                formData.append('category', categoryId);
                formData.append('price', price.toString());

                if (purchaseDeadline)
                    formData.append('purchase_deadline', formatToUTC(purchaseDeadline));

                formData.append('event_start_date', formatToUTC(startDate));
                formData.append('event_end_date', formatToUTC(endDate));
                formData.append('dot_size', dotSize.toString());
                formData.append('image_file', imageFile as File);
                formData.append(
                    'units_data',
                    JSON.stringify(newUnits.map(u => ({ x: u.x, y: u.y })))
                );
                formData.append('address_data', JSON.stringify(addressData));

                await apiClient.post('/reservations/maps/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                navigate('/dashboard', { state: { tab: 'RESOURCES' } });
            }
        } catch (error) {
            console.error('Submit failed', error);
            alert(`Failed to ${isEditMode ? 'update' : 'create'} resource. Check fields.`);
        }
    };

    return {
        isEditMode,
        navigate,
        form: {
            title,
            setTitle,
            description,
            setDescription,
            categoryId,
            setCategoryId,
            price,
            setPrice,
            startDate,
            setStartDate,
            endDate,
            setEndDate,
            purchaseDeadline,
            setPurchaseDeadline,
            categories
        },
        address: {
            city,
            setCity,
            street,
            setStreet,
            postalCode,
            setPostalCode,
            country,
            setCountry
        },
        map: {
            imagePreview,
            handleImageChange,
            existingUnits,
            newUnits,
            dotSize,
            setDotSize,
            zoom,
            handleZoomIn,
            handleZoomOut
        },
        tools: {
            tool,
            setTool,
            eraserSize,
            setEraserSize,
            isErasing,
            eraserMousePos
        },
        grid: {
            isGridMode,
            setIsGridMode,
            gridRows,
            setGridRows,
            gridCols,
            setGridCols,
            gridSpacingX,
            setGridSpacingX,
            gridSpacingY,
            setGridSpacingY,
            gridRotation,
            setGridRotation,
            dynamicGrid,
            confirmGrid
        },
        handlers: {
            handleMapMouseDown,
            handleMapMouseMove,
            handleMapMouseUp,
            handleCanvasClick,
            handleSubmit
        },
        refs: {
            containerRef,
            imageContainerRef
        },
        loading
    };
};