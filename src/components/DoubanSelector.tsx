/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SelectorOption {
  label: string;
  value: string;
}

interface DoubanSelectorProps {
  type: string;
  secondarySelection?: string;
  onSecondaryChange: (value: string) => void;
}

const DoubanSelector: React.FC<DoubanSelectorProps> = ({
  type,
  secondarySelection,
  onSecondaryChange,
}) => {
  // 为不同的选择器创建独立的refs和状态
  const primaryContainerRef = useRef<HTMLDivElement>(null);
  const primaryButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [primaryIndicatorStyle, setPrimaryIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  const secondaryContainerRef = useRef<HTMLDivElement>(null);
  const secondaryButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [secondaryIndicatorStyle, setSecondaryIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  type showOptions = {
    label: string;
    value: string;
  };
  const [showOptions, setShowOptions] = useState<showOptions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // 从API获取菜单数据
  useEffect(() => {
    fetchMenuItems();
  }, []);
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/type?type=${type}`);
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      setShowOptions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  // 更新指示器位置的通用函数
  const updateIndicatorPosition = (
    activeIndex: number,
    containerRef: React.RefObject<HTMLDivElement>,
    buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>,
    setIndicatorStyle: React.Dispatch<
      React.SetStateAction<{ left: number; width: number }>
    >
  ) => {
    if (
      activeIndex >= 0 &&
      buttonRefs.current[activeIndex] &&
      containerRef.current
    ) {
      const timeoutId = setTimeout(() => {
        const button = buttonRefs.current[activeIndex];
        const container = containerRef.current;
        if (button && container) {
          const buttonRect = button.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          if (buttonRect.width > 0) {
            setIndicatorStyle({
              left: buttonRect.left - containerRect.left,
              width: buttonRect.width,
            });
          }
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  };

  // 组件挂载时立即计算初始位置
  useEffect(() => {
    // 重新获取分类数据
    fetchMenuItems();
    // 副选择器初始位置
    let secondaryActiveIndex = -1;
    secondaryActiveIndex = showOptions.findIndex(
      (opt) => opt.value === (showOptions[0].value)
    );

    if (secondaryActiveIndex >= 0) {
      onSecondaryChange(showOptions[0].value)
      updateIndicatorPosition(
        secondaryActiveIndex,
        secondaryContainerRef,
        secondaryButtonRefs,
        setSecondaryIndicatorStyle
      );
    }
  }, [type]); // 只在type变化时重新计算

  // 监听副选择器变化
  useEffect(() => {
    let activeIndex = -1;
    let options: SelectorOption[] = [];
    activeIndex = showOptions.findIndex(
      (opt) => opt.value === secondarySelection
    );
    options = showOptions;


    if (options.length > 0) {
      const cleanup = updateIndicatorPosition(
        activeIndex,
        secondaryContainerRef,
        secondaryButtonRefs,
        setSecondaryIndicatorStyle
      );
      return cleanup;
    }
  }, [secondarySelection]);

  // 渲染胶囊式选择器
  const renderCapsuleSelector = (
    options: SelectorOption[],
    activeValue: string | undefined,
    onChange: (value: string) => void,
    isPrimary = false
  ) => {
    const containerRef = isPrimary
      ? primaryContainerRef
      : secondaryContainerRef;
    const buttonRefs = isPrimary ? primaryButtonRefs : secondaryButtonRefs;
    const indicatorStyle = isPrimary
      ? primaryIndicatorStyle
      : secondaryIndicatorStyle;

    return (
      <div
        ref={containerRef}
        className='relative inline-flex bg-gray-200/60 rounded-full p-0.5 sm:p-1 dark:bg-gray-700/60 backdrop-blur-sm'
      >
        {/* 滑动的白色背景指示器 */}
        {indicatorStyle.width > 0 && (
          <div
            className='absolute top-0.5 bottom-0.5 sm:top-1 sm:bottom-1 bg-white dark:bg-gray-500 rounded-full shadow-sm transition-all duration-300 ease-out'
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />
        )}

        {options.map((option, index) => {
          const isActive = activeValue === option.value;
          return (
            <button
              key={option.value}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              onClick={() => onChange(option.value)}
              className={`relative z-10 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap ${isActive
                ? 'text-gray-900 dark:text-gray-100 cursor-default'
                : 'text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 cursor-pointer'
                }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
        <div className='overflow-x-auto'>
          {renderCapsuleSelector(
            showOptions,
            secondarySelection,
            onSecondaryChange,
            false
          )}
        </div>
      </div>
    </div>
  );
};

export default DoubanSelector;

