/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { typeFromApi } from '@/lib/downstream';
import { TypeResult } from '@/lib/types';
// 菜单数据
const menuItems = [
  {
    icon: 'Film',
    label: '电影',
    href: '/douban?type=movie',
  },
  {
    icon: 'Tv',
    label: '剧集',
    href: '/douban?type=tv',
  },
  {
    icon: 'Clover',
    label: '综艺',
    href: '/douban?type=show',
  },
];
// 定义类型名称到图标的映射
const iconMap: Record<string, string> = {
  '电影': 'Film',
  '剧集': 'Tv',
  '综艺': 'Clover',
  '动漫': 'Star',
  '音乐': 'Music',
  '纪录片': 'BookOpen',
  '游戏': 'Gamepad2',
};

// 内存缓存实现 - 适合服务器端环境
interface CacheItem {
  data: TypeResult[];
  timestamp: number;
}

// 缓存对象
const memoryCache: Record<string, CacheItem> = {};

// 缓存过期时间（毫秒）- 这里设置为1小时
const CACHE_EXPIRY = 60 * 60 * 1000 * 24 * 30;

// 从缓存获取数据
const getCachedData = (key: string): TypeResult[] | null => {
  const cachedItem = memoryCache[key];
  if (!cachedItem) return null;

  // 检查是否过期
  const now = Date.now();
  if (now - cachedItem.timestamp > CACHE_EXPIRY) {
    // 过期则删除缓存
    delete memoryCache[key];
    return null;
  }

  return cachedItem.data;
};

// 保存数据到缓存
const setCachedData = (key: string, data: TypeResult[]): void => {
  memoryCache[key] = {
    data,
    timestamp: Date.now()
  };
};
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || '';

  // 缓存键，包含source以支持不同源的缓存
  const cacheKey = `menu_type_${source}`;

  // 尝试从缓存获取数据
  console.log(`[Menu Cache] Checking cache for key: ${cacheKey}`);
  let results = getCachedData(cacheKey);

  if (results) {
    console.log(`[Menu Cache] Cache hit! Found ${results.length} items`);
  } else {
    console.log(`[Menu Cache] Cache miss, fetching from API...`);
    // 如果缓存不存在或已过期，则从API获取数据
    results = await typeFromApi(source);
    console.log(`[Menu Cache] API returned ${results.length} items`);

    // 保存数据到内存缓存
    if (results.length > 0) {
      setCachedData(cacheKey, results);
      console.log(`[Menu Cache] Data cached successfully for key: ${cacheKey}`);
    }
  }

  console.log(`[Menu Cache] Final results count: ${results.length}`);

  // 过滤并映射结果为menuItems格式
  const apiMenuItems = results
    .filter(x => x.type_pid == 0)
    .map(x => ({
      icon: iconMap[x.type_name] || 'Film', // 默认使用Film图标
      label: x.type_name,
      href: `/douban?type=${x.type_id}`,
    }));

  // 如果没有匹配的结果，返回默认菜单
  const responseMenuItems = apiMenuItems.length > 0 ? apiMenuItems : menuItems;

  return NextResponse.json(responseMenuItems);
}