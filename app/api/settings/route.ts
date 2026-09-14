import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { systemSettings } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const settings = await db.query.systemSettings.findMany();
    const settingsMap = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    // Default to the original master password if not set
    if (!settingsMap['ADMIN_PASSWORD']) {
      settingsMap['ADMIN_PASSWORD'] = '@#@MASTER';
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { key, value } = await req.json();

    if (!key || !value) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // Check if it exists
    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key),
    });

    if (existing) {
      await db.update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({ key, value });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
