/* eslint-disable no-console,react-hooks/exhaustive-deps */

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getDoubanCategories } from '@/lib/douban.client';
import { DoubanItem, SearchResult, ApiSearchItem } from '@/lib/types';

import DoubanCardSkeleton from '@/components/DoubanCardSkeleton';
import DoubanSelector from '@/components/DoubanSelector';
import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';
import { cleanHtmlTags } from '@/lib/utils';

function DoubanPageClient() {
  const searchParams = useSearchParams();
  const [doubanData, setDoubanData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectorsReady, setSelectorsReady] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const type = searchParams.get('type') || 'movie';

  const [secondarySelection, setSecondarySelection] = useState<string>();

  // 初始化时标记选择器为准备好状态
  useEffect(() => {
    // 短暂延迟确保初始状态设置完成
    const timer = setTimeout(() => {
      setSelectorsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []); // 只在组件挂载时执行一次

  // type变化时立即重置selectorsReady（最高优先级）
  useEffect(() => {
    setSelectorsReady(false);
    setLoading(true); // 立即显示loading状态
  }, [type]);

  // 当type变化时重置选择器状态
  useEffect(() => {
    // 使用短暂延迟确保状态更新完成后标记选择器准备好
    const timer = setTimeout(() => {
      setSelectorsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [type]);

  // 生成骨架屏数据
  const skeletonData = Array.from({ length: 25 }, (_, index) => index);

  // 生成API请求参数的辅助函数
  const getRequestParams = useCallback(
    (pageStart: number) => {
      // 当type为tv或show时，kind统一为'tv'，category使用type本身
      if (type === 'tv' || type === 'show') {
        return {
          kind: 'tv' as const,
          category: type,
          type: secondarySelection,
          pageLimit: 25,
          pageStart,
        };
      }

      // 电影类型保持原逻辑
      return {
        kind: type as 'tv' | 'movie',
        type: secondarySelection,
        pageLimit: 25,
        pageStart,
      };
    },
    [type, secondarySelection]
  );
  let index_pg = 1;
  // 防抖的数据加载函数
  const loadInitialData = useCallback(async () => {
    try {
      if (secondarySelection == undefined)
        return;
      setLoading(true);
      const countresponse = await fetch(`/api/index/count?type=${secondarySelection}&pg=${currentPage + 1}`);
      if (!countresponse.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await countresponse.json();
      if (
        !data ||
        !data.list ||
        !Array.isArray(data.list) ||
        data.list.length === 0
      ) {
        return [];
      }
      // 处理第一页结果
      const results = data.list.map((item: ApiSearchItem) => {
        return {
          id: item.vod_id.toString(),
          title: item.vod_name.trim().replace(/\s+/g, ' '),
          poster: item.vod_pic,
          class: item.vod_class,
          year: item.vod_year
            ? item.vod_year.match(/\d{4}/)?.[0] || ''
            : 'unknown',
          desc: cleanHtmlTags(item.vod_content || ''),
          type_name: item.type_name,
          douban_id: item.vod_douban_id,
        };
      });
      setDoubanData(results);
      setHasMore(data.page < data.pagecount);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  }, [type, secondarySelection, getRequestParams]);

  // 只在选择器准备好后才加载数据
  useEffect(() => {
    // 只有在选择器准备好时才开始加载
    if (!selectorsReady) {
      return;
    }

    // 重置页面状态
    setDoubanData([]);
    setCurrentPage(0);
    setHasMore(true);
    setIsLoadingMore(false);

    // 清除之前的防抖定时器
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 使用防抖机制加载数据，避免连续状态更新触发多次请求
    debounceTimeoutRef.current = setTimeout(() => {
      loadInitialData();
    }, 100); // 100ms 防抖延迟

    // 清理函数
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    selectorsReady,
    type,
    secondarySelection,
    loadInitialData,
  ]);

  // 单独处理 currentPage 变化（加载更多）
  useEffect(() => {
    if (currentPage > 0) {
      const fetchMoreData = async () => {
        try {
          setIsLoadingMore(true);

          setLoading(true);
          const countresponse = await fetch(`/api/index/count?type=${secondarySelection}&pg=${currentPage + 1}`);
          if (!countresponse.ok) {
            throw new Error('Failed to fetch menu items');
          }
          const data = await countresponse.json();
          if (
            !data ||
            !data.list ||
            !Array.isArray(data.list) ||
            data.list.length === 0
          ) {
            return [];
          }
          // 处理第一页结果
          const results = data.list.map((item: ApiSearchItem) => {
            return {
              id: item.vod_id.toString(),
              title: item.vod_name.trim().replace(/\s+/g, ' '),
              poster: item.vod_pic,
              class: item.vod_class,
              year: item.vod_year
                ? item.vod_year.match(/\d{4}/)?.[0] || ''
                : 'unknown',
              desc: cleanHtmlTags(item.vod_content || ''),
              type_name: item.type_name,
              douban_id: item.vod_douban_id,
            };
          });
          setDoubanData(results);
          setHasMore(data.page < data.pagecount);
          setLoading(false);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingMore(false);
        }
      };

      fetchMoreData();
    }
  }, [currentPage, type, secondarySelection]);

  // 设置滚动监听
  useEffect(() => {
    // 如果没有更多数据或正在加载，则不设置监听
    if (!hasMore || isLoadingMore || loading) {
      return;
    }

    // 确保 loadingRef 存在
    if (!loadingRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        console.log(entries)
        console.log(hasMore)
        console.log(isLoadingMore)
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadingRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loading]);


  const handleSecondaryChange = useCallback(
    (value: string) => {
      // 只有当值真正改变时才设置loading状态
      if (value !== secondarySelection) {
        setLoading(true);
        setSecondarySelection(value);
      }
    },
    [secondarySelection]
  );


  const getActivePath = () => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    const queryString = params.toString();
    const activePath = `/douban${queryString ? `?${queryString}` : ''}`;
    return activePath;
  };

  return (
    <PageLayout activePath={getActivePath()}>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible'>
        {/* 页面标题和选择器 */}
        <div className='mb-6 sm:mb-8 space-y-4 sm:space-y-6'>
          {/* 选择器组件 */}
          <div className='bg-white/60 dark:bg-gray-800/40 rounded-2xl p-4 sm:p-6 border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm'>
            <DoubanSelector
              type={type}
              secondarySelection={secondarySelection}
              onSecondaryChange={handleSecondaryChange}
            />
          </div>
        </div>

        {/* 内容展示区域 */}
        <div className='max-w-[95%] mx-auto mt-8 overflow-visible'>
          {/* 内容网格 */}
          <div className='grid grid-cols-3 gap-x-2 gap-y-12 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:gap-x-8 sm:gap-y-20'>
            {loading || !selectorsReady
              ? // 显示骨架屏
              skeletonData.map((index) => <DoubanCardSkeleton key={index} />)
              : // 显示实际数据
              doubanData.map((item, index) => (
                <div key={`${item.title}-${index}`} className='w-full'>
                  <VideoCard
                    from='douban'
                    title={item.title}
                    poster={item.poster}
                    douban_id={item.id}
                    rate={item.type_name}
                    year={item.year}
                    type={type === 'movie' ? 'movie' : ''} // 电影类型严格控制，tv 不控
                  />
                </div>
              ))}
          </div>

          {/* 加载更多指示器 */}
          {hasMore && !loading && (
            <div
              ref={(el) => {
                if (el && el.offsetParent !== null) {
                  (
                    loadingRef as React.MutableRefObject<HTMLDivElement | null>
                  ).current = el;
                }
              }}
              className='flex justify-center mt-12 py-8'
            >
              {isLoadingMore && (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-green-500'></div>
                  <span className='text-gray-600'>加载中...</span>
                </div>
              )}
            </div>
          )}

          {/* 没有更多数据提示 */}
          {!hasMore && doubanData.length > 0 && (
            <div className='text-center text-gray-500 py-8'>已加载全部内容</div>
          )}

          {/* 空状态 */}
          {!loading && doubanData.length === 0 && (
            <div className='text-center text-gray-500 py-8'>暂无相关内容</div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function DoubanPage() {
  return (
    <Suspense>
      <DoubanPageClient />
    </Suspense>
  );
}
