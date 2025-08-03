/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { typeFromApi } from '@/lib/downstream';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type_pid = Number(searchParams.get('type')) | 0;
  const results = await typeFromApi();

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

  // 过滤并映射结果为menuItems格式
  const apiMenuItems = results
    .filter(x => x.type_pid === type_pid)
    .map(x => ({
      icon: iconMap[x.type_name] || 'Film', // 默认使用Film图标
      label: x.type_name,
      href: `/douban?type=${x.type_id}`,
    }));

  // 如果没有匹配的结果，返回默认菜单
  const responseMenuItems = apiMenuItems.length > 0 ? apiMenuItems : menuItems;

  return NextResponse.json(responseMenuItems);
}