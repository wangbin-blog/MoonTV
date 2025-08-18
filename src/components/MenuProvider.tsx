'use client';

import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from 'react';

// 定义菜单项类型
export type MenuItem = {
  icon: string;
  label: string;
  href: string;
};

// 定义MenuContext类型
interface MenuContextType {
  menuItems: MenuItem[];
  loading: boolean;
  error: string | null;
  refreshMenu: (sourceKey?: string) => Promise<void>;
}

// 创建MenuContext并设置默认值
const MenuContext = createContext<MenuContextType>({
  menuItems: [],
  loading: false,
  error: null,
  refreshMenu: async () => {},
});

// 导出useMenu hook
export const useMenu = () => useContext(MenuContext);

// 导出MenuProvider组件
export function MenuProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 从API获取菜单数据的函数
  const fetchMenuItems = useCallback(async (sourceKey?: string) => {
    try {
      setLoading(true);
      setError(null);

      // 如果没有指定源，从localStorage获取选中的首页源
      const effectiveSourceKey = sourceKey || 
        (typeof window !== 'undefined' ? localStorage.getItem('selectedIndexSource') : null) || 'dyttzy';

      // 调用/api/menu接口获取菜单数据
      const response = await fetch(`/api/menu?source=${effectiveSourceKey}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch menu: ${response.status}`);
      }

      const data = await response.json();
      
      // 更新菜单数据
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
      setError(err instanceof Error ? err.message : '加载菜单失败');
      
      // 设置默认菜单作为备用
      setMenuItems([
        { icon: 'Film', label: '电影', href: '/douban/type/movie' },
        { icon: 'Tv', label: '剧集', href: '/douban/type/tv' },
        { icon: 'Clover', label: '综艺', href: '/douban/type/variety' },
        { icon: 'Star', label: '动漫', href: '/douban/type/animation' },
        { icon: 'Music', label: '音乐', href: '/douban/type/music' },
        { icon: 'BookOpen', label: '纪录片', href: '/douban/type/documentary' },
        { icon: 'Gamepad2', label: '游戏', href: '/douban/type/game' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时获取菜单数据
  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // 暴露给Context的方法
  const refreshMenu = useCallback((sourceKey?: string) => fetchMenuItems(sourceKey), [fetchMenuItems]);

  // 监听localStorage中selectedIndexSource的变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedIndexSource' && e.newValue) {
        fetchMenuItems(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchMenuItems]);

  // 提供Context值
  const contextValue: MenuContextType = {
    menuItems,
    loading,
    error,
    refreshMenu,
  };

  return (
    <MenuContext.Provider value={contextValue}>
      {children}
    </MenuContext.Provider>
  );
}