import React from 'react';
import type { Address } from '../types';

interface OrganizerCardProps {
    snap: any;
    address: Address | null;
}

export const OrganizerCard: React.FC<OrganizerCardProps> = ({ snap, address }) => {
    const isCompany = snap.account_type === 'company';

    return (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Organizer & Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <span className="block text-sm font-extrabold text-slate-800">
                        {isCompany
                            ? snap.company_name
                            : `${snap.first_name} ${snap.last_name}`}
                    </span>

                    {isCompany && (
                        <span className="text-xs text-slate-500">
                            Tax ID: {snap.tax_id}
                        </span>
                    )}

                    {snap.address && (
                        <div className="text-sm text-slate-600 mt-2">
                            <span className="block text-xs font-semibold text-slate-400 uppercase">
                                Billing Address:
                            </span>
                            <br />
                            {snap.address.street}, {snap.address.postal_code}{' '}
                            {snap.address.city}, {snap.address.country}
                        </div>
                    )}
                </div>

                {address && (
                    <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                        <span className="block text-xs font-semibold mb-1 text-indigo-500 uppercase">
                            Event Location:
                        </span>

                        <div className="text-sm text-slate-600 font-medium">
                            {address.street}
                            <br />
                            {address.postal_code} {address.city}, {address.country}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};