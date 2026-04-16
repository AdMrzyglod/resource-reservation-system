import { useResourceEditor } from '@/features/reservations/hooks/useResourceEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ResourceFormWidget = ({ id }: { id?: string }) => {
    const editor = useResourceEditor(id);

    if (editor.loading) return <div className="p-20 text-center animate-pulse">Loading Editor...</div>;

    const dynamicDotSize = editor.map.dotSize * editor.map.zoom;
    const dynamicEraserSize = editor.tools.eraserSize * editor.map.zoom;

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const currentDateTime = now.toISOString().slice(0, 16);

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const startMs = new Date(editor.form.startDate).getTime();
        const endMs = new Date(editor.form.endDate).getTime();
        const deadlineMs = editor.form.purchaseDeadline ? new Date(editor.form.purchaseDeadline).getTime() : null;

        if (startMs >= endMs) {
            alert("Error: The Event End Date must be strictly AFTER the Start Date.");
            return;
        }
        a
        if (deadlineMs && deadlineMs >= startMs) {
            alert("Error: The Purchase Deadline must be BEFORE the Event Start Date.");
            return;
        }

        editor.handlers.handleSubmit(e as any);
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6 w-full">
            <div className="flex items-center gap-4 mb-8">
                {editor.isEditMode && <Button variant="outline" onClick={() => editor.navigate(-1)}>← Cancel Edit</Button>}
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {editor.isEditMode ? 'Edit Resource Configuration' : 'Create New Resource'}
                </h1>
            </div>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 h-fit">
                    {editor.isEditMode && (
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs font-semibold border border-blue-200">
                            ℹ️ You can edit pricing and details, and add NEW units. Existing units are locked to prevent data corruption.
                        </div>
                    )}

                    <div className="space-y-2"><Label>Title</Label><Input value={editor.form.title} onChange={e => editor.form.setTitle(e.target.value)} required placeholder="e.g. Main Event Hall" /></div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <select className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50" value={editor.form.categoryId} onChange={e => editor.form.setCategoryId(e.target.value)} required>
                            <option value="" disabled>Select Category</option>
                            {editor.form.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2"><Label>Price per Unit ($)</Label><Input type="number" step="0.01" min="0" value={editor.form.price} onChange={e => editor.form.setPrice(e.target.value)} required /></div>
                    <div className="space-y-2">
                        <Label>Purchase Deadline <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
                        <Input
                            type="datetime-local"
                            value={editor.form.purchaseDeadline}
                            onChange={e => editor.form.setPurchaseDeadline(e.target.value)}
                            min={currentDateTime}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="datetime-local"
                                value={editor.form.startDate}
                                onChange={e => editor.form.setStartDate(e.target.value)}
                                required
                                min={currentDateTime}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="datetime-local"
                                value={editor.form.endDate}
                                onChange={e => editor.form.setEndDate(e.target.value)}
                                required
                                min={editor.form.startDate || currentDateTime}
                            />
                        </div>
                    </div>

                    <div className="pt-4 pb-2 border-t border-slate-100">
                        <span className="block text-sm font-bold text-slate-800 mb-3">Location Address</span>
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="space-y-1"><Label className="text-xs">Street</Label><Input className="h-8 text-sm" value={editor.address.street} onChange={e => editor.address.setStreet(e.target.value)} required placeholder="Main St. 1" /></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1"><Label className="text-xs">City</Label><Input className="h-8 text-sm" value={editor.address.city} onChange={e => editor.address.setCity(e.target.value)} required /></div>
                                <div className="space-y-1"><Label className="text-xs">Postal Code</Label><Input className="h-8 text-sm" value={editor.address.postalCode} onChange={e => editor.address.setPostalCode(e.target.value)} required /></div>
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Country</Label><Input className="h-8 text-sm" value={editor.address.country} onChange={e => editor.address.setCountry(e.target.value)} required /></div>
                        </div>
                    </div>

                    <div className="space-y-2"><Label>Description</Label><textarea className="flex min-h-[100px] max-h-[300px] w-full rounded-lg border border-input px-3 py-2 text-sm shadow-sm outline-none" value={editor.form.description} onChange={e => editor.form.setDescription(e.target.value)} required /></div>

                    {!editor.isEditMode && (
                        <div className="space-y-2">
                            <Label>Map Image</Label>
                            <Input type="file" accept="image/*" onChange={editor.map.handleImageChange} required className="pt-1.5" />
                        </div>
                    )}

                    <Button type="submit" disabled={editor.grid.isGridMode} className="w-full py-6 text-md bg-indigo-600 hover:bg-indigo-700 shadow-md">
                        {editor.isEditMode ? 'Save Changes' : 'Publish Map'}
                    </Button>
                </div>

                <div className="lg:col-span-3 space-y-4">
                    {editor.map.imagePreview ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
                            <div className="flex flex-col 2xl:flex-row gap-4 bg-slate-50 p-4 border-b border-slate-200 z-10">
                                <div className="space-y-2 flex-1 min-w-max">
                                    <Label className="text-slate-500 uppercase text-xs tracking-wider">Drawing Tools</Label>
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <div className="flex gap-2">
                                            <Button type="button" disabled={editor.grid.isGridMode} variant={editor.tools.tool === 'add' ? 'default' : 'outline'} onClick={() => editor.tools.setTool('add')} className={editor.tools.tool === 'add' && !editor.grid.isGridMode ? 'bg-indigo-600' : ''}>Add Unit</Button>
                                            <Button type="button" disabled={editor.grid.isGridMode} variant={editor.tools.tool === 'erase' ? 'destructive' : 'outline'} onClick={() => editor.tools.setTool('erase')}>Eraser (New Only)</Button>
                                        </div>
                                        <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
                                            <div className="w-24 md:w-32"><Label className="text-xs mb-1 block">Unit Size ({editor.map.dotSize}px)</Label><input type="range" min="4" max="40" value={editor.map.dotSize} onChange={e => editor.map.setDotSize(Number(e.target.value))} className="w-full accent-indigo-600" disabled={editor.isEditMode} /></div>
                                            <div className="w-24 md:w-32"><Label className="text-xs mb-1 block text-red-500">Eraser ({editor.tools.eraserSize}px)</Label><input type="range" min="10" max="200" value={editor.tools.eraserSize} onChange={e => editor.tools.setEraserSize(Number(e.target.value))} className="w-full accent-red-500" /></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 flex-[1.5] border-t 2xl:border-t-0 2xl:border-l border-slate-200 2xl:pl-4 pt-4 2xl:pt-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-slate-500 uppercase text-xs tracking-wider">Dynamic Grid</Label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={editor.grid.isGridMode} onChange={e => editor.grid.setIsGridMode(e.target.checked)} />
                                            <div className="w-7 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full"></div>
                                        </label>
                                    </div>
                                    <div className={`flex flex-wrap gap-2 items-end transition-opacity ${!editor.grid.isGridMode ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                        <div className="space-y-1"><Label className="text-xs">R</Label><Input type="number" className="w-14 h-8 text-sm" value={editor.grid.gridRows} onChange={e => editor.grid.setGridRows(Number(e.target.value))} /></div>
                                        <div className="space-y-1"><Label className="text-xs">C</Label><Input type="number" className="w-14 h-8 text-sm" value={editor.grid.gridCols} onChange={e => editor.grid.setGridCols(Number(e.target.value))} /></div>
                                        <div className="space-y-1"><Label className="text-xs">Sp X</Label><Input type="number" step="0.5" className="w-14 h-8 text-sm" value={editor.grid.gridSpacingX} onChange={e => editor.grid.setGridSpacingX(Number(e.target.value))} /></div>
                                        <div className="space-y-1"><Label className="text-xs">Sp Y</Label><Input type="number" step="0.5" className="w-14 h-8 text-sm" value={editor.grid.gridSpacingY} onChange={e => editor.grid.setGridSpacingY(Number(e.target.value))} /></div>
                                        <div className="space-y-1"><Label className="text-xs text-orange-600 font-bold">Rot (°)</Label><Input type="number" className="w-16 h-8 text-sm bg-orange-50" value={editor.grid.gridRotation} onChange={e => editor.grid.setGridRotation(Number(e.target.value))} /></div>
                                        <Button type="button" onClick={editor.grid.confirmGrid} className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs ml-auto">Save Grid</Button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 border-t 2xl:border-t-0 2xl:border-l border-slate-200 2xl:pl-4 pt-4 2xl:pt-0">
                                    <div className="flex flex-col items-center">
                                         <Label className="text-slate-500 uppercase text-[10px] tracking-wider mb-2">Zoom Map</Label>
                                         <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm">
                                             <button type="button" onClick={editor.map.handleZoomOut} className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded hover:bg-slate-200 font-bold">-</button>
                                             <span className="text-xs font-semibold w-10 text-center">{Math.round(editor.map.zoom * 100)}%</span>
                                             <button type="button" onClick={editor.map.handleZoomIn} className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded hover:bg-slate-200 font-bold">+</button>
                                         </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center min-w-[80px] bg-white border border-slate-200 rounded-lg p-2 ml-auto">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Units</span>
                                        <span className="text-2xl font-black text-indigo-600 leading-none mt-1">{editor.map.existingUnits.length + editor.map.newUnits.length}</span>
                                    </div>
                                </div>
                            </div>

                            <div
                                ref={editor.refs.containerRef}
                                className="relative w-full h-[650px] overflow-auto bg-slate-200 custom-scrollbar select-none"
                                onMouseDown={editor.handlers.handleMapMouseDown} onMouseMove={editor.handlers.handleMapMouseMove} onMouseUp={editor.handlers.handleMapMouseUp} onMouseLeave={editor.handlers.handleMapMouseUp}
                                style={{ cursor: editor.tools.tool === 'erase' ? 'default' : 'grab' }}
                            >
                                <div ref={editor.refs.imageContainerRef} className="relative mx-auto" style={{ width: editor.map.zoom === 1 ? 'max-content' : `${editor.map.zoom * 100}%`, cursor: editor.tools.tool === 'erase' ? 'none' : 'crosshair' }} onClick={editor.handlers.handleCanvasClick}>
                                    <img src={editor.map.imagePreview} alt="Map preview" className="block pointer-events-none" style={{ width: editor.map.zoom === 1 ? 'auto' : '100%', height: 'auto', maxHeight: editor.map.zoom === 1 ? '600px' : 'none', maxWidth: editor.map.zoom === 1 ? '100%' : 'none' }} draggable={false} />

                                    {editor.tools.tool === 'erase' && !editor.grid.isGridMode && (
                                        <div className={`absolute pointer-events-none rounded-full border border-red-500 transition-colors ${editor.tools.isErasing ? 'bg-red-500/40 border-red-700' : 'bg-red-500/20'}`}
                                             style={{
                                                 width: `${dynamicEraserSize}px`, height: `${dynamicEraserSize}px`,
                                                 left: `${editor.tools.eraserMousePos.x - dynamicEraserSize / 2}px`, top: `${editor.tools.eraserMousePos.y - dynamicEraserSize / 2}px`,
                                                 display: editor.tools.eraserMousePos.x > 0 ? 'block' : 'none'
                                             }}
                                        />
                                    )}

                                    {editor.isEditMode && editor.map.existingUnits.map((unit: any) => (
                                        <div key={unit.id} title={`Existing Unit #${unit.id} (LOCKED)`} className="absolute rounded-full border border-white/80 shadow-sm"
                                            style={{ left: `calc(${unit.x}% - ${dynamicDotSize/2}px)`, top: `calc(${unit.y}% - ${dynamicDotSize/2}px)`, width: `${dynamicDotSize}px`, height: `${dynamicDotSize}px`, backgroundColor: '#eab308' }}
                                        />
                                    ))}

                                    {editor.map.newUnits.map((unit: any) => (
                                        <div key={unit.id} title="New Unit (Editable)" className="absolute rounded-full border border-white/80 shadow-sm"
                                            style={{ left: `calc(${unit.x}% - ${dynamicDotSize/2}px)`, top: `calc(${unit.y}% - ${dynamicDotSize/2}px)`, width: `${dynamicDotSize}px`, height: `${dynamicDotSize}px`, backgroundColor: '#22c55e' }}
                                        />
                                    ))}

                                    {editor.grid.isGridMode && editor.grid.dynamicGrid.map((unit: any) => (
                                        <div key={unit.id} className="absolute rounded-full border border-white/80 shadow-md transition-none"
                                            style={{ left: `calc(${unit.x}% - ${dynamicDotSize/2}px)`, top: `calc(${unit.y}% - ${dynamicDotSize/2}px)`, width: `${dynamicDotSize}px`, height: `${dynamicDotSize}px`, backgroundColor: '#f97316', opacity: 0.8 }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 p-3 justify-center bg-slate-50 border-t border-slate-200">
                                {editor.isEditMode && <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#eab308] opacity-100"></div><span className="text-xs font-bold text-slate-600">Existing Locked Units ({editor.map.existingUnits.length})</span></div>}
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#22c55e]"></div><span className="text-xs font-bold text-slate-600">{editor.isEditMode ? 'New Editable Units' : 'Units'} ({editor.map.newUnits.length})</span></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full min-h-[500px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50">
                            <span className="text-slate-400 font-medium text-lg">Upload an image to open the map editor</span>
                            <span className="text-slate-400 text-sm mt-2">Supports JPG, PNG, WEBP up to 10MB</span>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};