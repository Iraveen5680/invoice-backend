import React from 'react';
import { X, Check } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MultiSelect({ options, value, onChange, placeholder, className }) {
    const [open, setOpen] = React.useState(false);
    const selectedValues = new Set(value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal h-auto", className)}
                >
                    <div className="flex gap-1 flex-wrap">
                        {selectedValues.size > 0 ? (
                            options
                                .filter((option) => selectedValues.has(option.value))
                                .map((option) => (
                                    <Badge
                                        variant="secondary"
                                        key={option.value}
                                        className="mr-1 mb-1"
                                    >
                                        {option.label}
                                    </Badge>
                                ))
                        ) : (
                            <span className="text-slate-500">{placeholder}</span>
                        )}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => {
                            const isSelected = selectedValues.has(option.value);
                            return (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => {
                                        if (isSelected) {
                                            selectedValues.delete(option.value);
                                        } else {
                                            selectedValues.add(option.value);
                                        }
                                        onChange(Array.from(selectedValues));
                                    }}
                                >
                                    <div
                                        className={cn(
                                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                            isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                                        )}
                                    >
                                        <Check className={cn('h-4 w-4')} />
                                    </div>
                                    <span>{option.label}</span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}