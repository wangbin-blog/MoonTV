'use client';

import { Home, Menu, Search, Film, Tv, Clover, Star, Music, BookOpen, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';

import { useSite } from './SiteProvider';

// 定义图标映射
const iconComponents: Record<string, React.ElementType> = {
  Film: Film,
  Tv: Tv,
  Clover: Clover,
  Star: Star,
  Music: Music,
  BookOpen: BookOpen,
  Gamepad2: Gamepad2,
};

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

type MenuItem = {
  icon: string;
  label: string;
  href: string;
};

interface SidebarContextType {
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType>({ isCollapsed: false });

export const useSidebar = () => useContext(SidebarContext);

// 可替换为你自己的 logo 图片
const Logo = () => {
  const { siteName } = useSite();
  return (
    <Link
      href='/'
      className='flex items-center justify-center h-16 select-none hover:opacity-80 transition-opacity duration-200'
    >
      <span className='text-2xl font-bold text-green-600 tracking-tight'>{siteName}</span>
    </Link>
  );
};

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
  activePath?: string;
}

// 在浏览器环境下通过全局变量缓存折叠状态，避免组件重新挂载时出现初始值闪烁
declare global {
  interface Window {
    __sidebarCollapsed?: boolean;
  }
}

const Sidebar = ({ onToggle, activePath = '/' }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 若同一次 SPA 会话中已经读取过折叠状态，则直接复用，避免闪烁
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.__sidebarCollapsed === 'boolean'
    ) {
      return window.__sidebarCollapsed;
    }
    return false; // 默认展开
  });

  // 菜单数据状态
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // 激活路径状态
  const [active, setActive] = useState(activePath);

  // 监听路径变化，更新激活状态
  useEffect(() => {
    if (pathname && searchParams) {
      const newActivePath = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      setActive(newActivePath);
    }
  }, [pathname, searchParams]);

  // 处理折叠状态变化
  const handleToggle = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (typeof window !== 'undefined') {
      window.__sidebarCollapsed = newCollapsed;
    }
    if (onToggle) {
      onToggle(newCollapsed);
    }
  }, [isCollapsed, onToggle]);

  // 获取侧边栏内容
  const getSidebarContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 定义默认的菜单项目
      const defaultItems: MenuItem[] = [
        { icon: 'Film', label: '电影', href: '/douban/type/movie' },
        { icon: 'Tv', label: '剧集', href: '/douban/type/tv' },
        { icon: 'Clover', label: '综艺', href: '/douban/type/variety' },
        { icon: 'Star', label: '动漫', href: '/douban/type/animation' },
        { icon: 'Music', label: '音乐', href: '/douban/type/music' },
        { icon: 'BookOpen', label: '纪录片', href: '/douban/type/documentary' },
        { icon: 'Gamepad2', label: '游戏', href: '/douban/type/game' },
      ];

      setMenuItems(defaultItems);
    } catch (err) {
      console.error('Failed to load sidebar content:', err);
      setError('加载侧边栏内容失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时获取内容
  useEffect(() => {
    getSidebarContent();
  }, [getSidebarContent]);

  const contextValue = { isCollapsed };

  // 图标组件
  const IconComponent = ({ name }: { name: string }) => {
    const Icon = iconComponents[name];
    if (!Icon) return null;
    return <Icon className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400 dark:data-[active=true]:text-green-400' />;
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* 在移动端隐藏侧边栏 */}
      <div className='hidden md:flex'>
        <aside
          className={`fixed left-0 top-0 z-30 h-full border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-64'}`}
          style={{ boxShadow: isCollapsed ? 'none' : '0 0 10px rgba(0, 0, 0, 0.05)' }}
        >
          <div className={`h-full flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
            <Logo />

            <div className='flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1'>
              <Link
                href='/'
                onClick={() => setActive('/')}
                data-active={active === '/'}
                className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-green-400 dark:data-[active=true]:bg-green-500/10 dark:data-[active=true]:text-green-400 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'} gap-3 justify-start`}
              >
                <div className='w-4 h-4 flex items-center justify-center'>
                  <Home className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400 dark:data-[active=true]:text-green-400' />
                </div>
                {!isCollapsed && <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>首页</span>}
              </Link>
              
              <Link
                href='/search'
                onClick={() => setActive('/search')}
                data-active={active === '/search'}
                className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-green-400 dark:data-[active=true]:bg-green-500/10 dark:data-[active=true]:text-green-400 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'} gap-3 justify-start`}
              >
                <div className='w-4 h-4 flex items-center justify-center'>
                  <Search className='h-4 w-4 text-gray-500 group-hover:text-green-600 data-[active=true]:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400 dark:data-[active=true]:text-green-400' />
                </div>
                {!isCollapsed && <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>搜索</span>}
              </Link>

              {!loading && !error && (
                <>
                  <div className={`text-xs text-gray-500 uppercase tracking-wider py-2 px-4 ${isCollapsed ? 'hidden' : ''}`}>分类浏览</div>
                  {menuItems.map((item) => {
                    // 检查当前路径是否包含分类标签
                    const tagMatch = /tag=([^&]+)/.exec(active);
                    // 提取分类类型
                    const typeMatch = item.href.split('/').pop() || '';
                    
                    // 解码URL以进行正确的比较
                    const decodedActive = decodeURIComponent(active);
                    const decodedItemHref = decodeURIComponent(item.href);

                    const isActive = 
                      decodedActive === decodedItemHref ||
                      (decodedActive.startsWith('/douban') &&
                        decodedActive.includes(`type=${typeMatch}`) &&
                        tagMatch &&
                        decodedActive.includes(`tag=${tagMatch}`));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setActive(item.href)}
                        data-active={isActive}
                        className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-green-600 data-[active=true]:bg-green-500/20 data-[active=true]:text-green-700 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-green-400 dark:data-[active=true]:bg-green-500/10 dark:data-[active=true]:text-green-400 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'} gap-3 justify-start`}
                      >
                        <div className='w-4 h-4 flex items-center justify-center'>
                          <IconComponent name={item.icon} />
                        </div>
                        {!isCollapsed && <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>{item.label}</span>}
                      </Link>
                    );
                  })}
                </>
              )}

              {loading && (
                <div className='py-4 px-4 space-y-2'>
                  <div className='h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse'></div>
                  <div className='h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse'></div>
                  <div className='h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse'></div>
                </div>
              )}

              {error && (
                <div className='py-4 px-4 text-sm text-red-500 dark:text-red-400'>{error}</div>
              )}
            </div>

            <div className='p-2 border-t border-gray-200 dark:border-gray-800'>
              <button
                onClick={handleToggle}
                className={`w-full flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors`}
                aria-label={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
              >
                <Menu className={`h-5 w-5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
                {!isCollapsed && <span className='ml-2 text-sm'>{isCollapsed ? '展开' : '折叠'}</span>}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
