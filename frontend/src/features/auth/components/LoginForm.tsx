import { useState, FormEvent } from 'react';
import { useLogin } from '../hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const LoginForm = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const { login, isLoading } = useLogin();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await login({ email, password });
    };

    return (
        <Card className="w-full max-w-lg shadow-xl border-slate-200/60">
            <CardHeader className="space-y-2 text-center pb-6">
                <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Welcome Back
                </CardTitle>
                <CardDescription className="text-base text-slate-500">
                    Enter your credentials to access ResourceFlow
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="email" className="text-slate-700 font-medium">
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="new-password"
                            className="bg-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="password" className="text-slate-700 font-medium">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            className="bg-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-6 text-md bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};