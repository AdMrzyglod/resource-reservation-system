import { useState, FormEvent } from 'react';
import { useRegister } from '../hooks/useRegister';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const RegisterForm = () => {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const { register, isLoading } = useRegister();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await register({ username, email, password });
    };

    return (
        <Card className="w-full max-w-lg shadow-xl border-slate-200/60">
            <CardHeader className="space-y-2 text-center pb-6">
                <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Create Account
                </CardTitle>
                <CardDescription className="text-base text-slate-500">
                    Join ResourceFlow today. Fill in the details below.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-slate-700 font-medium">
                            Username
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            autoComplete="new-password"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 font-medium">
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="new-password"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-700 font-medium">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-6 text-md bg-indigo-600 hover:bg-indigo-700 mt-2 rounded-xl"
                    >
                        {isLoading ? 'Signing Up...' : 'Sign Up'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};