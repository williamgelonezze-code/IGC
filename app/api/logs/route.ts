import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { accessLogs } from '@/src/db/schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cpf, re, locationData } = body;
    
    // Capture real IPv4 / IPv6 from server headers for maximum reliability
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    
    let serverIp = body.ipAddress || 'unknown';
    if (forwardedFor) {
      serverIp = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      serverIp = realIp.trim();
    }

    if (!cpf || !re) {
      return NextResponse.json({ error: 'CPF and RE are required' }, { status: 400 });
    }

    await db.insert(accessLogs).values({
      cpf,
      re,
      ipAddress: serverIp || null,
      locationData: locationData || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving log:', error);
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const logs = await db.query.accessLogs.findMany({
      orderBy: (accessLogs, { desc }) => [desc(accessLogs.createdAt)],
      limit: 1000,
    });
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
