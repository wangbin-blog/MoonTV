import { NextResponse } from 'next/server';

import { getAvailableApiSites, getCacheTime } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: '请输入搜索关键词' }, { status: 400 });
  }
  const apiSites = await getAvailableApiSites();
  console.log(666666)
  console.log(apiSites)
  const searchPromises = apiSites.filter((site) => site.selected).map((site) => searchFromApi(site, query));


  try {
    const results = await Promise.all(searchPromises);
    const flattenedResults = results.flat();

    return NextResponse.json({ results: flattenedResults });
  } catch (error) {
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}
