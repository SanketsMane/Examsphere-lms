import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Correct import
import { headers } from "next/headers";
import { formatPriceSimple } from "@/lib/currency";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, GraduationCap } from "lucide-react";
import { BundlePurchaseButton } from "./_components/BundlePurchaseButton";

export const dynamic = "force-dynamic";

export default async function PublicBundlePage({ params }: { params: { id: string } }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const userCountry = (session?.user as any)?.country || "India";

    const bundle = await prisma.sessionBundle.findUnique({
        where: { id: params.id },
        include: {
            teacher: {
                include: {
                    user: true
                }
            }
        }
    });

    if (!bundle || !bundle.isActive) {
        notFound();
    }

    // Calculate generic savings (assuming standard session price ~2000 INR or $25)
    // This is just for display if we don't have a "standard price" field.
    // Or we can just omit "Savings" if not calculated.
    // Better to show price per session.
    const pricePerSession = bundle.price / bundle.sessionCount;

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <Badge className="mb-4">Session Bundle</Badge>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">{bundle.title}</h1>
                        <p className="text-xl text-muted-foreground">{bundle.description}</p>
                    </div>

                    <div className="flex items-center gap-4 py-4">
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage src={bundle.teacher.user.image || undefined} />
                            <AvatarFallback>{bundle.teacher.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{bundle.teacher.user.name}</p>
                            <p className="text-sm text-muted-foreground">Bundle Creator</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">What's Included</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium">{bundle.sessionCount} Live Sessions</p>
                                    <p className="text-muted-foreground text-sm">Valid for booking any 1-on-1 session with this teacher.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium">Flexible Scheduling</p>
                                    <p className="text-muted-foreground text-sm">Book sessions at your convenience based on teacher availability.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <GraduationCap className="h-5 w-5 text-purple-600 mt-0.5" />
                                <div>
                                    <p className="font-medium">Personalized Learning</p>
                                    <p className="text-muted-foreground text-sm">Tailored instruction to meet your specific goals.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Sidebar / Pricing Card */}
                <div>
                    <Card className="sticky top-8 border-2 border-primary/10 shadow-lg">
                        <CardHeader className="bg-primary/5 pb-4">
                            <CardTitle>Purchase Bundle</CardTitle>
                            <CardDescription>Secure your sessions today</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="text-center">
                                <span className="text-3xl font-bold text-primary">
                                    {formatPriceSimple(bundle.price, userCountry)}
                                </span>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Only {formatPriceSimple(pricePerSession, userCountry)} per session
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Total Sessions</span>
                                    <span className="font-medium">{bundle.sessionCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Validity</span>
                                    <span className="font-medium">Lifetime</span>
                                </div>
                            </div>

                            <BundlePurchaseButton 
                                bundleId={bundle.id}
                                price={bundle.price}
                                title={bundle.title}
                                disabled={!session} // Require login
                            />

                            {!session && (
                                <p className="text-xs text-center text-red-500 mt-2 gap-1">
                                    Please <a href="/login" className="underline">login</a> to purchase
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
