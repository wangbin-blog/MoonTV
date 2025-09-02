'use client';

import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from 'react';
import { TypeResult } from '@/lib/types';

// 定义菜单项类型
export type MenuItem = {
  icon: string;
  label: string;
  href: string;
};

// 缓存项接口
interface MenuCacheItem {
  data: TypeResult[];
  timestamp: number;
}

// 缓存过期时间（毫秒）- 这里设置为1小时
const CACHE_EXPIRY = 60 * 60 * 1000 * 24 * 30;

// 定义MenuContext类型
interface MenuContextType {
  menuItems: MenuItem[];
  loading: boolean;
  error: string | null;
  refreshMenu: (sourceKey?: string) => Promise<void>;
  getCachedMenuData: (sourceKey: string) => TypeResult[] | null;
  clearMenuCache: (sourceKey?: string) => void;
}

// 创建MenuContext并设置默认值
const MenuContext = createContext<MenuContextType>({
  menuItems: [],
  loading: false,
  error: null,
  refreshMenu: async () => { },
  getCachedMenuData: () => null,
  clearMenuCache: () => { },
});

// 导出useMenu hook
export const useMenu = () => useContext(MenuContext);

// 导出MenuProvider组件
export function MenuProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // 使用state存储全局菜单缓存
  const [menuCache, setMenuCache] = useState<Record<string, MenuCacheItem>>({});

  // 获取缓存数据的方法
  const getCachedMenuData = useCallback((sourceKey: string): TypeResult[] | null => {
    const cacheKey = `menu_type_${sourceKey}`;
    const cachedItem = menuCache[cacheKey];

    if (!cachedItem) return null;

    // 检查是否过期
    const now = Date.now();
    if (now - cachedItem.timestamp > CACHE_EXPIRY) {
      // 过期则删除缓存
      clearMenuCache(sourceKey);
      return null;
    }

    return cachedItem.data;
  }, [menuCache]);

  // 清除缓存的方法
  const clearMenuCache = useCallback((sourceKey?: string) => {
    setMenuCache(prevCache => {
      const newCache = { ...prevCache };

      if (sourceKey) {
        // 清除特定源的缓存
        const cacheKey = `menu_type_${sourceKey}`;
        delete newCache[cacheKey];
        console.log(`[Menu Cache] Cleared cache for source: ${sourceKey}`);
      } else {
        // 清除所有缓存
        Object.keys(newCache).forEach(key => {
          if (key.startsWith('menu_type_')) {
            delete newCache[key];
          }
        });
        console.log('[Menu Cache] Cleared all menu caches');
      }

      return newCache;
    });
  }, []);

  // 从API获取菜单数据的函数
  const fetchMenuItems = useCallback(async (sourceKey?: string) => {
    try {
      setLoading(true);
      setError(null);

      // 如果没有指定源，从localStorage获取选中的首页源
      const effectiveSourceKey = sourceKey ||
        (typeof window !== 'undefined' ? localStorage.getItem('selectedIndexSource') : null) || 'dyttzy';

      // 首先尝试从本地缓存获取数据
      const cachedData = getCachedMenuData(effectiveSourceKey);
      if (cachedData) {
        console.log(`[Menu Cache] Using client-side cached data for source: ${effectiveSourceKey}`);
        // 使用缓存数据生成菜单项
        const menuItemsFromCache = cachedData
          .filter(x => x.type_pid == 0)
          .map(x => ({
            icon: 'Film', // 这里可以根据需要添加图标映射
            label: x.type_name,
            href: `/douban?type=${x.type_id}`,
          }));
        setMenuItems(menuItemsFromCache);
        setLoading(false);
        return;
      }

      // 如果没有缓存或需要刷新，调用API获取原始数据
      console.log(`[Menu Cache] Fetching raw data from API for source: ${effectiveSourceKey}`);
      const response = await fetch(`/api/menu?source=${effectiveSourceKey}&refresh=true&raw=true`);
      if (!response.ok) {
        throw new Error(`Failed to fetch menu: ${response.status}`);
      }

      const rawData = await response.json();

      // 缓存原始数据
      if (rawData.length > 0) {
        const cacheKey = `menu_type_${effectiveSourceKey}`;
        setMenuCache(prevCache => ({
          ...prevCache,
          [cacheKey]: {
            data: rawData,
            timestamp: Date.now()
          }
        }));
        console.log(`[Menu Cache] Raw data cached successfully for key: ${cacheKey}`);
      } else {
        setError('没有获取到菜单数据，请切换数据源后重试');
        return;
      }

      // 生成菜单项
      const apiMenuItems = rawData
        .filter((x: TypeResult) => x.type_pid == 0)
        .map((x: TypeResult) => ({
          icon: 'Film', // 这里可以根据需要添加图标映射
          label: x.type_name,
          href: `/douban?type=${x.type_id}`,
        }));

      // 更新菜单数据
      setMenuItems(apiMenuItems.length > 0 ? apiMenuItems : []);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
      setError(err instanceof Error ? err.message : '加载菜单失败');
    } finally {
      setLoading(false);
    }
  }, [getCachedMenuData, setMenuCache]);

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
    getCachedMenuData,
    clearMenuCache,
  };

  return (
    <MenuContext.Provider value={contextValue}>
      {children}
    </MenuContext.Provider>
  );
}