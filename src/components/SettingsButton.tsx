/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Settings, X, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getConfig } from '@/lib/config';
import { useMenu } from './MenuProvider';

// 数据源类型定义
interface DataSource {
  name: string;
  key: string;
  api: string;
  detail?: string;
  disabled?: boolean;
  from: 'config' | 'custom';
}

export const SettingsButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultAggregateSearch, setDefaultAggregateSearch] = useState(true);
  const [doubanProxyUrl, setDoubanProxyUrl] = useState('');
  const [imageProxyUrl, setImageProxyUrl] = useState('');
  const [enableOptimization, setEnableOptimization] = useState(true);
  const [enableImageProxy, setEnableImageProxy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<string[]>([]);
  const [selectedIndexSource, setSelectedIndexSource] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [config, setConfig] = useState<{ SourceConfig: DataSource[], IndexSource: any } | null>(null);
  const [customSources, setCustomSources] = useState<DataSource[]>([]);
  const [showAddSourceForm, setShowAddSourceForm] = useState(false);
  const [newSource, setNewSource] = useState<Partial<DataSource>>({
    name: '',
    key: '',
    api: '',
    detail: ''
  });

  // 使用MenuProvider提供的refreshMenu方法
  const { refreshMenu } = useMenu();

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 从 localStorage 读取自定义数据源
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCustomSources = localStorage.getItem('customSources');
      if (savedCustomSources) {
        try {
          setCustomSources(JSON.parse(savedCustomSources));
        } catch (error) {
          console.error('Failed to load custom sources:', error);
        }
      }
    }
  }, [mounted]);

  // 保存自定义数据源到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && customSources.length > 0) {
      localStorage.setItem('customSources', JSON.stringify(customSources));
    }
  }, [customSources]);

  // 获取配置数据
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configData = await getConfig();

        // 设置配置数据
        setConfig({
          SourceConfig: configData.SourceConfig,
          IndexSource: configData.SourceConfig
        });

        // 如果是首次加载且没有从localStorage中读取到数据源，则从配置中获取默认选中的数据源
        if (isFirstLoad && selectedDataSource.length === 0) {
          // 找到配置中selected设置为true的第一个数据源
          const defaultSource = configData.SourceConfig.find(source =>
            typeof source.selected === 'boolean' && source.selected
          );

          if (defaultSource) {
            setSelectedDataSource([defaultSource.key]);
            setSelectedIndexSource(defaultSource.key);

            // 如果在客户端环境，保存到localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('selectedDataSource', JSON.stringify([defaultSource.key]));
              localStorage.setItem('selectedIndexSource', defaultSource.key);
            }
          } else if (configData.SourceConfig.length > 0) {
            // 如果没有selected为true的数据源，则使用第一个数据源
            setSelectedDataSource([configData.SourceConfig[0].key]);
            setSelectedIndexSource(configData.SourceConfig[0].key);

            // 如果在客户端环境，保存到localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('selectedDataSource', JSON.stringify([configData.SourceConfig[0].key]));
              localStorage.setItem('selectedIndexSource', configData.SourceConfig[0].key);
            }
          }

          setIsFirstLoad(false);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };

    if (mounted) {
      loadConfig();
    }
  }, [mounted, isFirstLoad, selectedDataSource.length]);

  // 从 localStorage 读取设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAggregateSearch = localStorage.getItem(
        'defaultAggregateSearch'
      );
      if (savedAggregateSearch !== null) {
        setDefaultAggregateSearch(JSON.parse(savedAggregateSearch));
      }

      const savedDoubanProxyUrl = localStorage.getItem('doubanProxyUrl');
      if (savedDoubanProxyUrl !== null) {
        setDoubanProxyUrl(savedDoubanProxyUrl);
      }

      const savedEnableImageProxy = localStorage.getItem('enableImageProxy');
      const defaultImageProxy = (window as any).RUNTIME_CONFIG?.IMAGE_PROXY || '';
      if (savedEnableImageProxy !== null) {
        setEnableImageProxy(JSON.parse(savedEnableImageProxy));
      } else if (defaultImageProxy) {
        // 如果有默认图片代理配置，则默认开启
        setEnableImageProxy(true);
      }

      const savedImageProxyUrl = localStorage.getItem('imageProxyUrl');
      if (savedImageProxyUrl !== null) {
        setImageProxyUrl(savedImageProxyUrl);
      } else if (defaultImageProxy) {
        setImageProxyUrl(defaultImageProxy);
      }

      const savedEnableOptimization = localStorage.getItem('enableOptimization');
      if (savedEnableOptimization !== null) {
        setEnableOptimization(JSON.parse(savedEnableOptimization));
      }

      // 读取数据源设置
      const savedDataSource = localStorage.getItem('selectedDataSource');
      if (savedDataSource !== null) {
        try {
          const parsedData = JSON.parse(savedDataSource);
          setSelectedDataSource(Array.isArray(parsedData) ? parsedData : [parsedData]);
          setIsFirstLoad(false); // 已经从localStorage加载，不再使用默认配置
        } catch {
          // 如果解析失败，保持为空数组，后续会从配置中获取
        }
      }

      // 读取首页源设置
      const savedIndexSource = localStorage.getItem('selectedIndexSource');
      if (savedIndexSource !== null) {
        setSelectedIndexSource(savedIndexSource);
        setIsFirstLoad(false); // 已经从localStorage加载，不再使用默认配置
      }
    }
  }, []);

  // 处理添加自定义数据源
  const handleAddCustomSource = () => {
    if (!newSource.name || !newSource.key || !newSource.api) {
      return;
    }

    const sourceToAdd: DataSource = {
      name: newSource.name,
      key: newSource.key,
      api: newSource.api,
      detail: newSource.detail,
      disabled: false,
      from: 'custom'
    };

    // 检查key是否已存在
    if (customSources.some(s => s.key === sourceToAdd.key)) {
      alert('数据源Key已存在，请使用其他Key');
      return;
    }

    setCustomSources(prev => [...prev, sourceToAdd]);
    setNewSource({ name: '', key: '', api: '', detail: '' });
    setShowAddSourceForm(false);
  };

  // 处理删除自定义数据源
  const handleDeleteCustomSource = (key: string) => {
    setCustomSources(prev => prev.filter(s => s.key !== key));

    // 如果删除的是当前选中的数据源，从选中列表中移除
    setSelectedDataSource(prev => prev.filter(k => k !== key));

    // 如果删除的是当前首页源，重置为默认值
    if (selectedIndexSource === key) {
      setSelectedIndexSource('dyttzy');
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedIndexSource', 'dyttzy');
      }
    }
  };

  // 获取所有可用的数据源（包括自定义）
  const getAllAvailableSources = () => {
    if (!config?.SourceConfig) return [];

    // 合并内置数据源和自定义数据源
    const allSources = [...config.SourceConfig.filter((s: DataSource) => !s.disabled), ...customSources];

    // 去重，优先保留内置数据源
    const uniqueSources = Array.from(
      new Map(allSources.map(s => [s.key, s])).values()
    );

    return uniqueSources;
  };

  // 保存数据源选择到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedDataSource', JSON.stringify(selectedDataSource));
    }
  }, [selectedDataSource]);

  // 保存设置到 localStorage
  const handleAggregateToggle = (value: boolean) => {
    setDefaultAggregateSearch(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(value));
    }
  };

  const handleDoubanProxyUrlChange = (value: string) => {
    setDoubanProxyUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanProxyUrl', value);
    }
  };

  const handleImageProxyUrlChange = (value: string) => {
    setImageProxyUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('imageProxyUrl', value);
    }
  };

  const handleOptimizationToggle = (value: boolean) => {
    setEnableOptimization(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableOptimization', JSON.stringify(value));
    }
  };

  const handleImageProxyToggle = (value: boolean) => {
    setEnableImageProxy(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableImageProxy', JSON.stringify(value));
    }
  };

  // 处理数据源切换
  const handleDataSourceChange = (value: string, isChecked: boolean) => {
    setSelectedDataSource(prev => {
      const newSelection = [...prev];
      if (isChecked && !newSelection.includes(value)) {
        newSelection.push(value);
      } else if (!isChecked) {
        const index = newSelection.indexOf(value);
        if (index > -1) {
          newSelection.splice(index, 1);
        }
        // 确保至少选择一个数据源
        if (newSelection.length === 0 && config?.SourceConfig) {
          const firstAvailable = config.SourceConfig.find((source: any) => !source.disabled);
          if (firstAvailable) {
            newSelection.push(firstAvailable.key);
          }
        }
      }
      return newSelection;
    });
  };

  // 处理首页源切换
  const handleIndexSourceChange = (value: string) => {
    setSelectedIndexSource(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedIndexSource', value);
      // 切换首页源后立即刷新菜单
      refreshMenu(value);
    }
  };

  // 重置数据源和首页源为默认值
  const resetSourcesToDefault = () => {
    setSelectedDataSource(['dyttzy']);
    setSelectedIndexSource('dyttzy');
  };

  const handleSettingsClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClosePanel = () => {
    setIsOpen(false);
  };

  // 重置所有设置为默认值
  const handleResetSettings = () => {
    const defaultImageProxy = (window as any).RUNTIME_CONFIG?.IMAGE_PROXY || '';

    // 重置所有状态
    setDefaultAggregateSearch(true);
    setEnableOptimization(true);
    setDoubanProxyUrl('');
    setEnableImageProxy(!!defaultImageProxy);
    setImageProxyUrl(defaultImageProxy);
    setSelectedDataSource(['dyttzy']);
    setSelectedIndexSource('dyttzy');

    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(true));
      localStorage.setItem('enableOptimization', JSON.stringify(true));
      localStorage.setItem('doubanProxyUrl', '');
      localStorage.setItem(
        'enableImageProxy',
        JSON.stringify(!!defaultImageProxy)
      );
      localStorage.setItem('imageProxyUrl', defaultImageProxy);
      localStorage.setItem('selectedDataSource', JSON.stringify(['dyttzy']));
      localStorage.setItem('selectedIndexSource', 'dyttzy');
    }
  };

  // 设置面板内容
  const settingsPanel = (
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]'
        onClick={handleClosePanel}
      />

      {/* 设置面板 */}
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-xl z-[1001] p-6 flex flex-col'>
        {/* 标题栏 */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <h3 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
              本地设置
            </h3>
            <button
              onClick={handleResetSettings}
              className='px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors'
              title='重置为默认设置'
            >
              重置
            </button>
          </div>
          <button
            onClick={handleClosePanel}
            className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
            aria-label='Close'
          >
            <X className='w-full h-full' />
          </button>
        </div>

        {/* 设置项 - 可滚动区域 */}
        <div className='space-y-6 overflow-y-auto flex-grow pb-4'>
          {/* 数据源选择 */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  数据源选择
                </h4>
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  选择视频内容的数据源（可多选）
                </p>
              </div>
              <button
                onClick={() => setShowAddSourceForm(!showAddSourceForm)}
                className='flex items-center text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
              >
                <Plus className='w-3 h-3 mr-1' />
                {showAddSourceForm ? '取消添加' : '添加数据源'}
              </button>
            </div>

            {/* 添加自定义数据源表单 */}
            {showAddSourceForm && (
              <div className='p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800/50 space-y-2 mb-2'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                  <input
                    type='text'
                    placeholder='数据源名称'
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                  <input
                    type='text'
                    placeholder='数据源Key（唯一标识）'
                    value={newSource.key}
                    onChange={(e) => setNewSource({ ...newSource, key: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <input
                  type='text'
                  placeholder='API地址'
                  value={newSource.api}
                  onChange={(e) => setNewSource({ ...newSource, api: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <input
                  type='text'
                  placeholder='Detail地址（选填）'
                  value={newSource.detail}
                  onChange={(e) => setNewSource({ ...newSource, detail: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <button
                  onClick={handleAddCustomSource}
                  disabled={!newSource.name || !newSource.key || !newSource.api}
                  className='w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md text-sm transition-colors'
                >
                  添加数据源
                </button>
              </div>
            )}

            {/* 数据源列表 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2 max-h-24 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50'>
              {getAllAvailableSources().map((source: DataSource) => (
                <label key={source.key} className='flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors'>
                  <input
                    type='checkbox'
                    className='w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600'
                    checked={selectedDataSource.includes(source.key)}
                    onChange={(e) => handleDataSourceChange(source.key, e.target.checked)}
                  />
                  <span className='text-sm text-gray-700 dark:text-gray-300 flex-grow'>
                    {source.name}
                    {source.from === 'custom' && <span className='text-xs text-gray-500 dark:text-gray-400 ml-1'>(自定义)</span>}
                  </span>
                  {source.from === 'custom' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要删除数据源"${source.name}"吗？`)) {
                          handleDeleteCustomSource(source.key);
                        }
                      }}
                      className='text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors'
                      title='删除数据源'
                    >
                      <Trash2 className='w-3 h-3' />
                    </button>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* 首页源选择 - 修改为radio单选框组 */}
          <div className='space-y-3'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                首页源选择
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                选择首页展示内容的数据源
              </p>
            </div>
            <div
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-y-auto'
              style={{ maxHeight: '84px' }} /* 约3行高度 */
            >
              {getAllAvailableSources().map((source: DataSource) => (
                <label key={source.key} className='flex items-center space-x-2 py-1 block'>
                  <input
                    type="radio"
                    name="indexSource"
                    value={source.key}
                    checked={selectedIndexSource === source.key}
                    onChange={(e) => handleIndexSourceChange(e.target.value)}
                    className='text-blue-500 focus:ring-blue-500 h-4 w-4'
                  />
                  <span>
                    {source.name}
                    {source.from === 'custom' && <span className='text-xs text-gray-500 dark:text-gray-400 ml-1'>(自定义)</span>}
                  </span>
                </label>
              ))}
              {(!config?.SourceConfig || getAllAvailableSources().length === 0) && (
                <div className='text-gray-500 dark:text-gray-400 text-center py-2'>
                  无可用首页源
                </div>
              )}
            </div>
          </div>

          {/* 默认聚合搜索结果 */}
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                默认聚合搜索结果
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                搜索时默认按标题和年份聚合显示结果
              </p>
            </div>
            <label className='flex items-center cursor-pointer'>
              <div className='relative'>
                <input
                  type='checkbox'
                  className='sr-only peer'
                  checked={defaultAggregateSearch}
                  onChange={(e) => handleAggregateToggle(e.target.checked)}
                />
                <div className='w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600'></div>
                <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5'></div>
              </div>
            </label>
          </div>

          {/* 优选和测速 */}
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                启用 优选和测速
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                如出现播放器劫持问题可关闭
              </p>
            </div>
            <label className='flex items-center cursor-pointer'>
              <div className='relative'>
                <input
                  type='checkbox'
                  className='sr-only peer'
                  checked={enableOptimization}
                  onChange={(e) => handleOptimizationToggle(e.target.checked)}
                />
                <div className='w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600'></div>
                <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5'></div>
              </div>
            </label>
          </div>

          {/* 豆瓣代理设置 */}
          <div className='space-y-3'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                豆瓣数据代理
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                设置代理URL以绕过豆瓣访问限制，留空则使用服务端API
              </p>
            </div>
            <input
              type='text'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='例如: https://proxy.example.com/fetch?url='
              value={doubanProxyUrl}
              onChange={(e) => handleDoubanProxyUrlChange(e.target.value)}
            />
          </div>

          {/* 图片代理开关 */}
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                启用图片代理
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                启用后，所有图片加载将通过代理服务器
              </p>
            </div>
            <label className='flex items-center cursor-pointer'>
              <div className='relative'>
                <input
                  type='checkbox'
                  className='sr-only peer'
                  checked={enableImageProxy}
                  onChange={(e) => handleImageProxyToggle(e.target.checked)}
                />
                <div className='w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600'></div>
                <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5'></div>
              </div>
            </label>
          </div>

          {/* 图片代理地址设置 */}
          <div className='space-y-3'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                图片代理地址
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                仅在启用图片代理时生效
              </p>
            </div>
            <input
              type='text'
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${enableImageProxy ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 placeholder-gray-400 dark:placeholder-gray-600 cursor-not-allowed'}`}
              placeholder='例如: https://imageproxy.example.com/?url='
              value={imageProxyUrl}
              onChange={(e) => handleImageProxyUrlChange(e.target.value)}
              disabled={!enableImageProxy}
            />
          </div>
        </div>

        {/* 底部说明 */}
        <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
            这些设置保存在本地浏览器中
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={handleSettingsClick}
        className='w-10 h-10 p-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors'
        aria-label='Settings'
      >
        <Settings className='w-full h-full' />
      </button>

      {/* 使用 Portal 将设置面板渲染到 document.body */}
      {isOpen && mounted && createPortal(settingsPanel, document.body)}
    </>
  );
};
