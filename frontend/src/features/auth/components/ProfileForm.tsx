import { useProfile } from '../hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ProfileForm = () => {
    const { profile, setProfile, handleProfileUpdate, handleIbanChange } = useProfile();

    if (!profile) return <div className="p-20 text-center animate-pulse">Loading Profile...</div>;

    return (
        <form
            onSubmit={(e) => handleProfileUpdate(e, profile)}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-8 rounded-3xl border shadow-sm"
        >
            <div className="space-y-6">
                <h3 className="text-xl font-bold border-b pb-2 flex justify-between items-center">
                    Identification
                    {profile.is_complete ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase">
                            Complete
                        </span>
                    ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase">
                            Incomplete
                        </span>
                    )}
                </h3>

                <div className="space-y-2">
                    <Label>Account Type</Label>
                    <select
                        className="w-full h-10 border rounded-lg px-3 bg-slate-50 font-semibold outline-none focus:ring-2 focus:ring-indigo-600/20"
                        value={profile.account_type}
                        onChange={e =>
                            setProfile({ ...profile, account_type: e.target.value })
                        }
                    >
                        <option value="individual">Individual / Person</option>
                        <option value="company">Business / Company</option>
                    </select>
                </div>

                {profile.account_type === 'individual' ? (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                        <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input
                                value={profile.first_name || ''}
                                onChange={e =>
                                    setProfile({ ...profile, first_name: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input
                                value={profile.last_name || ''}
                                onChange={e =>
                                    setProfile({ ...profile, last_name: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input
                                value={profile.company_name || ''}
                                onChange={e =>
                                    setProfile({ ...profile, company_name: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tax ID / NIP</Label>
                            <Input
                                value={profile.tax_id || ''}
                                onChange={e =>
                                    setProfile({ ...profile, tax_id: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>
                )}

                <h3 className="text-xl font-bold border-b pb-2 mt-8">
                    Payout Details
                </h3>

                <div className="space-y-2">
                    <Label>Bank Account Number (IBAN)</Label>
                    <Input
                        value={profile.bank_account_number || ''}
                        onChange={e => handleIbanChange(e, profile)}
                        required
                        maxLength={34}
                        placeholder="PL12 3456 7890 1234 5678 9012 3456"
                    />
                    <p className="text-xs text-slate-500">
                        Required to receive payouts from your sales or to make purchases.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold border-b pb-2">Address</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Street & Number</Label>
                        <Input
                            value={profile.address?.street || ''}
                            onChange={e =>
                                setProfile({
                                    ...profile,
                                    address: {
                                        ...profile.address,
                                        street: e.target.value
                                    }
                                })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input
                            value={profile.address?.postal_code || ''}
                            onChange={e =>
                                setProfile({
                                    ...profile,
                                    address: {
                                        ...profile.address,
                                        postal_code: e.target.value
                                    }
                                })
                            }
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                            value={profile.address?.city || ''}
                            onChange={e =>
                                setProfile({
                                    ...profile,
                                    address: {
                                        ...profile.address,
                                        city: e.target.value
                                    }
                                })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                            value={profile.address?.country || ''}
                            onChange={e =>
                                setProfile({
                                    ...profile,
                                    address: {
                                        ...profile.address,
                                        country: e.target.value
                                    }
                                })
                            }
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 pt-4">
                <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-bold shadow-md transition-all active:scale-95"
                >
                    Save Profile Data
                </Button>
            </div>
        </form>
    );
};