"use client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  CaretSortIcon,
  CheckIcon,
  PlusIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { swrFetcher, tsvFetcher } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const CHAR_MAP = "CM7WD6N4RHF9ZL3XKQGVPBTJY";
const BASE = CHAR_MAP.length;
const EPOCH = new Date("2016-02-01");

let stores: string[] = [];

const encode = (num: number) => {
  let encoded = "";

  while (num >= BASE) {
    encoded = CHAR_MAP[num % BASE] + encoded;
    num = Math.floor(num / BASE);
  }

  return CHAR_MAP[num] + encoded;
};

const decode = (encoded: string) => {
  let num = 0;

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i];
    const exp = encoded.length - i - 1;
    num += Math.pow(BASE, exp) * CHAR_MAP.indexOf(char);
  }

  return num;
};

const getMinutesSinceEpoch = (purchased: string) => {
  const date = new Date(purchased);
  return (
    (date.getTime() - EPOCH.getTime()) / 1000 / 60 - date.getTimezoneOffset()
  );
};

function getCheckDigit(code: string) {
  const chars = code.split("").reverse();
  let checkDigit = 0;

  for (let i = 0; i < chars.length; i++) {
    let value = decode(chars[i]);

    if (i % 2 === 0) {
      value *= 2;
      const encoded = encode(value);

      if (encoded.length === 2) {
        value = [...encoded].map(decode).reduce((total, num) => total + num, 0);
      }
    }

    checkDigit += value;
  }

  checkDigit %= BASE;

  if (checkDigit > 0) {
    checkDigit = BASE - checkDigit;
  }

  return checkDigit;
}

function generateCode(storeId: number, orderId: number, purchased: string) {
  const encStoreId = encode(storeId).padStart(3, encode(0));
  const encOrderId = encode((orderId % 100) + 125);
  const encMinutes = encode(getMinutesSinceEpoch(purchased)).padStart(
    5,
    encode(0)
  );

  let code = encStoreId + encode(3) + encOrderId + encMinutes;

  code += encode(getCheckDigit(code));

  return code.match(/.{4}/g)!.join("-");
}

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export default function MacciesGen() {
  const [date, setDate] = useState<Date>();
  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [storeID, setStoreID] = useState<number>();
  const [orderID, setOrderID] = useState<number>(rand(1000, 2000));
  const [timeHour, setTimeHour] = useState<string>(rand(0, 23).toString());
  const [timeMinute, setTimeMinute] = useState<string>(rand(0, 59).toString());

  const computedCode = useMemo(() => {
    if (!date || !storeID) return "";
    const time = `${timeHour}:${timeMinute}`;
    const dateWithTime = `${date.toISOString().split("T")[0]}T${time}Z`;
    return generateCode(storeID, orderID, dateWithTime);
  }, [date, storeID, orderID, timeHour, timeMinute]);

  useEffect(() => {
    if (timeHour.length < 2) setTimeHour(timeHour.padStart(2, "0"));
    if (timeMinute.length < 2) setTimeMinute(timeMinute.padStart(2, "0"));
    if (timeHour.length > 2 || timeMinute.length > 2) {
      setTimeHour(timeHour.slice(0, 2));
      setTimeMinute(timeMinute.slice(0, 2));
    }

    if (Number(timeHour) > 24) setTimeHour("24");
    if (Number(timeMinute) > 59) setTimeMinute("59");
  }, [timeHour, timeMinute]);

  const {
    data: stores,
    isLoading,
    error,
  } = useSWR("/stores.tsv", tsvFetcher, {
    refreshInterval: 60 * 60 * 24 * 365,
  });

  if (isLoading) return <div>Loading your mcdonalds stores...</div>;
  if (error || !stores) return <div>Error: {error.message}</div>;

  return (
    <ScrollArea className="h-full max-h-[calc(100vh-2rem)]">
      <div className="h-full px-4 py-6 lg:px-8">
        <div className="flex flex-col items-center w-full">
          <div className="flex justify-center w-full">
            <div className="grid flex-grow max-w-lg items-center gap-1.5">
              <Label>Store Name</Label>
              <Popover open={storePickerOpen} onOpenChange={setStorePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={storePickerOpen}
                    className="justify-between"
                  >
                    {storeID ? stores[storeID] : "Select store..."}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search stores..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        No store found (this search is non-functional, just
                        scroll instead).
                      </CommandEmpty>
                      <CommandGroup>
                        {Object.entries(stores).map(([key, value]) => (
                          <CommandItem
                            key={key}
                            value={key}
                            onSelect={(currentValue) => {
                              setStoreID(Number(key));
                              setStorePickerOpen(false);
                            }}
                          >
                            {value}
                            <CheckIcon
                              className={cn(
                                "ml-auto h-4 w-4",
                                value === key ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Label className="mt-6 ">Order Date</Label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Label className="mt-6 ">Order ID</Label>
              <div className="flex items-center">
                <span className="font-mono text-xl mr-4">{orderID}</span>
                <Button
                  variant="outline"
                  onClick={() => setOrderID(rand(1000, 2000))}
                >
                  <ReloadIcon className="h-4 w-4 mr-2" />
                  Randomise
                </Button>
              </div>

              <Label className="mt-6 ">Order Time</Label>
              <div className="flex items-center">
                <InputOTP maxLength={2} value={timeHour} onChange={setTimeHour}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                </InputOTP>

                <span role="separator" className="mx-2">
                  :
                </span>
                <InputOTP
                  maxLength={2}
                  value={timeMinute}
                  onChange={setTimeMinute}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                </InputOTP>
                <span className="ml-2 text-sm">(24hour time)</span>
              </div>

              <Label className="mt-6 ">Your Code</Label>
              <div className="flex items-center">
                {computedCode ? (
                  <span className="font-mono text-xl mr-4 font-medium">
                    {computedCode}
                  </span>
                ) : (
                  <span className="font-mono text-sm mr-4 text-red-500">
                    * Please fill in the above details first
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
