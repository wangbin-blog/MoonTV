/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { typeFromApi } from '@/lib/downstream';

export async function GET(request: Request) {
  // const apiMenuItems = await typeFromApi();
  // // 如果没有匹配的结果，返回默认菜单
  // const responseMenuItems = apiMenuItems.length > 0 ? apiMenuItems : [];
  return NextResponse.json([]);
}