import { NextResponse } from 'next/server';

type JsonPayload = Record<string, unknown> | unknown[];

export function ok(data: JsonPayload, init?: ResponseInit) {
  return NextResponse.json(data, { status: init?.status ?? 200, headers: init?.headers });
}

export function created(data: JsonPayload, init?: ResponseInit) {
  return NextResponse.json(data, { status: init?.status ?? 201, headers: init?.headers });
}

export function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? null,
      },
    },
    { status }
  );
}
