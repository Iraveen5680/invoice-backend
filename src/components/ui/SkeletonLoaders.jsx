import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const TableSkeleton = () => (
    <div className="space-y-3">
        <div className="flex items-center justify-between py-4">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="rounded-md border p-1">
            <div className="space-y-4 p-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-[20%]" />
                        <Skeleton className="h-4 w-[30%]" />
                        <Skeleton className="h-4 w-[20%]" />
                        <Skeleton className="h-4 w-[10%] ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const DashboardSkeleton = () => (
    <div className="space-y-8 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
                    <Skeleton className="h-4 w-[100px] mb-2" />
                    <Skeleton className="h-8 w-[120px]" />
                </div>
            ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 rounded-xl border bg-card p-6">
                <Skeleton className="h-6 w-[150px] mb-4" />
                <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="col-span-3 rounded-xl border bg-card p-6">
                <Skeleton className="h-6 w-[150px] mb-4" />
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center">
                            <Skeleton className="h-9 w-9 rounded-full mr-3" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export const FormSkeleton = () => (
    <div className="space-y-8 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-4 rounded-xl border p-6">
                    <Skeleton className="h-6 w-[150px] mb-4" />
                    {[...Array(4)].map((_, j) => (
                        <div key={j} className="space-y-2">
                            <Skeleton className="h-4 w-[80px]" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export const SettingsSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b pb-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-[100px]" />
            ))}
        </div>
        <div className="rounded-xl border p-6 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-6 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);
