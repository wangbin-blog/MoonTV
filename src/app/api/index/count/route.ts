/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { indexSearchFromApi } from '@/lib/downstream';
import { getConfig } from '@/lib/config';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type_id = Number(searchParams.get('type')) | 0;
  const pg = Number(searchParams.get('pg')) | 1;
  const config = (await getConfig()).IndexSource;
  const data = await indexSearchFromApi(config, type_id, pg);
  const responsedata = data;
  return NextResponse.json(responsedata);
}