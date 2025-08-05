/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { indexSearchFromApi } from '@/lib/downstream';
import { getConfig } from '@/lib/config';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type_id = Number(searchParams.get('type')) | 0;
  const pg = Number(searchParams.get('type')) | 1;
  const config = (await getConfig()).IndexSource;
  const data = await indexSearchFromApi(config, `&t=${type_id}&h=&pg=${pg}&pagesize=25&wd=&at=&year=&sort_direction=desc`);
  const responsedata = data;
  return NextResponse.json(responsedata);
}