/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { typeFromApi } from '@/lib/downstream';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type_pid = Number(searchParams.get('type')) | 0;
  const results = await typeFromApi();
  // 过滤并映射结果为menuItems格式
  const apiMenuItems = results
    .filter(x => x.type_pid === type_pid)
    .map(x => ({
      label: x.type_name,
      value: x.type_id,
    }));

  // 如果没有匹配的结果，返回默认菜单
  const responseMenuItems = apiMenuItems.length > 0 ? apiMenuItems : [];

  return NextResponse.json(responseMenuItems);
}